// Deploy: supabase functions deploy create-member-account
// Creates a login account for an existing member and links it via member_id.
// Only callers whose own member row has permission = '관리자' may invoke this —
// the service_role key (used to actually create the auth user) never reaches
// the client, it only ever lives here.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: '인증이 필요합니다.' }, 401);
  }

  const { memberId, email, tempPassword } = await req.json().catch(() => ({}));

  if (!memberId || !email || !tempPassword) {
    return json({ error: 'memberId, email, tempPassword가 모두 필요합니다.' }, 400);
  }

  if (String(tempPassword).length < 6) {
    return json({ error: '비밀번호는 6자 이상이어야 합니다.' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Scoped to the caller's own JWT — just to find out who they are.
  const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();

  if (!caller) {
    return json({ error: '인증이 필요합니다.' }, 401);
  }

  // service_role client — bypasses RLS, only used for the checks/writes below.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from('profiles')
    .select('members(permission)')
    .eq('id', caller.id)
    .single();

  const callerMember = Array.isArray(callerProfile?.members)
    ? callerProfile.members[0]
    : callerProfile?.members;

  if (callerProfileError || callerMember?.permission !== '관리자') {
    return json({ error: '관리자만 계정을 발급할 수 있습니다.' }, 403);
  }

  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('member_id', memberId)
    .maybeSingle();

  if (existingProfile) {
    return json({ error: '이미 계정이 있는 성도입니다.' }, 409);
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { member_id: memberId },
  });

  if (createError || !created.user) {
    return json({ error: createError?.message ?? '계정 생성에 실패했습니다.' }, 400);
  }

  await adminClient.from('members').update({ email }).eq('id', memberId);

  return json({ userId: created.user.id });
});
