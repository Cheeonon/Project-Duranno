import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BorderRadius, BottomTabInset, FontSize, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { signOut, changePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setMessage('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);
    const { error } = await changePassword(newPassword);
    setSubmitting(false);

    if (error) {
      setMessage(error);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setMessage('비밀번호가 변경되었습니다.');
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}>
      <ThemedView style={styles.container}>
        <Link href="/" asChild>
          <Pressable style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
            <ThemedText type="small" themeColor="textSecondary">
              ‹ 홈
            </ThemedText>
          </Pressable>
        </Link>

        <ThemedText type="subtitle">설정</ThemedText>

        <ThemedView type="backgroundElement" style={styles.section}>
          <ThemedText type="smallBold">비밀번호 변경</ThemedText>

          <TextInput
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setMessage(null);
            }}
            secureTextEntry
            placeholder="새 비밀번호"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSelected }]}
          />

          <TextInput
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setMessage(null);
            }}
            secureTextEntry
            placeholder="새 비밀번호 확인"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSelected }]}
          />

          {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}

          <Pressable
            onPress={handleChangePassword}
            disabled={submitting}
            style={[styles.button, { backgroundColor: theme.text, opacity: submitting ? 0.6 : 1 }]}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              {submitting ? '변경 중...' : '비밀번호 변경'}
            </ThemedText>
          </Pressable>
        </ThemedView>

        <Pressable
          onPress={() => signOut()}
          style={[styles.button, styles.logoutButton, { borderColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">로그아웃</ThemedText>
        </Pressable>

        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
    paddingTop: Spacing.six,
  },
  backLink: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.7,
  },
  section: {
    gap: Spacing.three,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: FontSize.default,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.three,
  },
  logoutButton: {
    borderWidth: 1,
  },
});
