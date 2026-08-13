import { Text } from 'react-native';

import { authFormStyles } from '@/features/auth/components/authFormStyles';
import { useAppColors } from '@/theme';

type AuthNoteProps = {
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  children: string;
  tone?: 'medium' | 'muted';
};

export function AuthNote({ accessibilityLiveRegion, children, tone = 'muted' }: AuthNoteProps) {
  const colors = useAppColors();

  return (
    <Text
      accessibilityLiveRegion={accessibilityLiveRegion}
      style={[
        tone === 'medium' ? authFormStyles.noteMedium : authFormStyles.note,
        { color: tone === 'medium' ? colors.textSecondary : colors.textMuted },
      ]}
    >
      {children}
    </Text>
  );
}
