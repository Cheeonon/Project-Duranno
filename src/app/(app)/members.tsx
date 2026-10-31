import { canEditMember, GENDER_OPTIONS, PERMISSION_OPTIONS, POSITION_OPTIONS } from '@/lib/member-permissions';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MemberAccountModal } from '@/components/member-account-modal';
import { useMemberEditor } from '@/hooks/use-member-editor';
import { useMemberAccount } from '@/hooks/use-member-account';
import { MemberAvatar } from '@/components/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StackScreenEnter } from '@/components/stack-screen-enter';
import { Button } from '@/components/ui/button';
import { BorderRadius, BottomTabInset, FontSize, MaxContentWidth, Shadow, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMembers } from '@/hooks/use-members';
import { useTheme } from '@/hooks/use-theme';
import { formatMemberDob, searchChurchMembers } from '@/lib/member-search';
import { formatCellHistoryPeriod } from '@/lib/cell-history';
import type { CellGroupMembership } from '@/types/member';

function PreviousCellHistory({ history }: { history: CellGroupMembership[] }) {
  if (history.length === 0) {
    return null;
  }

  const isVirtual = history.some((entry) => entry.isVirtual);

  return (
    <View style={styles.historyBlock}>
      <ThemedText type="small" themeColor="textSecondary">
        예전 셀{isVirtual ? ' (예시)' : ''}
      </ThemedText>
      {history.map((entry) => (
        <ThemedText
          key={`${entry.cellGroup}-${entry.from}-${entry.to}`}
          type="small"
          themeColor="textSecondary"
          style={styles.historyRow}>
          · {entry.cellGroup} · {formatCellHistoryPeriod(entry.from, entry.to)}
        </ThemedText>
      ))}
    </View>
  );
}

export default function MembersScreen() {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const { profile } = useAuth();
  const { members, isLoading, error, refresh } = useMembers();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchChurchMembers(query, members), [query, members]);
  const isAdmin = profile?.permission === '관리자';
  const myEffectiveLeaderId = profile ? (profile.cellLeaderId ?? profile.memberId) : null;
  const cellLeaders = useMemo(() => members.filter((member) => member.permission === '셀장'), [members]);

  const { editingMember, editDraft, setEditDraft, editError, editSubmitting, photoUploading, photoPreviewUri, openEdit, closeEdit, pickAndUploadPhoto, saveEdit } = useMemberEditor(refresh);
  const account = useMemberAccount(refresh);
  const { accountMemberIds, openIssue } = account;

  return (
    <StackScreenEnter>
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
            style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
            <ThemedText type="small" themeColor="textSecondary">
              ‹ 홈
            </ThemedText>
          </Pressable>

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
              <ThemedView
                key={member.id}
                type="backgroundElement"
                style={[styles.card, isDark ? Shadow.card.dark : Shadow.card.light]}>
                <View style={styles.cardTopRow}>
                  <MemberAvatar uri={member.photoUrl} nameKo={member.nameKo} size={48} />
                  <View style={styles.cardHeader}>
                    <ThemedText type="smallBold">
                      {member.nameKo} <ThemedText type="code" themeColor="textSecondary">{member.nameEn}</ThemedText>
                    </ThemedText>
                    <ThemedText type="code" themeColor="textSecondary">
                      {member.position} · {member.permission}
                    </ThemedText>
                  </View>
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
                <PreviousCellHistory history={member.previousCellGroups} />
                <ThemedText type="small" themeColor="textSecondary">
                  주소 · {member.address || '-'}
                </ThemedText>

                <View style={styles.cardActions}>
                  {editable && (
                    <Pressable
                      onPress={() => openEdit(member)}
                      style={({ pressed }) => [
                        styles.actionButton,
                        { borderColor: theme.border },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="small">수정</ThemedText>
                    </Pressable>
                  )}

                  {isAdmin && (
                    <Pressable
                      disabled={hasAccount}
                      onPress={() => openIssue(member)}
                      style={({ pressed }) => [
                        styles.actionButton,
                        { borderColor: theme.border },
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
            style={[
              styles.modalCard,
              { backgroundColor: theme.background },
              isDark ? Shadow.raised.dark : Shadow.raised.light,
            ]}
            onStartShouldSetResponder={() => true}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <ThemedText type="smallBold">성도 정보 수정</ThemedText>

              {editDraft && (
                <>
                  <View style={styles.photoRow}>
                    <MemberAvatar
                      uri={photoPreviewUri ?? editDraft.photoUrl}
                      nameKo={editDraft.nameKo}
                      size={88}
                    />
                    <Pressable
                      disabled={photoUploading}
                      onPress={pickAndUploadPhoto}
                      style={({ pressed }) => [
                        styles.actionButton,
                        { borderColor: theme.border },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="small">{photoUploading ? '업로드 중...' : '사진 변경'}</ThemedText>
                    </Pressable>
                  </View>

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
                        style={[styles.chip, { borderColor: theme.border }]}>
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
                            style={[styles.chip, { borderColor: theme.border }]}>
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
                          style={[styles.chip, { borderColor: theme.border }]}>
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
                          style={[styles.chip, { borderColor: theme.border }]}>
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
                          style={[styles.chip, { borderColor: theme.border }]}>
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
                <Button variant="ghost" onPress={closeEdit}>
                  취소
                </Button>
                <Button variant="primary" disabled={editSubmitting || photoUploading} loading={editSubmitting} onPress={saveEdit}>
                  저장
                </Button>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <MemberAccountModal {...account} />
      </ThemedView>
    </StackScreenEnter>
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
    paddingHorizontal: Spacing.three,
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
    gap: 15,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardHeader: {
    flex: 1,
    gap: 2,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  historyBlock: {
    gap: 2,
    marginTop: 2,
  },
  historyRow: {
    paddingLeft: Spacing.one,
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
    borderRadius: BorderRadius.lg,
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
  },
});
