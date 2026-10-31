// Run with: node --test scripts/check-data-flows.cjs
// Exercise async hook behavior with deterministic React state/effect and DB adapters.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./hook-test-harness.cjs');

const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
function attendanceHarness() {
  const writes = [];
  let nextWrite = async () => ({ data: { present: true, absence_reason: null }, error: null });
  const db = { from() { return {
    select() { return { in() { return { in: async () => ({ data: [], error: null }) }; } }; },
    upsert(row) {
      writes.push(row);
      return { select() { return { single: () => nextWrite() }; } };
    },
  }; } };
  const h = harness('src/hooks/use-attendance.ts', {
    '@/lib/supabase': { supabase: db },
    '@/lib/attendance-dates': {
      formatDateForDb: (date) => date.toISOString().slice(0, 10),
      getAttendanceKey: (id, date) => `${id}:${date.toISOString().slice(0, 10)}`,
    },
  });
  const date = new Date('2026-11-01T12:00:00Z');
  return { writes, date,
    render: (dates = [date]) => h.render(() => h.exports.useAttendance(['member'], dates)),
    respond: (response) => { nextWrite = response; },
  };
}

test('viewing attendance never inserts placeholder records', async () => {
  const h = attendanceHarness();
  h.render();
  await tick();
  assert.equal(h.writes.length, 0);
  assert.equal(h.render().isLoading, false);
});

test('failed saves preserve attendance and reason, and retry can succeed', async () => {
  const h = attendanceHarness();
  h.render();
  await tick();
  h.respond(async () => ({ data: { present: false, absence_reason: '출장' }, error: null }));
  assert.equal(await h.render().setAbsenceReason('member', h.date, '출장'), true);
  h.respond(async () => ({ data: null, error: { message: 'offline' } }));
  assert.equal(await h.render().setPresent('member', h.date, true), false);
  assert.equal(h.render().absenceReasons['member:2026-11-01'], '출장');
  assert.equal(h.render().attendance['member:2026-11-01'], false);
  assert.ok(h.render().error);
  h.respond(async () => ({ data: { present: true, absence_reason: null }, error: null }));
  assert.equal(await h.render().setPresent('member', h.date, true), true);
  assert.equal(h.render().absenceReasons['member:2026-11-01'], undefined);
  assert.equal(h.render().error, null);
});

test('pending saves do not appear saved and duplicate writes are blocked', async () => {
  const h = attendanceHarness();
  h.render();
  await tick();
  const pending = deferred();
  h.respond(() => pending.promise);
  const save = h.render().setPresent('member', h.date, true);
  assert.equal(h.render().isSaving, true);
  assert.equal(h.render().attendance['member:2026-11-01'], undefined);
  assert.equal(await h.render().setPresent('member', h.date, false), false);
  assert.equal(h.writes.length, 1);
  pending.resolve({ data: { present: true, absence_reason: null }, error: null });
  assert.equal(await save, true);
  assert.equal(h.render().isSaving, false);
});

test('network exceptions release the write lock for retry', async () => {
  const h = attendanceHarness();
  h.render();
  await tick();
  h.respond(async () => { throw new Error('network'); });
  assert.equal(await h.render().setPresent('member', h.date, true), false);
  assert.equal(h.render().isSaving, false);
  assert.ok(h.render().error);
});

test('an old month save cannot overwrite the current month state', async () => {
  const h = attendanceHarness();
  h.render();
  await tick();
  const pending = deferred();
  h.respond(() => pending.promise);
  const save = h.render().setPresent('member', h.date, true);
  h.render([new Date('2026-12-06T12:00:00Z')]);
  await tick();
  pending.resolve({ data: { present: true, absence_reason: null }, error: null });
  await save;
  assert.equal(Object.keys(h.render([new Date('2026-12-06T12:00:00Z')]).attendance).length, 0);
});

test('calendar consumers share one fetch and refresh; older responses cannot replace newer data', async () => {
  const requests = [];
  const h = harness('src/contexts/calendar-events.tsx', {
    '@/lib/supabase': { supabase: { from() { return { select() { return { order() {
      const request = deferred();
      requests.push(request);
      return request.promise;
    } }; } }; } } },
    '@/lib/calendar-events': { mapCalendarEventRow: (row) => row },
  });
  const render = () => h.render(() => h.exports.CalendarEventsProvider({ children: null }));
  render();
  const firstConsumer = h.exports.useCalendarEvents();
  const secondConsumer = h.exports.useCalendarEvents();
  assert.equal(firstConsumer, secondConsumer);
  assert.equal(requests.length, 1);
  requests[0].resolve({ data: [{ id: 'initial' }], error: null });
  await tick();
  render();
  const olderRefresh = h.exports.useCalendarEvents().refresh();
  const newerRefresh = h.exports.useCalendarEvents().refresh();
  requests[2].resolve({ data: [{ id: 'new' }], error: null });
  await newerRefresh;
  requests[1].resolve({ data: [{ id: 'old' }], error: null });
  await olderRefresh;
  render();
  assert.equal(h.exports.useCalendarEvents().events[0].id, 'new');
});

function membersHarness(historyError) {
  const h = harness('src/lib/members.ts', {
    '@/lib/supabase': { supabase: { from(table) { return {
      select() {
        if (table === 'members') return Promise.resolve({ data: [{
          id: 'member', name_ko: '성도', name_en: null, cell_leader_id: null,
          photo_path: null, permission: '성도', position: '셀원', gender: 'male',
          dob: '2000-01-01', household_head_id: null,
        }], error: null });
        return { in() { return { order: async () => ({ data: [], error: historyError }) }; } };
      },
    }; } } },
    '@/lib/member-photos': { signMemberPhotoUrls: async () => new Map() },
  });
  return () => h.exports.fetchMembers();
}

test('members with no recorded cell history keep an empty history', async () => {
  const members = await membersHarness(null)();
  assert.equal(members.length, 1);
  assert.equal(members[0].previousCellGroups.length, 0);
});

test('a cell history query failure is exposed instead of generating demo history', async () => {
  await assert.rejects(membersHarness({ message: 'permission denied' })());
});

function membersProviderHarness() {
  const requests = [];
  const h = harness('src/contexts/members.tsx', {
    '@/lib/members': { fetchMembers: () => {
      const request = deferred();
      requests.push(request);
      return request.promise;
    } },
  });
  return { requests, exports: h.exports,
    render: () => h.render(() => h.exports.MembersProvider({ children: null })),
  };
}

test('member consumers share one initial request and all see edits after refresh', async () => {
  const h = membersProviderHarness();
  h.render();
  assert.equal(h.exports.useMembers(), h.exports.useMembers());
  assert.equal(h.requests.length, 1);
  h.requests[0].resolve([{ id: 'member', nameKo: '이전 이름' }]);
  await tick();
  h.render();
  const refresh = h.exports.useMembers().refresh();
  h.requests[1].resolve([{ id: 'member', nameKo: '수정된 이름' }]);
  await refresh;
  h.render();
  assert.equal(h.exports.useMembers().members[0].nameKo, '수정된 이름');
  assert.equal(h.exports.useMembers().isLoading, false);
});

test('member refresh ignores stale responses and keeps existing data on failure', async () => {
  const h = membersProviderHarness();
  h.render();
  const refresh = h.exports.useMembers().refresh();
  h.requests[1].resolve([{ id: 'latest' }]);
  await refresh;
  h.requests[0].resolve([{ id: 'stale' }]);
  await tick();
  h.render();
  assert.equal(h.exports.useMembers().members[0].id, 'latest');
  const failingRefresh = h.exports.useMembers().refresh();
  h.requests[2].reject(new Error('offline'));
  await failingRefresh;
  h.render();
  assert.equal(h.exports.useMembers().members[0].id, 'latest');
  assert.ok(h.exports.useMembers().error);
});

test('both home designs refresh profile, calendar and members before reloading attendance', async () => {
  const members = deferred();
  let profiles = 0;
  let events = 0;
  let memberCalls = 0;
  const refreshProfile = async () => { profiles++; };
  const refreshEvents = async () => { events++; };
  const refreshMembers = () => { memberCalls++; return members.promise; };
  const h = harness('src/hooks/use-home-refresh.ts', {
    '@/contexts/auth-context': { useAuth: () => ({ refreshProfile }) },
    '@/hooks/use-calendar-events': { useCalendarEvents: () => ({ refresh: refreshEvents }) },
    '@/hooks/use-members': { useMembers: () => ({ refresh: refreshMembers }) },
  });
  const render = () => h.render(() => h.exports.useHomeRefresh());
  const pending = render().onRefresh();
  assert.equal(render().refreshing, true);
  assert.equal(render().refreshKey, 0);
  await render().onRefresh(); // Ignore duplicate clicks while a request is pending.
  assert.equal(profiles, 1);
  assert.equal(events, 1);
  assert.equal(memberCalls, 1);
  members.resolve();
  await pending;
  assert.equal(render().refreshing, false);
  assert.equal(render().refreshKey, 1);
});


test('shared member editor refreshes member and profile consumers only after a successful save', async () => {
  let membersRefreshed = 0;
  let profileRefreshed = 0;
  let fail = true;
  const h = harness('src/hooks/use-member-editor.ts', {
    '@/contexts/auth-context': { useAuth: () => ({ refreshProfile: async () => { profileRefreshed++; } }) },
    '@/lib/pick-member-photo': { pickMemberPhoto: async () => null },
    '@/lib/member-photos': { deleteMemberPhoto: async () => {} },
    '@/lib/supabase': { supabase: { from() { return { update() { return {
      eq: async () => ({ error: fail ? { message: 'permission denied' } : null }),
    }; } }; } } },
  });
  const refresh = async () => { membersRefreshed++; };
  const render = () => h.render(() => h.exports.useMemberEditor(refresh));
  render().openEdit({ id: 'member', nameKo: '성도', photoPath: null });
  await render().saveEdit();
  assert.equal(render().editingMember.id, 'member');
  assert.ok(render().editError);
  assert.equal(membersRefreshed, 0);
  assert.equal(profileRefreshed, 0);
  fail = false;
  await render().saveEdit();
  assert.equal(render().editingMember, null);
  assert.equal(membersRefreshed, 1);
  assert.equal(profileRefreshed, 1);
});

test('shared account issuance keeps its form open while saving, then refreshes account and member data', async () => {
  const request = deferred();
  let accountReads = 0;
  let memberRefreshes = 0;
  const h = harness('src/hooks/use-member-account.ts', {
    '@/lib/supabase': { supabase: {
      from() { return { select: async () => { accountReads++; return { data: [] }; } }; },
      functions: { invoke: () => request.promise },
    } },
  });
  const refresh = async () => { memberRefreshes++; };
  const render = () => h.render(() => h.exports.useMemberAccount(refresh));
  render().openIssue({ id: 'member' });
  render().setIssueEmail('member@example.org');
  render().setIssuePassword('temporary-password');
  const saving = render().submitIssue();
  render().closeIssue();
  assert.equal(render().issuingMember.id, 'member');
  request.resolve({ error: null });
  await saving;
  assert.equal(render().issuingMember, null);
  assert.equal(memberRefreshes, 1);
  assert.equal(accountReads, 2);
});
