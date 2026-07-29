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

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { BorderRadius, Colors, FontSize, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
          isFocused && (isDark ? styles.tabButtonViewFocusedDark : styles.tabButtonViewFocusedLight),
        ]}>
        <ThemedText type="smallBold" themeColor={isFocused ? 'text' : 'textSecondary'} style={styles.navLabel}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView
        type="backgroundElement"
        style={[
          styles.innerContainer,
          scheme === 'dark' ? styles.innerContainerShadowDark : styles.innerContainerShadowLight,
        ]}>
        <ThemedText type="smallBold" style={styles.brandText} numberOfLines={1}>
          DURANNO
        </ThemedText>

        {props.children}

        <Link href="/settings" asChild>
          <Pressable style={styles.settingsPressable}>
            <ThemedText type="link" style={styles.navLabel}>
              설정
            </ThemedText>
            <SymbolView
              tintColor={colors.text}
              name={{ ios: 'gearshape', web: 'settings' }}
              size={16}
            />
          </Pressable>
        </Link>
      </ThemedView>
    </View>
  );
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
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  innerContainerShadowLight: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.3)', inset: true }],
  },
  innerContainerShadowDark: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.06)', inset: true }],
  },
  brandText: {
    marginRight: 'auto',
    flexShrink: 1,
    fontSize: FontSize.body,
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
    borderRadius: BorderRadius.md,
  },
  tabButtonViewFocusedLight: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.35)', inset: true }],
  },
  tabButtonViewFocusedDark: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.07)', inset: true }],
  },
  settingsPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.one,
  },
});
