import { Link } from 'expo-router';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BorderRadius, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { profile, signOut, changePassword } = useAuth();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const resetPasswordForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const openPasswordModal = () => {
    resetPasswordForm();
    setIsPasswordModalVisible(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalVisible(false);
    resetPasswordForm();
  };

  const clearPasswordFeedback = () => {
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleChangePassword = async () => {
    if (passwordSuccess) {
      closePasswordModal();
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const { error } = await changePassword(newPassword);

    if (error) {
      setPasswordSuccess('');
      setPasswordError(error);
      return;
    }

    setPasswordError('');
    setPasswordSuccess('비밀번호가 변경되었습니다.');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <>
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
          <ThemedText style={styles.description} themeColor="textSecondary">
            계정과 앱 설정을 관리할 수 있습니다.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              계정
            </ThemedText>

            {profile ? (
              <>
                <ThemedText type="smallBold" style={styles.accountName}>
                  {profile.nameKo}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.accountRole}>
                  {profile.position} · {profile.permission}
                </ThemedText>
                <Pressable
                  accessibilityLabel="비밀번호 변경"
                  onPress={openPasswordModal}
                  style={({ pressed }) => [styles.changePasswordButton, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.changePasswordButtonText}>
                    비밀번호 변경
                  </ThemedText>
                </Pressable>
                <Pressable
                  accessibilityLabel="로그아웃"
                  onPress={() => signOut()}
                  style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.logoutButtonText}>
                    로그아웃
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.accountRole}>
                로그인된 계정이 없습니다.
              </ThemedText>
            )}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              앱 설정
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.accountRole}>
              추가 설정은 곧 제공될 예정입니다.
            </ThemedText>
          </ThemedView>

          {Platform.OS === 'web' && <WebBadge />}
        </ThemedView>
      </ScrollView>

      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}>
        <Pressable style={styles.modalOverlay} onPress={closePasswordModal}>
          <View
            style={[styles.modalCard, { backgroundColor: theme.background }]}
            onStartShouldSetResponder={() => true}>
            <ThemedText type="smallBold" style={styles.modalTitle}>
              비밀번호 변경
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.modalSubtitle}>
              {profile?.nameKo}
            </ThemedText>

            {passwordSuccess ? (
              <ThemedText type="small" style={styles.successText}>
                {passwordSuccess}
              </ThemedText>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                    새 비밀번호
                  </ThemedText>
                  <TextInput
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      clearPasswordFeedback();
                    }}
                    placeholder="새 비밀번호 입력 (6자 이상)"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                    새 비밀번호 확인
                  </ThemedText>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearPasswordFeedback();
                    }}
                    placeholder="새 비밀번호 다시 입력"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleChangePassword}
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}
                  />
                </View>

                {passwordError ? (
                  <ThemedText type="small" style={styles.errorText}>
                    {passwordError}
                  </ThemedText>
                ) : null}
              </>
            )}

            <View style={styles.modalActions}>
              <Pressable
                onPress={closePasswordModal}
                style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}>
                <ThemedText type="small" themeColor="textSecondary">
                  취소
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleChangePassword}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={styles.modalButtonPrimaryText}>
                  {passwordSuccess ? '확인' : '변경'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
    paddingTop: Spacing.four,
  },
  backLink: {
    alignSelf: 'flex-start',
  },
  description: {
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  sectionTitle: {
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  accountName: {
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  accountRole: {
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
    fontSize: 16,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  successText: {
    color: '#22C55E',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  changePasswordButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: '#22C55E',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
  changePasswordButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  logoutButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: '#EF4444',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  modalTitle: {
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  modalSubtitle: {
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  modalButton: {
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  modalButtonPrimary: {
    backgroundColor: '#22C55E',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  pressed: {
    opacity: 0.7,
  },
});
