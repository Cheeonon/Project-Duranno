import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Spacing } from '@/constants/theme';

export type CalendarFilterCategory = 'birthdays' | 'events';

export const CALENDAR_FILTER_OPTIONS = [
  {
    id: 'birthdays' as const,
    label: '생일자',
    color: '#F472B6',
    description: '성도 생일 일정',
  },
  {
    id: 'events' as const,
    label: '교회 행사',
    color: '#3B82F6',
    description: '예배·행사 일정',
  },
];

type CalendarFilterSectionProps = {
  selectedFilters: CalendarFilterCategory[];
  onToggleFilter: (filter: CalendarFilterCategory) => void;
  layout?: 'calendar' | 'panel';
};

export function CalendarFilterSection({
  selectedFilters,
  onToggleFilter,
  layout = 'calendar',
}: CalendarFilterSectionProps) {
  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.container, layout === 'panel' && styles.containerPanel]}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold" style={styles.title}>
          Filter
        </ThemedText>
        <ThemedText type="code" themeColor="textSecondary" style={styles.demoNote}>
          Demo
        </ThemedText>
      </View>

      <View style={styles.optionsRow}>
        {CALENDAR_FILTER_OPTIONS.map((option) => {
          const isSelected = selectedFilters.includes(option.id);

          return (
            <Pressable
              key={option.id}
              onPress={() => onToggleFilter(option.id)}
              style={({ pressed }) => [styles.optionPressable, pressed && styles.pressed]}>
              <ThemedView
                type={isSelected ? 'backgroundSelected' : 'background'}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}>
                <View style={[styles.colorDot, { backgroundColor: option.color }]} />
                <ThemedText type="smallBold" style={styles.optionLabel}>
                  {option.label}
                </ThemedText>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected ? <ThemedText style={styles.checkmark}>✓</ThemedText> : null}
                </View>
              </ThemedView>
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    width: '50%',
    maxWidth: 256,
    borderRadius: BorderRadius.sm,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  containerPanel: {
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 11,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  optionPressable: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.half,
    paddingVertical: Spacing.one,
    paddingHorizontal: 6,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0D0D5',
  },
  optionCardSelected: {
    borderColor: '#22C55E',
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 2,
  },
  optionLabel: {
    flex: 1,
    fontSize: 9,
    lineHeight: 12,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#B0B4BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  demoNote: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
});
