import { useMemo, useState, type RefObject } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type ScrollView as ScrollViewType } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  DEMO_CHURCH_MEMBERS,
  formatMemberDob,
  searchChurchMembers,
} from '@/constants/members-demo';
import { Spacing } from '@/constants/theme';
import { useHomeTextScale } from '@/contexts/home-text-scale';
import { useTheme } from '@/hooks/use-theme';

const RESULTS_MAX_HEIGHT = 320;

type MemberSearchPanelProps = {
  scrollRef?: RefObject<ScrollViewType | null>;
  preserveScrollPosition?: () => void;
};

export function MemberSearchPanel({ scrollRef, preserveScrollPosition }: MemberSearchPanelProps) {
  const theme = useTheme();
  const { scaled } = useHomeTextScale();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchChurchMembers(query), [query]);

  const lockScrollPosition = () => {
    if (!scrollRef || !preserveScrollPosition) {
      return;
    }

    preserveScrollPosition();
    requestAnimationFrame(preserveScrollPosition);
    setTimeout(preserveScrollPosition, 50);
  };

  return (
    <ThemedView type="backgroundSelected" style={styles.container}>
      <ThemedText type="smallBold" style={styles.headerTitle}>
        교인 검색
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.headerSubtitle}>
        이름, 생년월일, 전화번호, 셀그룹으로 검색
      </ThemedText>

      <TextInput
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          lockScrollPosition();
        }}
        onFocus={lockScrollPosition}
        placeholder="예: 김민수, 1982, 010-2345"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.searchInput,
          {
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
            fontSize: scaled(14),
          },
        ]}
      />

      <ThemedText type="code" themeColor="textSecondary" style={styles.resultCount}>
        {results.length}명 검색됨
      </ThemedText>

      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.results}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {results.length > 0 ? (
          results.map((member) => (
            <ThemedView key={member.id} type="background" style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <ThemedText type="smallBold" style={styles.memberName}>
                  {member.name}
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={styles.memberRole}>
                  {member.role}
                </ThemedText>
              </View>

              <View style={styles.resultDetails}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.detailText}>
                  생년월일 · {formatMemberDob(member.dob)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.detailText}>
                  전화번호 · {member.phone}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.detailText}>
                  셀그룹 · {member.cellGroup}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.detailText}>
                  주소 · {member.address}
                </ThemedText>
              </View>
            </ThemedView>
          ))
        ) : (
          <ThemedView type="background" style={styles.emptyState}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              검색 결과가 없습니다.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>

      <ThemedText type="code" themeColor="textSecondary" style={styles.demoNote}>
        Demo · 총 {DEMO_CHURCH_MEMBERS.length}명 등록
      </ThemedText>
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
  searchInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  resultCount: {
    fontSize: 10,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  resultsScroll: {
    height: RESULTS_MAX_HEIGHT,
  },
  results: {
    gap: Spacing.two,
  },
  resultCard: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0D0D5',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  memberName: {
    fontSize: 14,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  memberRole: {
    fontSize: 11,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  resultDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  emptyState: {
    borderRadius: Spacing.two,
    padding: Spacing.four,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  demoNote: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
});
