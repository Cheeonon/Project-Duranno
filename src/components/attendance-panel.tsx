import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  DEMO_CELL_GROUP,
  DEMO_CELL_GROUP_MEMBERS,
  formatAttendanceDate,
  getAttendanceKey,
  getSundaysInMonth,
} from '@/constants/attendance-demo';
import { Spacing } from '@/constants/theme';
import { useHomeTextScale } from '@/contexts/home-text-scale';
import { useTheme } from '@/hooks/use-theme';

type AbsenceEditorTarget = {
  key: string;
  memberName: string;
  dateLabel: string;
};

export function AttendancePanel() {
  const theme = useTheme();
  const { scaled } = useHomeTextScale();
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const sundays = useMemo(() => getSundaysInMonth(year, month), [year, month]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [absenceReasons, setAbsenceReasons] = useState<Record<string, string>>({});
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

    setAttendance((current) => ({
      ...current,
      [key]: !wasPresent,
    }));

    if (!wasPresent) {
      setAbsenceReasons((current) => {
        if (!current[key]) {
          return current;
        }

        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const openAbsenceEditor = (memberId: string, memberName: string, date: Date) => {
    const key = getAttendanceKey(memberId, date);
    setAbsenceEditor({
      key,
      memberName,
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

    if (trimmedReason) {
      setAbsenceReasons((current) => ({
        ...current,
        [absenceEditor.key]: trimmedReason,
      }));
      setAttendance((current) => ({
        ...current,
        [absenceEditor.key]: false,
      }));
    } else {
      setAbsenceReasons((current) => {
        const next = { ...current };
        delete next[absenceEditor.key];
        return next;
      });
    }

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
        {DEMO_CELL_GROUP.name}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.headerSubtitle}>
        셀리더 {DEMO_CELL_GROUP.leader}
      </ThemedText>

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

          {DEMO_CELL_GROUP_MEMBERS.map((member) => (
            <View key={member.id} style={styles.tableRow}>
              <View style={styles.nameCell}>
                <ThemedText type="smallBold" style={styles.memberName}>
                  {member.name}
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={styles.memberRole}>
                  {member.role}
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
                    accessibilityLabel={`${member.name} ${formatAttendanceDate(date)} 출석`}
                    onPress={() => toggleAttendance(member.id, date)}
                    {...getAbsenceCellHandlers(member.id, member.name, date)}
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
        Demo · 클릭으로 출석 체크 · {Platform.OS === 'web' ? '우클릭' : '길게 눌러'} 결석 사유 입력
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
                  fontSize: scaled(13),
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
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  headerSubtitle: {
    fontSize: 11,
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
    fontSize: 12,
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
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  sundayLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  nameCell: {
    width: 88,
    paddingVertical: Spacing.one,
    gap: 2,
  },
  memberName: {
    fontSize: 12,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  memberRole: {
    fontSize: 10,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  attendanceCell: {
    width: 52,
    height: 40,
    borderRadius: Spacing.two,
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
    fontSize: 14,
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
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  modalTitle: {
    fontSize: 14,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  reasonInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
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
    borderRadius: Spacing.two,
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
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  pressed: {
    opacity: 0.7,
  },
});
