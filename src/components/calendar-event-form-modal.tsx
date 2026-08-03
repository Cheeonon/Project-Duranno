import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CalendarStoredCategory } from '@/lib/calendar-events';

/** Manual calendar rows (birthdays come from the members roster). */
const FORM_CATEGORY_OPTIONS: { id: CalendarStoredCategory; label: string }[] = [
  { id: 'events', label: '교회 행사' },
];

export type CalendarEventFormValue = {
  id?: string;
  title: string;
  detail: string;
  category: CalendarStoredCategory;
  eventDate: string;
  recursAnnually: boolean;
};

type CalendarEventFormModalProps = {
  visible: boolean;
  initial: CalendarEventFormValue | null;
  onClose: () => void;
  onSubmit: (value: CalendarEventFormValue) => void;
  onDelete?: (id: string) => void;
  submitting: boolean;
  error: string | null;
};

const EMPTY_DRAFT: CalendarEventFormValue = {
  title: '',
  detail: '',
  category: 'events',
  eventDate: '',
  recursAnnually: false,
};

export function CalendarEventFormModal({
  visible,
  initial,
  onClose,
  onSubmit,
  onDelete,
  submitting,
  error,
}: CalendarEventFormModalProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<CalendarEventFormValue>(EMPTY_DRAFT);

  useEffect(() => {
    if (!visible) {
      return;
    }
    // Reseeds the draft from `initial` each time the modal opens (or the
    // target event changes) — not a derived-state anti-pattern, `initial`
    // comes from the parent's create/edit trigger, not from `draft` itself.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(initial ?? EMPTY_DRAFT);
  }, [visible, initial]);

  const isEditing = Boolean(draft.id);
  const canSubmit = draft.title.trim().length > 0 && draft.eventDate.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel="일정 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled">
            <ThemedText type="smallBold">{isEditing ? '일정 수정' : '일정 추가'}</ThemedText>

            <TextInput
              value={draft.title}
              onChangeText={(text) => setDraft({ ...draft, title: text })}
              placeholder="제목"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <TextInput
              value={draft.detail}
              onChangeText={(text) => setDraft({ ...draft, detail: text })}
              placeholder="설명 (예: 오후 7:30 · 본당)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <TextInput
              value={draft.eventDate}
              onChangeText={(text) => setDraft({ ...draft, eventDate: text })}
              placeholder="날짜 (YYYY-MM-DD)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            <ThemedText type="small" themeColor="textSecondary">
              분류
            </ThemedText>
            <View style={styles.chipRow}>
              {FORM_CATEGORY_OPTIONS.map((option) => (
                <Pressable key={option.id} onPress={() => setDraft({ ...draft, category: option.id })}>
                  <ThemedView
                    type={draft.category === option.id ? 'backgroundSelected' : 'background'}
                    style={[styles.chip, { borderColor: theme.border }]}>
                    <ThemedText type="small">{option.label}</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => setDraft({ ...draft, recursAnnually: !draft.recursAnnually })}>
              <ThemedView
                type={draft.recursAnnually ? 'backgroundSelected' : 'background'}
                style={[styles.chip, styles.recurChip, { borderColor: theme.border }]}>
                <ThemedText type="small">{draft.recursAnnually ? '✓ 매년 반복' : '매년 반복'}</ThemedText>
              </ThemedView>
            </Pressable>

            {error && (
              <ThemedText type="small" themeColor="textSecondary">
                {error}
              </ThemedText>
            )}

            <View style={styles.modalActions}>
              {isEditing && onDelete ? (
                <Pressable
                  disabled={submitting}
                  onPress={() => draft.id && onDelete(draft.id)}
                  style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}>
                  <ThemedText type="small" style={styles.deleteLabel}>
                    삭제
                  </ThemedText>
                </Pressable>
              ) : (
                <View />
              )}

              <View style={styles.modalActionsRight}>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    취소
                  </ThemedText>
                </Pressable>
                <Pressable
                  disabled={submitting || !canSubmit}
                  onPress={() => onSubmit(draft)}
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalButtonPrimary,
                    (submitting || !canSubmit) && styles.modalButtonDisabled,
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={styles.submitLabel}>
                    {submitting ? '저장 중...' : '저장'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  modalActionsRight: {
    flexDirection: 'row',
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
  modalButtonDisabled: {
    opacity: 0.5,
  },
  deleteLabel: {
    color: '#EF4444',
  },
  submitLabel: {
    color: '#FFFFFF',
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
  recurChip: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.7,
  },
});
