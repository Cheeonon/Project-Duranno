import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useHomeTextScale } from '@/contexts/home-text-scale';
import { useAttendance } from '@/hooks/use-attendance';
import { useMembers } from '@/hooks/use-members';
import { useTheme } from '@/hooks/use-theme';
import { formatAttendanceDate, getAttendanceKey, getSundaysInMonth } from '@/lib/attendance-dates';

type AbsenceEditorTarget = {
  memberId: string;
  memberName: string;
  date: Date;
  dateLabel: string;
};

export function AttendancePanel() {
  const theme = useTheme();
  const { scaled } = useHomeTextScale();
  const { profile } = useAuth();
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
  } = useAttendance(memberIds, sundays);
  const isLoading = membersLoading || attendanceLoading;
  const error = membersError ?? attendanceError;
  const [absenceEditor, setAbsenceEditor] = useState<AbsenceEditorTarget | null>(null);
  const [reasonDraft, setReasonDraft] = useState('');

  const goToPrevMonth = () => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const toggleAttendance = (memberId: string, date: Date) => {
    const key = getAttendanceKey(memberId, date);
    const wasPresent = Boolean(attendance[key]);
    setPresent(memberId, date, !wasPresent);
  };

  const openAbsenceEditor = (memberId: string, memberName: string, date: Date) => {
    const key = getAttendanceKey(memberId, date);
    setAbsenceEditor({
      memberId,
      memberName,
      date,
      dateLabel: formatAttendanceDate(date),
    });
    setReasonDraft(absenceReasons[key] ?? '');
  };

  const closeAbsenceEditor = () => {
    setAbsenceEditor(null);
    setReasonDraft('');
  };

  const saveAbsenceReason = () => {
    if (!absenceEditor) {
      return;
    }

    const trimmedReason = reasonDraft.trim();
    setAbsenceReason(absenceEditor.memberId, absenceEditor.date, trimmedReason || null);
    closeAbsenceEditor();
  };

  const getAbsenceCellHandlers = (memberId: string, memberName: string, date: Date) => {
    const openEditor = () => openAbsenceEditor(memberId, memberName, date);

    return Platform.select({
      web: {
        onContextMenu: (event: { preventDefault: () => void }) => {
          event.preventDefault();
          openEditor();
        },
      },
      default: {
        onLongPress: openEditor,
      },
    });
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
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
                <ThemedText type="smallBold" style={styles.memberName}>
                  {member.nameKo}
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={styles.memberRole}>
                  {member.position}
                </ThemedText>
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
                      isPresent && styles.attendanceCellPresent,
                      hasAbsenceReason && styles.attendanceCellAbsent,
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={[
                        styles.checkText,
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

      <ThemedText type="code" themeColor="textSecondary" style={styles.demoNote}>
        클릭으로 출석 체크 · {Platform.OS === 'web' ? '우클릭' : '길게 눌러'} 결석 사유 입력
      </ThemedText>

      <Modal
        visible={absenceEditor !== null}
        transparent
        animationType="fade"
        onRequestClose={closeAbsenceEditor}>
        <Pressable style={styles.modalOverlay} onPress={closeAbsenceEditor}>
          <View
            style={[styles.modalCard, { backgroundColor: theme.background }]}
            onStartShouldSetResponder={() => true}>
            <ThemedText type="smallBold" style={styles.modalTitle}>
              결석 사유
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.modalSubtitle}>
              {absenceEditor?.memberName} · {absenceEditor?.dateLabel}
            </ThemedText>

            <TextInput
              value={reasonDraft}
              onChangeText={setReasonDraft}
              onSubmitEditing={saveAbsenceReason}
              returnKeyType="done"
              submitBehavior="submit"
              placeholder="예: 해외 출장, 몸살, 가족 행사"
              placeholderTextColor={theme.textSecondary}
              autoFocus
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
        </Pressable>
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
  tableScroll: {
    alignSelf: 'stretch',
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
    borderColor: '#B0B4BA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  attendanceCellPresent: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  attendanceCellAbsent: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  checkText: {
    fontSize: FontSize.body,
    color: '#60646C',
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
    backgroundColor: '#22C55E',
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
