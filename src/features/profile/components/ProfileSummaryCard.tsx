import { StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/ui/typography';
import { themeTokens, useAppColors } from '@/theme';

type ProfileSummaryCardProps = {
  displayName: string;
  email?: string | null;
  levelLabel: string;
  onEditPress?: () => void;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

/** Avatar + identity summary — Figma Pattern/Avatar + ProfileCard. */
export function ProfileSummaryCard({
  displayName,
  email,
  levelLabel,
  onEditPress,
}: ProfileSummaryCardProps) {
  const colors = useAppColors();
  const initials = initialsFromName(displayName);

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={[styles.initials, { color: colors.onPrimary }]}>{initials}</Text>
      </View>
      <View style={styles.copy}>
        <AppText variant="h3">{displayName}</AppText>
        {email ? (
          <AppText color={colors.textSecondary} variant="caption">
            {email}
          </AppText>
        ) : null}
        <AppText color={colors.primary} variant="caption">
          {levelLabel}
        </AppText>
      </View>
      {onEditPress ? (
        <Text
          accessibilityLabel="Edit profile"
          accessibilityRole="link"
          onPress={onEditPress}
          style={[styles.edit, { color: colors.primary }]}
        >
          Edit
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.lg,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  card: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.lg,
    flexDirection: 'row',
    gap: themeTokens.spacing['12'],
    padding: themeTokens.spacing.md,
    width: '100%',
  },
  copy: {
    flex: 1,
    flexShrink: 1,
    gap: themeTokens.spacing['3'],
  },
  edit: {
    fontSize: themeTokens.typography.size.label,
    fontWeight: '500',
    lineHeight: themeTokens.typography.lineHeight.label,
    minHeight: 44,
    paddingVertical: 12,
  },
  initials: {
    fontSize: themeTokens.typography.size.caption,
    fontWeight: '500',
  },
});
