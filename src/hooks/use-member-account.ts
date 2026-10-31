import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Member } from '@/types/member';

export function useMemberAccount(refresh: () => Promise<void>) {
  const [accountMemberIds, setAccountMemberIds] = useState<Set<string>>(new Set());

  const loadAccounts = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('member_id');
    setAccountMemberIds(new Set((data ?? []).map((row) => row.member_id as string)));
  }, []);

  useEffect(() => {
    // Also re-invoked after issuing an account, not just on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAccounts();
  }, [loadAccounts]);

  const [issuingMember, setIssuingMember] = useState<Member | null>(null);
  const [issueEmail, setIssueEmail] = useState('');
  const [issuePassword, setIssuePassword] = useState('');
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issueSubmitting, setIssueSubmitting] = useState(false);

  const openIssue = (member: Member) => {
    setIssuingMember(member);
    setIssueEmail('');
    setIssuePassword('');
    setIssueError(null);
  };

  const resetIssue = () => {
    setIssuingMember(null);
    setIssueEmail('');
    setIssuePassword('');
    setIssueError(null);
  };

  const closeIssue = () => {
    if (!issueSubmitting) resetIssue();
  };

  const submitIssue = async () => {
    if (!issuingMember || issueSubmitting) {
      return;
    }

    if (!issueEmail.trim() || !issuePassword) {
      setIssueError('이메일과 임시 비밀번호를 입력해주세요.');
      return;
    }

    setIssueSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('create-member-account', {
        body: { memberId: issuingMember.id, email: issueEmail.trim(), tempPassword: issuePassword },
      });
      if (error) throw error;
      resetIssue();
      await Promise.all([loadAccounts(), refresh()]);
    } catch (error) {
      setIssueError(error instanceof Error ? error.message : '계정 생성에 실패했습니다.');
    } finally {
      setIssueSubmitting(false);
    }
  };

  return { accountMemberIds, issuingMember, issueEmail, setIssueEmail, issuePassword, setIssuePassword, issueError, issueSubmitting, openIssue, closeIssue, submitIssue };
}
