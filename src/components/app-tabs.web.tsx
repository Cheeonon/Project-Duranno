import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, View, StyleSheet } from 'react-native';

import { MemberAvatar } from './member-avatar';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { BorderRadius, Colors, FontSize, MaxContentWidth, Shadow, Spacing, TopTabInset } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

const PROFILE_ICON_SIZE = 30;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%', paddingTop: TopTabInset }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>홈</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>달력</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[
          styles.tabButtonView,
          isFocused && (isDark ? Shadow.card.dark : Shadow.card.light),
        ]}>
        <ThemedText type="smallBold" themeColor={isFocused ? 'text' : 'textSecondary'} style={styles.navLabel}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.navRow}>
        <Link href="/" asChild>
          <Pressable accessibilityLabel="홈으로 이동">
            <ThemedText type="smallBold" style={styles.brandText} numberOfLines={1}>
              DURANNO
            </ThemedText>
          </Pressable>
        </Link>

        <Link href="/settings" asChild>
          <Pressable accessibilityLabel="내 정보" style={styles.profilePressable}>
            <ProfileIcon />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

function ProfileIcon() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useAuth();

  // Not loaded yet — no name to derive a fallback letter from, so fall back
  // to the generic icon until the profile arrives.
  if (!profile) {
    return (
      <SymbolView
        tintColor={colors.text}
        name={{ ios: 'person.crop.circle', web: 'account_circle' }}
        size={PROFILE_ICON_SIZE}
      />
    );
  }

  return <MemberAvatar uri={profile.photoUrl} nameKo={profile.nameKo} size={PROFILE_ICON_SIZE} />;
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  navRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandText: {
    fontSize: FontSize.default,
    lineHeight: 20,
  },
  navLabel: {
    fontSize: FontSize.body,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.full,
  },
  profilePressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
