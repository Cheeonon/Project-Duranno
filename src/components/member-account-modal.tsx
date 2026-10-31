import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { BorderRadius, FontSize, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { useMemberAccount } from '@/hooks/use-member-account';

type Props = Pick<ReturnType<typeof useMemberAccount>,
  'issuingMember' | 'issueEmail' | 'setIssueEmail' | 'issuePassword' | 'setIssuePassword' |
  'issueError' | 'issueSubmitting' | 'closeIssue' | 'submitIssue'>;

export function MemberAccountModal({ issuingMember, issueEmail, setIssueEmail, issuePassword, setIssuePassword, issueError, issueSubmitting, closeIssue, submitIssue }: Props) {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  return (
      <Modal visible={issuingMember !== null} transparent animationType="fade" onRequestClose={() => { if (!issueSubmitting) closeIssue(); }}>
        <Pressable style={styles.modalOverlay} disabled={issueSubmitting} onPress={closeIssue}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.background },
              isDark ? Shadow.raised.dark : Shadow.raised.light,
            ]}
            onStartShouldSetResponder={() => true}>
            <ThemedText type="smallBold">계정 발급</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {issuingMember?.nameKo}에게 로그인 계정을 발급합니다.
            </ThemedText>

            <TextInput
              value={issueEmail}
              onChangeText={setIssueEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="이메일"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <TextInput
              value={issuePassword}
              onChangeText={setIssuePassword}
              placeholder="임시 비밀번호 (6자 이상)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            {issueError && (
              <ThemedText type="small" themeColor="textSecondary">
                {issueError}
              </ThemedText>
            )}

            <View style={styles.modalActions}>
              <Button variant="ghost" disabled={issueSubmitting} onPress={closeIssue}>
                취소
              </Button>
              <Button variant="primary" disabled={issueSubmitting} loading={issueSubmitting} onPress={submitIssue}>
                계정 생성
              </Button>
            </View>
          </View>
        </Pressable>
      </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  modalScrollContent: {
    gap: Spacing.two,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  input: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: FontSize.default,
  },
});
