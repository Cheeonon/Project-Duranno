// Run with: node --test scripts/check-biometric-lock.cjs
const { test } = require('node:test');
const { Buffer } = require('node:buffer');
const assert = require('node:assert/strict');
const { harness } = require('./hook-test-harness.cjs');
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function lockHarness({ enabled = true, fresh = false, native = true, readError = false } = {}) {
  let listener;
  let response = async () => ({ success: true });
  let signOuts = 0;
  let preference = enabled;
  const AppState = { currentState: 'active', addEventListener(_event, callback) {
    listener = callback;
    return { remove() {} };
  } };
  const h = harness('src/contexts/biometric-lock.tsx', {
    'react-native': { AppState, StyleSheet: { create: (value) => value }, View: 'View', ActivityIndicator: 'Spinner' },
    '@/components/themed-text': { ThemedText: 'Text' },
    '@/components/themed-view': { ThemedView: 'Screen' },
    '@/components/ui/button': { Button: 'Button' },
    '@/constants/theme': { Spacing: { three: 12, four: 16 } },
    '@/contexts/auth-context': { useAuth: () => ({ session: { user: { id: 'user' } }, passwordSignInUserId: fresh ? 'user' : null }) },
    '@/lib/biometric-auth': {
      isNativeBiometricPlatform: native,
      isBiometricAvailable: async () => true,
      readBiometricPreference: async () => {
        if (readError) throw new Error('keychain unavailable');
        return preference;
      },
      writeBiometricPreference: async (_id, next) => { preference = next; },
      authenticateBiometric: () => response(),
    },
    '@/lib/supabase': { supabase: { auth: { signOut: async () => { signOuts++; return { error: null }; } } } },
  });
  const render = () => h.render(() => h.exports.BiometricLockProvider({ children: 'private-screen' }));
  function buttons(node, found = []) {
    if (!node || typeof node !== 'object') return found;
    if (node.type === 'Button') found.push(node.props);
    const children = node.props?.children;
    (Array.isArray(children) ? children.flat(Infinity) : [children]).forEach((child) => buttons(child, found));
    return found;
  }
  return {
    render,
    get context() { return render().props.value; },
    get protectedContentVisible() { return render().props.children === 'private-screen'; },
    get preference() { return preference; },
    get signOuts() { return signOuts; },
    respond(callback) { response = callback; },
    transition(state) { AppState.currentState = state; listener?.(state); },
    press(label) {
      const button = buttons(render()).find((item) => item.children === label);
      assert.ok(button, `Missing button: ${label}`);
      button.onPress();
    },
  };
}

test('a restored session is hidden before reading preferences and until successful authentication', async () => {
  const h = lockHarness();
  assert.equal(h.protectedContentVisible, false);
  await tick();
  assert.equal(h.protectedContentVisible, false);
  h.press('잠금 해제');
  await tick();
  assert.equal(h.protectedContentVisible, true);
});

test('cancelled authentication keeps private screens unmounted', async () => {
  const h = lockHarness();
  h.render();
  await tick();
  h.respond(async () => ({ success: false, error: 'user_cancel' }));
  h.press('잠금 해제');
  await tick();
  assert.equal(h.protectedContentVisible, false);
  assert.ok(h.context.error);
});

test('backgrounding always relocks, while the biometric prompt inactive transition does not cancel success', async () => {
  const h = lockHarness();
  h.render();
  await tick();
  const prompt = deferred();
  h.respond(() => prompt.promise);
  h.press('잠금 해제');
  h.transition('inactive');
  h.transition('active');
  prompt.resolve({ success: true });
  await tick();
  assert.equal(h.protectedContentVisible, true);
  h.transition('background');
  h.transition('active');
  assert.equal(h.protectedContentVisible, false);
});

test('a successful prompt arriving after real backgrounding cannot unlock the app', async () => {
  const h = lockHarness();
  h.render();
  await tick();
  const prompt = deferred();
  h.respond(() => prompt.promise);
  h.press('잠금 해제');
  h.transition('background');
  h.transition('active');
  prompt.resolve({ success: true });
  await tick();
  assert.equal(h.protectedContentVisible, false);
});

test('enabling and disabling require authentication and cancellation preserves the setting', async () => {
  const h = lockHarness({ enabled: false });
  h.render();
  await tick();
  assert.equal(h.protectedContentVisible, true);
  await h.context.setEnabled(true);
  assert.equal(h.preference, true);
  h.respond(async () => ({ success: false, error: 'user_cancel' }));
  await h.context.setEnabled(false);
  assert.equal(h.preference, true);
});

test('fresh password login can recover access, but still relocks on background', async () => {
  const h = lockHarness({ fresh: true });
  h.render();
  await tick();
  assert.equal(h.protectedContentVisible, true);
  h.transition('background');
  h.transition('active');
  assert.equal(h.protectedContentVisible, false);
});

test('preference read failure keeps the app locked and allows password recovery', async () => {
  const h = lockHarness({ readError: true });
  h.render();
  await tick();
  assert.equal(h.protectedContentVisible, false);
  h.press('이메일·비밀번호로 다시 로그인');
  await tick();
  assert.equal(h.signOuts, 1);
});

test('web never enters the biometric gate', () => {
  const h = lockHarness({ native: false });
  assert.equal(h.protectedContentVisible, true);
});

function storageHarness() {
  const secure = new Map();
  const legacy = new Map();
  let failNextChunk = false;
  const h = harness('src/lib/secure-session-storage.ts', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: {
      getItem: async (key) => legacy.get(key) ?? null,
      removeItem: async (key) => { legacy.delete(key); },
    } },
    'expo-secure-store': {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
      getItemAsync: async (key) => secure.get(key) ?? null,
      setItemAsync: async (key, value) => {
        assert.ok(Buffer.byteLength(value, 'utf8') < 2048);
        if (failNextChunk && !key.endsWith('.secure-v1')) {
          failNextChunk = false;
          throw new Error('disk full');
        }
        secure.set(key, value);
      },
      deleteItemAsync: async (key) => { secure.delete(key); },
    },
  });
  return { storage: h.exports.secureSessionStorage, secure, legacy,
    failWrite() { failNextChunk = true; } };
}

test('large Unicode sessions round-trip and plaintext sessions are migrated and removed', async () => {
  const h = storageHarness();
  const token = 'x'.repeat(399) + '🙂교회'.repeat(1600);
  h.legacy.set('session', token);
  assert.equal(await h.storage.getItem('session'), token);
  assert.equal(h.legacy.has('session'), false);
  assert.equal(await h.storage.getItem('session'), token);
});

test('an interrupted secure write preserves the previous session and logout removes every chunk', async () => {
  const h = storageHarness();
  await h.storage.setItem('session', 'old-token');
  h.failWrite();
  await assert.rejects(h.storage.setItem('session', 'new-token'));
  assert.equal(await h.storage.getItem('session'), 'old-token');
  await h.storage.removeItem('session');
  assert.equal(await h.storage.getItem('session'), null);
  assert.equal(h.secure.size, 0);
});
