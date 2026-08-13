import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/button';
import { themeTokens, useAppColors } from '@/theme';

type ConfirmModalProps = {
  busy?: boolean;
  cancelLabel?: string;
  confirmLabel: string;
  confirmTone?: 'default' | 'danger';
  message: string;
  note?: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

/**
 * Full-screen confirm dialog. Content-first with optional supporting note;
 * two full-width actions; does not dismiss on scrim press.
 */
export function ConfirmModal({
  busy = false,
  cancelLabel = 'Cancel',
  confirmLabel,
  confirmTone = 'default',
  message,
  note,
  onCancel,
  onConfirm,
  title,
  visible,
}: ConfirmModalProps) {
  const colors = useAppColors();

  return (
    <Modal
      animationType={process.env.NODE_ENV === 'test' ? 'none' : 'fade'}
      transparent
      visible={visible}
      onRequestClose={() => {
        if (!busy) {
          onCancel();
        }
      }}
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.scrim, { backgroundColor: colors.text }]}
        />
        <View
          accessibilityRole="summary"
          style={[styles.card, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.cue, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.cueGlyph, { color: colors.primary }]}>!</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
          {note ? (
            <View style={[styles.note, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.noteText, { color: colors.textMuted }]}>{note}</Text>
            </View>
          ) : null}
          <AppButton
            accessibilityLabel={cancelLabel}
            accessibilityRole="button"
            disabled={busy}
            fullWidth
            label={cancelLabel}
            testID="confirm-modal-cancel"
            variant="secondary"
            onPress={onCancel}
          />
          <AppButton
            accessibilityLabel={confirmLabel}
            accessibilityRole="button"
            disabled={busy}
            fullWidth
            label={busy ? `${confirmLabel}…` : confirmLabel}
            testID="confirm-modal-confirm"
            variant={confirmTone === 'danger' ? 'destructive' : 'primary'}
            onPress={onConfirm}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.xl,
    elevation: 8,
    gap: themeTokens.spacing.md,
    marginHorizontal: themeTokens.spacing.lg,
    maxWidth: 342,
    padding: themeTokens.spacing['20'],
    shadowColor: '#0D1E46',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    width: '100%',
  },
  cue: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  cueGlyph: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    width: '100%',
  },
  note: {
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing['12'],
    paddingVertical: themeTokens.spacing['10'],
    width: '100%',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  root: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    opacity: 0.56,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    textAlign: 'center',
    width: '100%',
  },
});
