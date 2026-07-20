import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, FontSize, ThemeColor } from '@/constants/theme';
import { scaleTextStyle, useHomeTextScale } from '@/contexts/home-text-scale';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { scale, scaled } = useHomeTextScale();

  const typeStyle =
    type === 'default'
      ? styles.default
      : type === 'title'
        ? styles.title
        : type === 'small'
          ? styles.small
          : type === 'smallBold'
            ? styles.smallBold
            : type === 'subtitle'
              ? styles.subtitle
              : type === 'link'
                ? styles.link
                : type === 'linkPrimary'
                  ? styles.linkPrimary
                  : styles.code;

  const scaledTypeStyle = scale === 1 ? typeStyle : scaleTextStyle(typeStyle, scaled);
  const scaledCustomStyle =
    scale === 1 ? style : scaleTextStyle(StyleSheet.flatten(style) as TextStyle | undefined, scaled);

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        scaledTypeStyle,
        scaledCustomStyle,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: FontSize.body,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: FontSize.body,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: FontSize.default,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: FontSize.subtitle,
    lineHeight: 44,
    fontWeight: 600,
  },
  link: {
    lineHeight: 30,
    fontSize: FontSize.body,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: FontSize.body,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: FontSize.caption,
  },
});
