import { useRouter } from 'expo-router';
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
import { DEMO_AUTH_USERS } from '@/constants/auth-demo';
import { BorderRadius, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { getStayLoggedInPreference } from '@/utils/auth-storage';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getStayLoggedInPreference().then(setStayLoggedIn);
  }, []);

  const handleLogin = async () => {
    const result = await login(loginId, password, stayLoggedIn);

    if (!result.success) {
      setErrorMessage(result.error ?? '로그인에 실패했습니다.');
      return;
    }

    setErrorMessage('');
    router.replace('/');
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
                Project Duranno App
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
                  아이디
                </ThemedText>
                <TextInput
                  value={loginId}
                  onChangeText={(text) => {
                    setLoginId(text.toLowerCase());
                    setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="예: minsu (대소문자 구분 없음)"
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
                    setErrorMessage('');
                  }}
                  placeholder="비밀번호 입력"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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
                accessibilityState={{ checked: stayLoggedIn }}
                onPress={() => setStayLoggedIn((current) => !current)}
                style={({ pressed }) => [styles.stayLoggedInRow, pressed && styles.pressed]}>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: theme.backgroundSelected,
                      backgroundColor: stayLoggedIn ? '#22C55E' : theme.background,
                    },
                  ]}>
                  {stayLoggedIn ? <ThemedText style={styles.checkmark}>✓</ThemedText> : null}
                </View>
                <View style={styles.stayLoggedInTextGroup}>
                  <ThemedText type="smallBold" style={styles.stayLoggedInLabel}>
                    로그인 상태 유지
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.stayLoggedInHint}>
                    Stay logged in on this device
                  </ThemedText>
                </View>
              </Pressable>

              {errorMessage ? (
                <ThemedText type="small" style={styles.errorText}>
                  {errorMessage}
                </ThemedText>
              ) : null}

              <Pressable
                onPress={handleLogin}
                style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.loginButtonText}>
                  로그인
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.demoCard}>
              <ThemedText type="code" themeColor="textSecondary" style={styles.demoTitle}>
                Demo 계정
              </ThemedText>
              {DEMO_AUTH_USERS.map((user) => (
                <ThemedText key={user.id} type="small" themeColor="textSecondary" style={styles.demoLine}>
                  {user.fullName} · {user.loginId} / {user.password}
                </ThemedText>
              ))}
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  formCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
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
    fontSize: 14,
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
    fontSize: 12,
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
    fontSize: 11,
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
  demoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  demoTitle: {
    textTransform: 'uppercase',
    fontSize: 10,
  },
  demoLine: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  pressed: {
    opacity: 0.7,
  },
});
