import { StyleSheet, Text, View } from 'react-native';

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

/** Avatar + identity summary with optional edit affordance. */
export function ProfileSummaryCard({
  displayName,
  email,
  levelLabel,
  onEditPress,
}: ProfileSummaryCardProps) {
  const colors = useAppColors();
  const initials = initialsFromName(displayName);

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
        {email ? <Text style={[styles.meta, { color: colors.textMuted }]}>{email}</Text> : null}
        <Text style={[styles.level, { color: colors.primary }]}>{levelLabel}</Text>
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
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  card: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: themeTokens.spacing['12'],
    minHeight: 112,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.md,
  },
  copy: {
    flex: 1,
    flexShrink: 1,
    gap: themeTokens.spacing['3'],
  },
  edit: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    minHeight: 44,
    paddingVertical: 12,
  },
  initials: {
    fontSize: 16,
    fontWeight: '600',
  },
  level: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  meta: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
});
