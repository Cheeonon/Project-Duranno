import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  InteractionManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MemberAvatar } from '@/components/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  Accent,
  BorderRadius,
  BottomTabInset,
  FontSize,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useMembers } from '@/hooks/use-members';
import { useTheme } from '@/hooks/use-theme';
import {
  CA_PROVINCE_OPTIONS,
  formatMemberAddressLines,
  formatPostalCode,
  getPostalCodeError,
  getPostalCodeSaveError,
} from '@/lib/member-address';
import { formatMemberNameEn } from '@/lib/member-name';
import { formatPhoneNumber } from '@/lib/member-phone';
import { formatMemberDob, getManAge, searchChurchMembers } from '@/lib/member-search';
import { formatCellHistoryPeriod } from '@/lib/cell-history';
import { deleteMemberPhoto, uploadMemberPhoto } from '@/lib/member-photos';
import { supabase } from '@/lib/supabase';
import {
  CHURCH_POSITION_OPTIONS,
  MEMBER_MINISTRY_OPTIONS,
  MEMBER_PERMISSION_OPTIONS,
  type CellGroupMembership,
  type Gender,
  type Member,
  type MemberPermission,
} from '@/types/member';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
];

function canEditMember(
  permission: MemberPermission | undefined,
  myEffectiveLeaderId: string | null,
  member: Member,
) {
  if (permission === '관리자') {
    return true;
  }
  if (permission === '셀장') {
    return (member.cellLeaderId ?? member.id) === myEffectiveLeaderId;
  }
  return false;
}

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
  const { profile } = useAuth();
  const { members, isLoading, error, refresh } = useMembers();
  const [query, setQuery] = useState('');
  const [accountMemberIds, setAccountMemberIds] = useState<Set<string>>(new Set());
  const [suspendedMemberIds, setSuspendedMemberIds] = useState<Set<string>>(new Set());
  const [suspendSubmittingId, setSuspendSubmittingId] = useState<string | null>(null);
  const [suspendError, setSuspendError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('member_id, is_suspended');
    const rows = (data ?? []).filter((row) => row.member_id);
    setAccountMemberIds(new Set(rows.map((row) => row.member_id as string)));
    setSuspendedMemberIds(
      new Set(rows.filter((row) => row.is_suspended).map((row) => row.member_id as string)),
    );
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void loadAccounts();
    });
    return () => task.cancel();
  }, [loadAccounts]);

  const results = useMemo(() => searchChurchMembers(query, members), [query, members]);
  const isAdmin = profile?.permission === '관리자';
  const myEffectiveLeaderId = profile ? (profile.cellLeaderId ?? profile.memberId) : null;
  const cellLeaders = useMemo(() => members.filter((member) => member.permission === '셀장'), [members]);

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editDraft, setEditDraft] = useState<Member | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  // Path of a photo uploaded during this edit session but not yet saved to the
  // member row — used to clean up the orphaned object if the user cancels.
  const [uploadedPhotoThisSession, setUploadedPhotoThisSession] = useState<string | null>(null);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);
  const [provinceMenuOpen, setProvinceMenuOpen] = useState(false);

  const openEdit = (member: Member) => {
    setEditingMember(member);
    setEditDraft({
      ...member,
      phone: formatPhoneNumber(member.phone),
      addressProvince: member.addressProvince || 'ON',
    });
    setEditError(null);
    setUploadedPhotoThisSession(null);
    setPhotoPreviewUri(null);
    setProvinceMenuOpen(false);
  };

  const closeEdit = () => {
    if (uploadedPhotoThisSession) {
      deleteMemberPhoto(uploadedPhotoThisSession);
    }
    setEditingMember(null);
    setEditDraft(null);
    setEditError(null);
    setUploadedPhotoThisSession(null);
    setPhotoPreviewUri(null);
    setProvinceMenuOpen(false);
  };

  const pickAndUploadPhoto = async () => {
    if (!editDraft) {
      return;
    }

    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setEditError('사진 보관함 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setPhotoUploading(true);
    try {
      const path = await uploadMemberPhoto(editDraft.id, asset.uri, asset.mimeType ?? 'image/jpeg');
      if (uploadedPhotoThisSession) {
        deleteMemberPhoto(uploadedPhotoThisSession);
      }
      setUploadedPhotoThisSession(path);
      setPhotoPreviewUri(asset.uri);
      setEditDraft({ ...editDraft, photoPath: path });
    } catch (uploadError) {
      setEditError(uploadError instanceof Error ? uploadError.message : '사진 업로드에 실패했습니다.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const saveEdit = async () => {
    if (!editDraft) {
      return;
    }

    const postalError = getPostalCodeSaveError(editDraft.addressPostalCode);
    if (postalError) {
      setEditError(postalError);
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    const { error: saveError } = await supabase
      .from('members')
      .update({
        name_ko: editDraft.nameKo,
        first_name_en: editDraft.firstNameEn || null,
        last_name_en: editDraft.lastNameEn || null,
        dob: editDraft.dob,
        gender: editDraft.gender,
        phone: editDraft.phone || null,
        address_street: editDraft.addressStreet || null,
        address_unit: editDraft.addressUnit || null,
        address_city: editDraft.addressCity || null,
        address_province: editDraft.addressProvince || null,
        address_postal_code: editDraft.addressPostalCode
          ? formatPostalCode(editDraft.addressPostalCode)
          : null,
        cell_leader_id: editDraft.cellLeaderId,
        permission: editDraft.permission,
        position: editDraft.position,
        is_married: editDraft.isMarried,
        ministry: editDraft.ministry,
        photo_path: editDraft.photoPath,
      })
      .eq('id', editDraft.id);
    setEditSubmitting(false);

    if (saveError) {
      setEditError(saveError.message);
      return;
    }

    if (editingMember?.photoPath && editingMember.photoPath !== editDraft.photoPath) {
      deleteMemberPhoto(editingMember.photoPath);
    }
    setUploadedPhotoThisSession(null);
    closeEdit();
    refresh();
  };

  const [issuingMember, setIssuingMember] = useState<Member | null>(null);
  const [issueEmail, setIssueEmail] = useState('');
  const [issuePassword, setIssuePassword] = useState('');
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issueSubmitting, setIssueSubmitting] = useState(false);

  const openIssue = (member: Member) => {
    if (member.permission === '성도') {
      return;
    }
    setIssuingMember(member);
    setIssueEmail('');
    setIssuePassword('');
    setIssueError(null);
  };

  const toggleAccountSuspension = useCallback(
    async (member: Member) => {
      if (suspendSubmittingId) {
        return;
      }

      const nextSuspended = !suspendedMemberIds.has(member.id);
      setSuspendError(null);
      setSuspendSubmittingId(member.id);

      const { error: rpcError } = await supabase.rpc('set_member_account_suspended', {
        p_member_id: member.id,
        p_suspended: nextSuspended,
      });

      setSuspendSubmittingId(null);

      if (rpcError) {
        const message = rpcError.message.includes('관리자만')
          ? '관리자만 활동정지를 설정할 수 있습니다.'
          : rpcError.message.includes('본인 계정')
            ? '본인 계정은 활동정지할 수 없습니다.'
            : rpcError.message.includes('계정을 찾을 수 없')
              ? '해당 성도의 계정을 찾을 수 없습니다.'
              : rpcError.message.includes('does not exist') ||
                  rpcError.message.includes('schema cache')
                ? 'DB에 활동정지 기능이 아직 없습니다. 0028 SQL을 실행해주세요.'
                : rpcError.message || '계정 상태 변경에 실패했습니다.';
        setSuspendError(message);
        Alert.alert('활동정지', message);
        return;
      }

      setSuspendedMemberIds((current) => {
        const next = new Set(current);
        if (nextSuspended) {
          next.add(member.id);
        } else {
          next.delete(member.id);
        }
        return next;
      });
    },
    [suspendSubmittingId, suspendedMemberIds],
  );

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

    if (issuingMember.permission === '성도') {
      setIssueError('권한이 성도인 경우에는 계정을 발급할 수 없습니다.');
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

  const renderMemberCard = useCallback(
    ({ item: member }: { item: Member }) => {
      const editable = canEditMember(profile?.permission, myEffectiveLeaderId, member);
      const hasAccount = accountMemberIds.has(member.id);
      const isSuspended = suspendedMemberIds.has(member.id);
      const isOwnAccount = profile?.memberId === member.id;
      const canIssueAccount = member.permission !== '성도';
      const manAge = getManAge(member.dob);
      const addressLines = formatMemberAddressLines(member);
      const suspendBusy = suspendSubmittingId === member.id;

      return (
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.cardTopRow}>
            <MemberAvatar uri={member.photoUrl} nameKo={member.nameKo} size={48} />
            <View style={styles.cardHeader}>
              <ThemedText type="smallBold">
                {member.nameKo}{' '}
                <ThemedText type="code" themeColor="textSecondary">
                  {formatMemberNameEn(member)}
                </ThemedText>
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary">
                {member.position} · {member.permission} · {member.ministry}
                {member.isMarried ? ' · 기혼' : ' · 미혼'}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            생년월일 · {formatMemberDob(member.dob)}
            {manAge != null ? ` · 만 ${manAge}세` : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            전화번호 · {member.phone || '-'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            셀그룹 · {member.cellGroup}
          </ThemedText>
          <PreviousCellHistory history={member.previousCellGroups} />
          {addressLines.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              주소 · -
            </ThemedText>
          ) : (
            <View style={styles.addressBlock}>
              <ThemedText type="small" themeColor="textSecondary">
                주소
              </ThemedText>
              {addressLines.map((line) => (
                <ThemedText key={line} type="small" themeColor="textSecondary">
                  {line}
                </ThemedText>
              ))}
            </View>
          )}

          {isSuspended && (
            <ThemedText type="small" style={{ color: '#E5484D' }}>
              활동이 정지되었습니다
            </ThemedText>
          )}

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

            {isAdmin && canIssueAccount && !hasAccount && (
              <Pressable
                onPress={() => openIssue(member)}
                style={({ pressed }) => [
                  styles.actionButton,
                  { borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="small">계정 발급</ThemedText>
              </Pressable>
            )}

            {isAdmin && hasAccount && !isOwnAccount && (
              <Pressable
                disabled={suspendBusy}
                onPress={() => void toggleAccountSuspension(member)}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    borderColor: isSuspended ? Accent.green : '#E5484D',
                  },
                  suspendBusy && styles.actionButtonDisabled,
                  pressed && styles.pressed,
                ]}>
                <ThemedText
                  type="small"
                  style={{ color: isSuspended ? Accent.green : '#E5484D' }}>
                  {suspendBusy
                    ? '처리 중...'
                    : isSuspended
                      ? '활동 재개'
                      : '활동정지'}
                </ThemedText>
              </Pressable>
            )}
          </View>
        </ThemedView>
      );
    },
    [
      accountMemberIds,
      isAdmin,
      myEffectiveLeaderId,
      profile?.memberId,
      profile?.permission,
      suspendSubmittingId,
      suspendedMemberIds,
      theme.border,
      toggleAccountSuspension,
    ],
  );

  const postalCodeError = editDraft ? getPostalCodeError(editDraft.addressPostalCode) : null;

  return (
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

        {suspendError ? (
          <ThemedText type="small" style={{ color: '#E5484D', marginBottom: Spacing.two }}>
            {suspendError}
          </ThemedText>
        ) : null}

        <FlatList
          style={styles.listFlex}
          data={results}
          keyExtractor={(member) => member.id}
          renderItem={renderMemberCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      </SafeAreaView>

      <Modal visible={editingMember !== null} transparent animationType="fade" onRequestClose={closeEdit}>
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityLabel="수정 닫기"
            onPress={closeEdit}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled">
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
                    value={editDraft.firstNameEn}
                    onChangeText={(text) => setEditDraft({ ...editDraft, firstNameEn: text })}
                    placeholder="First Name"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="words"
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <TextInput
                    value={editDraft.lastNameEn}
                    onChangeText={(text) => setEditDraft({ ...editDraft, lastNameEn: text })}
                    placeholder="Last Name"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="words"
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
                    onChangeText={(text) =>
                      setEditDraft({ ...editDraft, phone: formatPhoneNumber(text) })
                    }
                    placeholder="xxx-xxx-xxxx"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={12}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    주소 (캐나다)
                  </ThemedText>
                  <TextInput
                    value={editDraft.addressStreet}
                    onChangeText={(text) => setEditDraft({ ...editDraft, addressStreet: text })}
                    placeholder="Street (예: 123 Finch Ave W)"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="words"
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <TextInput
                    value={editDraft.addressUnit}
                    onChangeText={(text) => setEditDraft({ ...editDraft, addressUnit: text })}
                    placeholder="Unit / Apt (선택)"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <TextInput
                    value={editDraft.addressCity}
                    onChangeText={(text) => setEditDraft({ ...editDraft, addressCity: text })}
                    placeholder="City (예: North York)"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="words"
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    Province
                  </ThemedText>
                  <View style={styles.dropdownWrap}>
                    <Pressable
                      accessibilityLabel="Province 선택"
                      onPress={() => setProvinceMenuOpen((open) => !open)}
                      style={[
                        styles.dropdownButton,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.backgroundElement,
                        },
                      ]}>
                      <ThemedText type="small">{editDraft.addressProvince || 'ON'}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {provinceMenuOpen ? '▴' : '▾'}
                      </ThemedText>
                    </Pressable>
                    {provinceMenuOpen ? (
                      <ThemedView
                        type="background"
                        style={[styles.dropdownMenu, { borderColor: theme.border }]}>
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                          {CA_PROVINCE_OPTIONS.map((province) => {
                            const selected = (editDraft.addressProvince || 'ON') === province;
                            return (
                              <Pressable
                                key={province}
                                onPress={() => {
                                  setEditDraft({ ...editDraft, addressProvince: province });
                                  setProvinceMenuOpen(false);
                                }}
                                style={[
                                  styles.dropdownItem,
                                  selected && styles.dropdownItemSelected,
                                ]}>
                                <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                                  {province}
                                </ThemedText>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </ThemedView>
                    ) : null}
                  </View>
                  {postalCodeError ? (
                    <ThemedText type="small" style={styles.fieldError}>
                      {postalCodeError}
                    </ThemedText>
                  ) : null}
                  <TextInput
                    value={editDraft.addressPostalCode}
                    onChangeText={(text) => {
                      setEditDraft({ ...editDraft, addressPostalCode: formatPostalCode(text) });
                      if (editError) {
                        setEditError(null);
                      }
                    }}
                    placeholder="Postal Code (예: M2N 1A1)"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="characters"
                    maxLength={7}
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
                    {CHURCH_POSITION_OPTIONS.map((option) => (
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
                    {MEMBER_PERMISSION_OPTIONS.map((option) => (
                      <Pressable key={option} onPress={() => setEditDraft({ ...editDraft, permission: option })}>
                        <ThemedView
                          type={editDraft.permission === option ? 'backgroundSelected' : 'background'}
                          style={[styles.chip, { borderColor: theme.border }]}>
                          <ThemedText type="small">{option}</ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </View>

                  <ThemedText type="small" themeColor="textSecondary">
                    부서
                  </ThemedText>
                  <View style={styles.chipRow}>
                    {MEMBER_MINISTRY_OPTIONS.map((option) => (
                      <Pressable
                        key={option}
                        onPress={() => setEditDraft({ ...editDraft, ministry: option })}>
                        <ThemedView
                          type={editDraft.ministry === option ? 'backgroundSelected' : 'background'}
                          style={[styles.chip, { borderColor: theme.border }]}>
                          <ThemedText type="small">{option}</ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </View>

                  <ThemedText type="small" themeColor="textSecondary">
                    결혼 여부
                  </ThemedText>
                  <View style={styles.chipRow}>
                    {(
                      [
                        { value: false, label: '미혼' },
                        { value: true, label: '기혼' },
                      ] as const
                    ).map((option) => (
                      <Pressable
                        key={option.label}
                        onPress={() => setEditDraft({ ...editDraft, isMarried: option.value })}>
                        <ThemedView
                          type={editDraft.isMarried === option.value ? 'backgroundSelected' : 'background'}
                          style={[styles.chip, { borderColor: theme.border }]}>
                          <ThemedText type="small">{option.label}</ThemedText>
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
        </View>
      </Modal>

      <Modal visible={issuingMember !== null} transparent animationType="fade" onRequestClose={closeIssue}>
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityLabel="계정 발급 닫기"
            onPress={closeIssue}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
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
        </View>
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
  listFlex: {
    flex: 1,
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
  addressBlock: {
    gap: 2,
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
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: Spacing.two,
    zIndex: 1,
  },
  modalScrollContent: {
    gap: Spacing.two,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  fieldError: {
    color: '#E5484D',
    fontSize: FontSize.micro,
    lineHeight: 16,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  dropdownWrap: {
    zIndex: 2,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  dropdownMenu: {
    marginTop: Spacing.half,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
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
  },
});
