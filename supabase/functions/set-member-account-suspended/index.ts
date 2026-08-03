// Deploy: supabase functions deploy set-member-account-suspended
// Suspends or restores a member login account (admin only).
// Suspended users are banned in Auth so sign-in fails.

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

  const { memberId, suspended } = await req.json().catch(() => ({}));

  if (!memberId || typeof suspended !== 'boolean') {
    return json({ error: 'memberId와 suspended(boolean)가 필요합니다.' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();

  if (!caller) {
    return json({ error: '인증이 필요합니다.' }, 401);
  }

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
    return json({ error: '관리자만 활동정지를 설정할 수 있습니다.' }, 403);
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('member_id', memberId)
    .maybeSingle();

  if (targetProfileError || !targetProfile) {
    return json({ error: '해당 성도의 계정을 찾을 수 없습니다.' }, 404);
  }

  if (targetProfile.id === caller.id && suspended) {
    return json({ error: '본인 계정은 활동정지할 수 없습니다.' }, 400);
  }

  const { error: banError } = await adminClient.auth.admin.updateUserById(targetProfile.id, {
    ban_duration: suspended ? '876000h' : 'none',
  });

  if (banError) {
    return json({ error: banError.message ?? '계정 상태 변경에 실패했습니다.' }, 400);
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ is_suspended: suspended })
    .eq('id', targetProfile.id);

  if (profileError) {
    return json({ error: profileError.message ?? '프로필 상태 저장에 실패했습니다.' }, 400);
  }

  return json({ memberId, suspended });
});
