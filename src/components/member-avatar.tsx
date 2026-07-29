import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type MemberAvatarProps = {
  uri?: string | null;
  nameKo: string;
  size: number;
  style?: StyleProp<ViewStyle>;
};

export function MemberAvatar({ uri, nameKo, size, style }: MemberAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const showImage = Boolean(uri) && !hasError;

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.circle, circleStyle, style]}>
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <ThemedView type="backgroundElement" style={[StyleSheet.absoluteFill, styles.fallback]}>
          <ThemedText type="smallBold" style={{ fontSize: size * 0.4 }}>
            {nameKo.charAt(0)}
          </ThemedText>
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
