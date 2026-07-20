import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, BottomTabInset, FontSize, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useMembers } from '@/hooks/use-members';
import { useTheme } from '@/hooks/use-theme';
import { formatMemberDob, searchChurchMembers } from '@/lib/member-search';
import { supabase } from '@/lib/supabase';
import type { ChurchPosition, Gender, Member, MemberPermission } from '@/types/member';

const POSITION_OPTIONS: ChurchPosition[] = [
  '목사',
  '사모',
  '전도사',
  '간사',
  '집사',
  '장로',
  '권사',
  '셀장',
  '새신자 팀원',
  '셀원',
  '회장',
  '부회장',
  '새신자 팀장',
];

const PERMISSION_OPTIONS: MemberPermission[] = ['성도', '임원', '셀장', '사역자', '재정', '관리자'];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
];

function canEditMember(
  permission: MemberPermission | undefined,
  myEffectiveLeaderId: string | null,
  member: Member,
) {
  if (permission === '임원' || permission === '관리자') {
    return true;
  }
  if (permission === '셀장') {
    return (member.cellLeaderId ?? member.id) === myEffectiveLeaderId;
  }
  return false;
}

export default function MembersScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const { members, isLoading, error, refresh } = useMembers();
  const [query, setQuery] = useState('');
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

  const results = useMemo(() => searchChurchMembers(query, members), [query, members]);
  const isAdmin = profile?.permission === '관리자';
  const myEffectiveLeaderId = profile ? (profile.cellLeaderId ?? profile.memberId) : null;
  const cellLeaders = useMemo(() => members.filter((member) => member.permission === '셀장'), [members]);

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editDraft, setEditDraft] = useState<Member | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const openEdit = (member: Member) => {
    setEditingMember(member);
    setEditDraft({ ...member });
    setEditError(null);
  };

  const closeEdit = () => {
    setEditingMember(null);
    setEditDraft(null);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editDraft) {
      return;
    }

    setEditSubmitting(true);
    const { error: saveError } = await supabase
      .from('members')
      .update({
        name_ko: editDraft.nameKo,
        name_en: editDraft.nameEn || null,
        dob: editDraft.dob,
        gender: editDraft.gender,
        phone: editDraft.phone || null,
        address: editDraft.address || null,
        cell_leader_id: editDraft.cellLeaderId,
        permission: editDraft.permission,
        position: editDraft.position,
      })
      .eq('id', editDraft.id);
    setEditSubmitting(false);

    if (saveError) {
      setEditError(saveError.message);
      return;
    }

    closeEdit();
    refresh();
  };

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

  const closeIssue = () => {
    setIssuingMember(null);
    setIssueEmail('');
    setIssuePassword('');
    setIssueError(null);
  };

  const submitIssue = async () => {
    if (!issuingMember) {
      return;
    }

    if (!issueEmail.trim() || !issuePassword) {
      setIssueError('이메일과 임시 비밀번호를 입력해주세요.');
      return;
    }

    setIssueSubmitting(true);
    const { error: invokeError } = await supabase.functions.invoke('create-member-account', {
      body: { memberId: issuingMember.id, email: issueEmail.trim(), tempPassword: issuePassword },
    });
    setIssueSubmitting(false);

    if (invokeError) {
      setIssueError(invokeError.message ?? '계정 생성에 실패했습니다.');
      return;
    }

    closeIssue();
    loadAccounts();
    refresh();
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <Link href="/" asChild>
          <Pressable style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
            <ThemedText type="small" themeColor="textSecondary">
              ‹ 홈
            </ThemedText>
          </Pressable>
        </Link>

        <ThemedText type="subtitle" style={styles.title}>
          성도관리
        </ThemedText>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="이름, 생년월일, 전화번호, 셀그룹으로 검색"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.searchInput,
            { color: theme.text, backgroundColor: theme.backgroundElement },
          ]}
        />

        <ThemedText type="code" themeColor="textSecondary" style={styles.resultCount}>
          {isLoading ? '불러오는 중...' : error ? error : `${results.length}명`}
        </ThemedText>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {results.map((member) => {
            const editable = canEditMember(profile?.permission, myEffectiveLeaderId, member);
            const hasAccount = accountMemberIds.has(member.id);

            return (
              <ThemedView key={member.id} type="backgroundElement" style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText type="smallBold">
                    {member.nameKo} <ThemedText type="code" themeColor="textSecondary">{member.nameEn}</ThemedText>
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary">
                    {member.position} · {member.permission}
                  </ThemedText>
                </View>

                <ThemedText type="small" themeColor="textSecondary">
                  생년월일 · {formatMemberDob(member.dob)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  전화번호 · {member.phone || '-'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  셀그룹 · {member.cellGroup}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  주소 · {member.address || '-'}
                </ThemedText>

                <View style={styles.cardActions}>
                  {editable && (
                    <Pressable
                      onPress={() => openEdit(member)}
                      style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
                      <ThemedText type="small">수정</ThemedText>
                    </Pressable>
                  )}

                  {isAdmin && (
                    <Pressable
                      disabled={hasAccount}
                      onPress={() => openIssue(member)}
                      style={({ pressed }) => [
                        styles.actionButton,
                        hasAccount && styles.actionButtonDisabled,
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="small" themeColor={hasAccount ? 'textSecondary' : 'text'}>
                        {hasAccount ? '계정 있음' : '계정 발급'}
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              </ThemedView>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={editingMember !== null} transparent animationType="fade" onRequestClose={closeEdit}>
        <Pressable style={styles.modalOverlay} onPress={closeEdit}>
          <View
            style={[styles.modalCard, { backgroundColor: theme.background }]}
            onStartShouldSetResponder={() => true}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <ThemedText type="smallBold">성도 정보 수정</ThemedText>

              {editDraft && (
                <>
                  <TextInput
                    value={editDraft.nameKo}
                    onChangeText={(text) => setEditDraft({ ...editDraft, nameKo: text })}
                    placeholder="이름"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <TextInput
                    value={editDraft.nameEn}
                    onChangeText={(text) => setEditDraft({ ...editDraft, nameEn: text })}
                    placeholder="영문 이름"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <TextInput
                    value={editDraft.dob}
                    onChangeText={(text) => setEditDraft({ ...editDraft, dob: text })}
                    placeholder="생년월일 (YYYY-MM-DD)"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <TextInput
                    value={editDraft.phone}
                    onChangeText={(text) => setEditDraft({ ...editDraft, phone: text })}
                    placeholder="전화번호"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <TextInput
                    value={editDraft.address}
                    onChangeText={(text) => setEditDraft({ ...editDraft, address: text })}
                    placeholder="주소"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    소속 셀 (셀장 기준)
                  </ThemedText>
                  <View style={styles.chipRow}>
                    <Pressable onPress={() => setEditDraft({ ...editDraft, cellLeaderId: null })}>
                      <ThemedView
                        type={editDraft.cellLeaderId === null ? 'backgroundSelected' : 'background'}
                        style={styles.chip}>
                        <ThemedText type="small">{editDraft.nameKo} 셀 (본인)</ThemedText>
                      </ThemedView>
                    </Pressable>
                    {cellLeaders
                      .filter((leader) => leader.id !== editDraft.id)
                      .map((leader) => (
                        <Pressable
                          key={leader.id}
                          onPress={() => setEditDraft({ ...editDraft, cellLeaderId: leader.id })}>
                          <ThemedView
                            type={editDraft.cellLeaderId === leader.id ? 'backgroundSelected' : 'background'}
                            style={styles.chip}>
                            <ThemedText type="small">{leader.nameKo} 셀</ThemedText>
                          </ThemedView>
                        </Pressable>
                      ))}
                  </View>

                  <ThemedText type="small" themeColor="textSecondary">
                    성별
                  </ThemedText>
                  <View style={styles.chipRow}>
                    {GENDER_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => setEditDraft({ ...editDraft, gender: option.value })}>
                        <ThemedView
                          type={editDraft.gender === option.value ? 'backgroundSelected' : 'background'}
                          style={styles.chip}>
                          <ThemedText type="small">{option.label}</ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </View>

                  <ThemedText type="small" themeColor="textSecondary">
                    직분
                  </ThemedText>
                  <View style={styles.chipRow}>
                    {POSITION_OPTIONS.map((option) => (
                      <Pressable key={option} onPress={() => setEditDraft({ ...editDraft, position: option })}>
                        <ThemedView
                          type={editDraft.position === option ? 'backgroundSelected' : 'background'}
                          style={styles.chip}>
                          <ThemedText type="small">{option}</ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </View>

                  <ThemedText type="small" themeColor="textSecondary">
                    권한
                  </ThemedText>
                  <View style={styles.chipRow}>
                    {PERMISSION_OPTIONS.map((option) => (
                      <Pressable key={option} onPress={() => setEditDraft({ ...editDraft, permission: option })}>
                        <ThemedView
                          type={editDraft.permission === option ? 'backgroundSelected' : 'background'}
                          style={styles.chip}>
                          <ThemedText type="small">{option}</ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {editError && (
                <ThemedText type="small" themeColor="textSecondary">
                  {editError}
                </ThemedText>
              )}

              <View style={styles.modalActions}>
                <Pressable
                  onPress={closeEdit}
                  style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    취소
                  </ThemedText>
                </Pressable>
                <Pressable
                  disabled={editSubmitting}
                  onPress={saveEdit}
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalButtonPrimary,
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    {editSubmitting ? '저장 중...' : '저장'}
                  </ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={issuingMember !== null} transparent animationType="fade" onRequestClose={closeIssue}>
        <Pressable style={styles.modalOverlay} onPress={closeIssue}>
          <View
            style={[styles.modalCard, { backgroundColor: theme.background }]}
            onStartShouldSetResponder={() => true}>
            <ThemedText type="smallBold">계정 발급</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {issuingMember?.nameKo}에게 로그인 계정을 발급합니다.
            </ThemedText>

            <TextInput
              value={issueEmail}
              onChangeText={setIssueEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="이메일"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <TextInput
              value={issuePassword}
              onChangeText={setIssuePassword}
              placeholder="임시 비밀번호 (6자 이상)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            {issueError && (
              <ThemedText type="small" themeColor="textSecondary">
                {issueError}
              </ThemedText>
            )}

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeIssue}
                style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}>
                <ThemedText type="small" themeColor="textSecondary">
                  취소
                </ThemedText>
              </Pressable>
              <Pressable
                disabled={issueSubmitting}
                onPress={submitIssue}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  {issueSubmitting ? '생성 중...' : '계정 생성'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    paddingTop: Spacing.three,
  },
  backLink: {
    paddingTop: Spacing.three,
    alignSelf: 'flex-start',
  },
  searchInput: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: FontSize.default,
  },
  resultCount: {
    fontSize: FontSize.caption,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  actionButton: {
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#B0B4BA',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  modalScrollContent: {
    gap: Spacing.two,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  modalButton: {
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  modalButtonPrimary: {
    backgroundColor: '#22C55E',
  },
  input: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: FontSize.default,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    borderRadius: BorderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0D0D5',
  },
});
