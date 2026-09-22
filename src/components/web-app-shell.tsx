import type { PropsWithChildren } from 'react';
import { usePathname } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { MobileShellWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Routes that fill the browser viewport instead of the centered phone-width
// column — keyed by `usePathname()`'s resolved path, not the file/segment name.
const WIDE_ROUTES = new Set(['/', '/members']);

/**
 * On web, frames the app as a centered phone-width column — except on
 * `WIDE_ROUTES`, which fill the full viewport width for a desktop layout.
 * Native platforms render children unchanged.
 */
export function WebAppShell({ children }: PropsWithChildren) {
  const theme = useTheme();
  const pathname = usePathname();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const isWideRoute = WIDE_ROUTES.has(pathname);

  return (
    <View style={[styles.viewport, { backgroundColor: theme.backgroundElement }]}>
      <View
        style={[
          styles.shell,
          { maxWidth: isWideRoute ? '100%' : MobileShellWidth },
          {
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
        ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shell: {
    flex: 1,
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
});
