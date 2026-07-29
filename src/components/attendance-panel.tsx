import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { MemberAvatar } from '@/components/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useHomeTextScale } from '@/contexts/home-text-scale';
import { useAttendance } from '@/hooks/use-attendance';
import { useAttendanceFeedback } from '@/hooks/use-attendance-feedback';
import { useMembers } from '@/hooks/use-members';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatAttendanceDate, getAttendanceKey, getSundaysInMonth } from '@/lib/attendance-dates';

type AbsenceEditorTarget = {
  memberId: string;
  memberName: string;
  date: Date;
  dateLabel: string;
};

export function AttendancePanel() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { scaled } = useHomeTextScale();
  const { profile } = useAuth();
  const { trigger: triggerFeedback } = useAttendanceFeedback();
  const { members, isLoading: membersLoading, error: membersError } = useMembers();
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const sundays = useMemo(() => getSundaysInMonth(year, month), [year, month]);
  const myEffectiveLeaderId = profile ? (profile.cellLeaderId ?? profile.memberId) : null;
  const cellGroupMembers = useMemo(
    () => members.filter((member) => (member.cellLeaderId ?? member.id) === myEffectiveLeaderId),
    [members, myEffectiveLeaderId],
  );
  const cellLeader = useMemo(
    () => cellGroupMembers.find((member) => member.id === myEffectiveLeaderId),
    [cellGroupMembers, myEffectiveLeaderId],
  );
  const memberIds = useMemo(() => cellGroupMembers.map((member) => member.id), [cellGroupMembers]);
  const {
    attendance,
    absenceReasons,
    isLoading: attendanceLoading,
    error: attendanceError,
    setPresent,
    setAbsenceReason,
    getPrefillAbsenceReason,
  } = useAttendance(memberIds, sundays);
  const isLoading = membersLoading || attendanceLoading;
  const error = membersError ?? attendanceError;
  const [absenceEditor, setAbsenceEditor] = useState<AbsenceEditorTarget | null>(null);
  const [reasonDraft, setReasonDraft] = useState('');
  const absencePrefillRequest = useRef(0);
  const reasonInputRef = useRef<TextInput>(null);

  // Drives the left/right scroll-hint arrows below — lets users know the
  // attendance table scrolls horizontally, and hides each arrow once
  // they've scrolled that direction as far as it goes.
  const [tableScrollX, setTableScrollX] = useState(0);
  const [tableContentWidth, setTableContentWidth] = useState(0);
  const [tableViewportWidth, setTableViewportWidth] = useState(0);
  const canScrollTableLeft = tableScrollX > 2;
  const canScrollTableRight = tableContentWidth - tableViewportWidth - tableScrollX > 2;

  const focusReasonInput = () => {
    // Modal animation / mobile browsers need a short delay before focus opens the keyboard.
    requestAnimationFrame(() => {
      reasonInputRef.current?.focus();
      setTimeout(() => reasonInputRef.current?.focus(), Platform.OS === 'web' ? 120 : 50);
    });
  };

  useEffect(() => {
    if (!absenceEditor) {
      return;
    }

    focusReasonInput();
  }, [absenceEditor]);

  const goToPrevMonth = () => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const toggleAttendance = (memberId: string, date: Date) => {
    const key = getAttendanceKey(memberId, date);
    const wasPresent = Boolean(attendance[key]);
    const nextPresent = !wasPresent;
    triggerFeedback(nextPresent ? 'present' : 'absent');
    setPresent(memberId, date, nextPresent);
  };

  const openAbsenceEditor = (memberId: string, memberName: string, date: Date) => {
    const key = getAttendanceKey(memberId, date);
    const requestId = ++absencePrefillRequest.current;
    triggerFeedback('open');
    setAbsenceEditor({
      memberId,
      memberName,
      date,
      dateLabel: formatAttendanceDate(date),
    });
    // Show this date's reason immediately when present; otherwise load the
    // member's most recent prior absence reason as a prefill.
    const existing = absenceReasons[key] ?? '';
    setReasonDraft(existing);
    if (!existing) {
      void getPrefillAbsenceReason(memberId, date).then((prefill) => {
        if (absencePrefillRequest.current !== requestId) {
          return;
        }
        setReasonDraft((current) => (current.trim() ? current : prefill));
      });
    }
  };

  const closeAbsenceEditor = () => {
    absencePrefillRequest.current += 1;
    setAbsenceEditor(null);
    setReasonDraft('');
  };

  const saveAbsenceReason = () => {
    if (!absenceEditor) {
      return;
    }

    const trimmedReason = reasonDraft.trim();
    triggerFeedback('saved');
    setAbsenceReason(absenceEditor.memberId, absenceEditor.date, trimmedReason || null);
    closeAbsenceEditor();
  };

  const getAbsenceCellHandlers = (memberId: string, memberName: string, date: Date) => {
    const openEditor = () => openAbsenceEditor(memberId, memberName, date);

    return {
      onLongPress: openEditor,
      delayLongPress: 450,
      ...(Platform.OS === 'web'
        ? {
            onContextMenu: (event: { preventDefault: () => void }) => {
              event.preventDefault();
              openEditor();
            },
          }
        : null),
    };
  };

  return (
    <ThemedView type="backgroundSelected" style={styles.container}>
      <ThemedText type="smallBold" style={styles.headerTitle}>
        {profile?.cellGroup ?? '내 셀'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.headerSubtitle}>
        셀리더 {cellLeader ? `${cellLeader.nameKo} ${cellLeader.position}` : '-'}
      </ThemedText>

      {(isLoading || error) && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.headerSubtitle}>
          {isLoading ? '불러오는 중...' : error}
        </ThemedText>
      )}

      <View style={styles.monthNavigator}>
        <Pressable
          accessibilityLabel="이전 달"
          onPress={goToPrevMonth}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold">‹</ThemedText>
        </Pressable>

        <ThemedText type="smallBold" style={styles.monthLabel}>
          {year}년 {month + 1}월
        </ThemedText>

        <Pressable
          accessibilityLabel="다음 달"
          onPress={goToNextMonth}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold">›</ThemedText>
        </Pressable>
      </View>

      <View style={styles.tableWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.tableScroll}
          onLayout={(event) => setTableViewportWidth(event.nativeEvent.layout.width)}
          onContentSizeChange={(width) => setTableContentWidth(width)}
          onScroll={(event) => setTableScrollX(event.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.nameHeaderCell}>
                <ThemedText type="smallBold" style={styles.headerText}>
                  성도
                </ThemedText>
              </View>
              {sundays.map((date) => (
                <View key={date.toISOString()} style={styles.dateHeaderCell}>
                  <ThemedText type="smallBold" style={styles.headerText}>
                    {formatAttendanceDate(date)}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary" style={styles.sundayLabel}>
                    주일
                  </ThemedText>
                </View>
              ))}
            </View>

            {cellGroupMembers.map((member) => (
            <View key={member.id} style={styles.tableRow}>
              <View style={styles.nameCell}>
                <MemberAvatar
                  uri={member.photoUrl}
                  nameKo={member.nameKo}
                  size={28}
                  style={styles.nameCellAvatar}
                />
                <View style={styles.nameTextColumn}>
                  <ThemedText type="smallBold" style={styles.memberName} numberOfLines={1}>
                    {member.nameKo}
                  </ThemedText>
                  <ThemedText
                    type="code"
                    themeColor="textSecondary"
                    style={styles.memberRole}
                    numberOfLines={1}>
                    {member.position}
                  </ThemedText>
                </View>
              </View>

              {sundays.map((date) => {
                const key = getAttendanceKey(member.id, date);
                const isPresent = Boolean(attendance[key]);
                const absenceReason = absenceReasons[key];
                const hasAbsenceReason = Boolean(absenceReason);

                return (
                  <Pressable
                    key={`${member.id}-${date.toISOString()}`}
                    accessibilityLabel={`${member.nameKo} ${formatAttendanceDate(date)} 출석`}
                    onPress={() => toggleAttendance(member.id, date)}
                    {...getAbsenceCellHandlers(member.id, member.nameKo, date)}
                    style={({ pressed }) => [
                      styles.attendanceCell,
                      { borderColor: theme.border },
                      isPresent && styles.attendanceCellPresent,
                      hasAbsenceReason && {
                        backgroundColor: isDark ? '#3A2426' : '#FEE2E2',
                        borderColor: '#EF4444',
                      },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={[
                        styles.checkText,
                        { color: theme.textSecondary },
                        isPresent && styles.checkTextPresent,
                        hasAbsenceReason && styles.checkTextAbsent,
                      ]}>
                      {isPresent ? '✓' : hasAbsenceReason ? '✕' : '○'}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            ))}
          </View>
        </ScrollView>

        {canScrollTableLeft && (
          <View pointerEvents="none" style={[styles.tableScrollHint, styles.tableScrollHintLeft]}>
            <ThemedText type="smallBold" style={styles.tableScrollHintArrow}>
              ‹
            </ThemedText>
          </View>
        )}
        {canScrollTableRight && (
          <View pointerEvents="none" style={[styles.tableScrollHint, styles.tableScrollHintRight]}>
            <ThemedText type="smallBold" style={styles.tableScrollHintArrow}>
              ›
            </ThemedText>
          </View>
        )}
      </View>

      <ThemedText type="code" themeColor="textSecondary" style={styles.demoNote}>
        클릭으로 출석 체크 · 길게 눌러 결석 사유 입력
        {Platform.OS === 'web' ? ' (PC는 우클릭)' : ''}
      </ThemedText>

      <Modal
        visible={absenceEditor !== null}
        transparent
        animationType="fade"
        onShow={focusReasonInput}
        onRequestClose={closeAbsenceEditor}>
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityLabel="결석 사유 닫기"
            onPress={closeAbsenceEditor}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <ThemedText type="smallBold" style={styles.modalTitle}>
              결석 사유
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.modalSubtitle}>
              {absenceEditor?.memberName} · {absenceEditor?.dateLabel}
            </ThemedText>

            <TextInput
              ref={reasonInputRef}
              value={reasonDraft}
              onChangeText={setReasonDraft}
              onSubmitEditing={saveAbsenceReason}
              returnKeyType="done"
              submitBehavior="submit"
              placeholder="예: 해외 출장, 몸살, 가족 행사"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              showSoftInputOnFocus
              style={[
                styles.reasonInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.backgroundSelected,
                  fontSize: scaled(FontSize.default),
                },
              ]}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeAbsenceEditor}
                style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}>
                <ThemedText type="small" themeColor="textSecondary">
                  취소
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={saveAbsenceReason}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={styles.modalButtonPrimaryText}>
                  저장
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
  container: {
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headerTitle: {
    fontSize: FontSize.small,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  headerSubtitle: {
    fontSize: FontSize.caption,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  monthLabel: {
    minWidth: 96,
    textAlign: 'center',
    fontSize: FontSize.caption,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  navButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableWrapper: {
    alignSelf: 'stretch',
  },
  tableScroll: {
    alignSelf: 'stretch',
  },
  tableScrollHint: {
    position: 'absolute',
    top: '50%',
    marginTop: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tableScrollHintArrow: {
    fontSize: FontSize.micro,
    color: '#FFFFFF',
  },
  tableScrollHintLeft: {
    left: 0,
  },
  tableScrollHintRight: {
    right: 0,
  },
  table: {
    gap: Spacing.one,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  nameHeaderCell: {
    width: 88,
    paddingVertical: Spacing.one,
  },
  dateHeaderCell: {
    width: 52,
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  headerText: {
    fontSize: FontSize.caption,
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  sundayLabel: {
    fontSize: FontSize.micro,
    textAlign: 'center',
  },
  nameCell: {
    width: 88,
    paddingVertical: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameCellAvatar: {
    marginRight: 5,
  },
  nameTextColumn: {
    flexShrink: 1,
    gap: 2,
  },
  memberName: {
    fontSize: FontSize.caption,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  memberRole: {
    fontSize: FontSize.micro,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  attendanceCell: {
    width: 52,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        // Prevent mobile Safari text selection / callout from eating the long-press.
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      },
      default: {},
    }),
  },
  attendanceCellPresent: {
    backgroundColor: Accent.green,
    borderColor: Accent.green,
  },
  checkText: {
    fontSize: FontSize.body,
  },
  checkTextPresent: {
    color: '#FFFFFF',
  },
  checkTextAbsent: {
    color: '#EF4444',
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
    maxWidth: 360,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: Spacing.two,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: FontSize.body,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  modalSubtitle: {
    fontSize: FontSize.caption,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  reasonInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
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
    backgroundColor: Accent.green,
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  demoNote: {
    fontSize: FontSize.micro,
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  pressed: {
    opacity: 0.7,
  },
});
