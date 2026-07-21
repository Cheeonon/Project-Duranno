import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, FontSize, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { getStaySignedInPreference, setStaySignedInPreference } from '@/lib/supabase';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getStaySignedInPreference().then(setStaySignedIn);
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    await setStaySignedInPreference(staySignedIn);
    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (signInError) {
      setError(signInError);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <AnimatedIcon />
              <ThemedText type="subtitle" style={styles.title}>
                두란노 성도 관리 어플
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                교회를 위한 성도 관리 어플에 오신 것을 환영합니다.
              </ThemedText>
            </View>

            <ThemedView type="backgroundElement" style={styles.formCard}>
              <ThemedText type="smallBold" style={styles.formTitle}>
                로그인
              </ThemedText>

              <View style={styles.fieldGroup}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                  이메일
                </ThemedText>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  spellCheck={false}
                  placeholder="이메일 주소"
                  placeholderTextColor={theme.textSecondary}
                  returnKeyType="next"
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.background,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                  비밀번호
                </ThemedText>
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  placeholder="비밀번호 입력"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.background,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>

              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: staySignedIn }}
                onPress={() => setStaySignedIn((current) => !current)}
                style={({ pressed }) => [styles.stayLoggedInRow, pressed && styles.pressed]}>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: theme.backgroundSelected,
                      backgroundColor: staySignedIn ? '#22C55E' : theme.background,
                    },
                  ]}>
                  {staySignedIn ? <ThemedText style={styles.checkmark}>✓</ThemedText> : null}
                </View>
                <View style={styles.stayLoggedInTextGroup}>
                  <ThemedText type="smallBold" style={styles.stayLoggedInLabel}>
                    로그인 상태 유지
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.stayLoggedInHint}>
                    Stay signed in on this device
                  </ThemedText>
                </View>
              </Pressable>

              {error ? (
                <ThemedText type="small" style={styles.errorText}>
                  {error}
                </ThemedText>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.loginButton,
                  { opacity: submitting ? 0.6 : 1 },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={styles.loginButtonText}>
                  {submitting ? '로그인 중...' : '로그인'}
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
    fontSize: FontSize.heading,
    lineHeight: 28,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  formCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  formTitle: {
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  label: {
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: FontSize.default,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  stayLoggedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: FontSize.caption,
    lineHeight: 14,
    fontWeight: '700',
  },
  stayLoggedInTextGroup: {
    flex: 1,
    gap: 2,
  },
  stayLoggedInLabel: {
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  stayLoggedInHint: {
    fontSize: FontSize.micro,
    lineHeight: 14,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: '#22C55E',
    paddingVertical: Spacing.two,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  pressed: {
    opacity: 0.7,
  },
});
