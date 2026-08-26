import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { MemberAvatar } from '@/components/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StackScreenEnter } from '@/components/stack-screen-enter';
import { TextSizeControl } from '@/components/text-size-control';
import { Button } from '@/components/ui/button';
import { Accent, BorderRadius, BottomTabInset, KoreanFont, MaxContentWidth, Shadow, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { deleteMemberPhoto, uploadMemberPhoto } from '@/lib/member-photos';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const { profile, signOut, changePassword, refreshProfile } = useAuth();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoRemoving, setPhotoRemoving] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const pickAndChangePhoto = async () => {
    if (!profile) {
      return;
    }

    setPhotoError('');

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError('사진 보관함 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setPhotoUploading(true);
    try {
      const { data: currentMember } = await supabase
        .from('members')
        .select('photo_path')
        .eq('id', profile.memberId)
        .single();

      const newPath = await uploadMemberPhoto(profile.memberId, asset.uri, asset.mimeType ?? 'image/jpeg');

      const { error: updateError } = await supabase
        .from('members')
        .update({ photo_path: newPath })
        .eq('id', profile.memberId);

      if (updateError) {
        throw updateError;
      }

      if (currentMember?.photo_path) {
        deleteMemberPhoto(currentMember.photo_path);
      }

      await refreshProfile();
    } catch (uploadError) {
      setPhotoError(uploadError instanceof Error ? uploadError.message : '사진 업로드에 실패했습니다.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!profile) {
      return;
    }

    setPhotoError('');
    setPhotoRemoving(true);
    try {
      const { data: currentMember } = await supabase
        .from('members')
        .select('photo_path')
        .eq('id', profile.memberId)
        .single();

      const { error: updateError } = await supabase
        .from('members')
        .update({ photo_path: null })
        .eq('id', profile.memberId);

      if (updateError) {
        throw updateError;
      }

      if (currentMember?.photo_path) {
        deleteMemberPhoto(currentMember.photo_path);
      }

      await refreshProfile();
    } catch (removeError) {
      setPhotoError(removeError instanceof Error ? removeError.message : '사진 삭제에 실패했습니다.');
    } finally {
      setPhotoRemoving(false);
    }
  };

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
    <StackScreenEnter>
      <>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}>
        <ThemedView style={styles.container}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
            style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
            <ThemedText type="small" themeColor="textSecondary">
              ‹ 홈
            </ThemedText>
          </Pressable>

          <ThemedText type="subtitle">설정</ThemedText>
          <ThemedText style={styles.description} themeColor="textSecondary">
            계정과 앱 설정을 관리할 수 있습니다.
          </ThemedText>

          <ThemedView
            type="backgroundElement"
            style={[styles.sectionCard, isDark ? Shadow.card.dark : Shadow.card.light]}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              계정
            </ThemedText>

            {profile ? (
              <>
                <View style={styles.photoRow}>
                  <MemberAvatar uri={profile.photoUrl} nameKo={profile.nameKo} size={72} />
                  <View style={styles.photoActions}>
                    <Pressable
                      disabled={photoUploading || photoRemoving}
                      onPress={pickAndChangePhoto}
                      style={({ pressed }) => [
                        styles.photoButton,
                        { borderColor: theme.border },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="small">
                        {photoUploading ? '업로드 중...' : profile.photoUrl ? '사진 변경' : '사진 추가'}
                      </ThemedText>
                    </Pressable>
                    {profile.photoUrl ? (
                      <Pressable
                        disabled={photoUploading || photoRemoving}
                        onPress={removePhoto}
                        style={({ pressed }) => [
                          styles.photoButton,
                          { borderColor: theme.border },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText type="small" style={styles.errorText}>
                          {photoRemoving ? '삭제 중...' : '사진 삭제'}
                        </ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                {photoError ? (
                  <ThemedText type="small" style={styles.errorText}>
                    {photoError}
                  </ThemedText>
                ) : null}

                <ThemedText type="smallBold" style={styles.accountName}>
                  {profile.nameKo}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.accountRole}>
                  {profile.position} · {profile.permission}
                </ThemedText>
                <Button variant="primary" fullWidth style={styles.actionSpacing} onPress={openPasswordModal}>
                  비밀번호 변경
                </Button>
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

          <ThemedView
            type="backgroundElement"
            style={[styles.sectionCard, isDark ? Shadow.card.dark : Shadow.card.light]}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              앱 설정
            </ThemedText>
            <View style={styles.settingRow}>
              <ThemedText type="small" style={styles.settingRowLabel}>
                글자 크기
              </ThemedText>
              <TextSizeControl />
            </View>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}>
        <Pressable style={styles.modalOverlay} onPress={closePasswordModal}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.background },
              isDark ? Shadow.raised.dark : Shadow.raised.light,
            ]}
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
              <Button variant="ghost" onPress={closePasswordModal}>
                취소
              </Button>
              <Button variant="primary" onPress={handleChangePassword}>
                {passwordSuccess ? '확인' : '변경'}
              </Button>
            </View>
          </View>
        </Pressable>
      </Modal>
      </>
    </StackScreenEnter>
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
    fontFamily: KoreanFont,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  sectionTitle: {
    fontFamily: KoreanFont,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  photoActions: {
    gap: Spacing.two,
  },
  photoButton: {
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  accountName: {
    fontFamily: KoreanFont,
  },
  accountRole: {
    fontFamily: KoreanFont,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingRowLabel: {
    fontFamily: KoreanFont,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  label: {
    fontFamily: KoreanFont,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    fontFamily: KoreanFont,
  },
  errorText: {
    color: '#EF4444',
    fontFamily: KoreanFont,
  },
  successText: {
    color: Accent.green,
    fontFamily: KoreanFont,
  },
  actionSpacing: {
    marginTop: Spacing.two,
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
    fontFamily: KoreanFont,
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
    fontFamily: KoreanFont,
  },
  modalSubtitle: {
    fontFamily: KoreanFont,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
