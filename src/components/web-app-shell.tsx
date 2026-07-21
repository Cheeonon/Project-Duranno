import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { MobileShellWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * On web, frames the entire app as a centered phone-width column.
 * Native platforms render children unchanged.
 */
export function WebAppShell({ children }: PropsWithChildren) {
  const theme = useTheme();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={[styles.viewport, { backgroundColor: theme.backgroundElement }]}>
      <View
        style={[
          styles.shell,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
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
    maxWidth: MobileShellWidth,
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
});
