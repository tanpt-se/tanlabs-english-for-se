import { StyleSheet } from 'react-native';

import { themeTokens } from '@/theme';

/** Shared auth form rhythm (Figma V2 Auth: hero gap 12, column gap 40, fields/actions 12). */
export const authFormStyles = StyleSheet.create({
  actions: {
    gap: themeTokens.spacing['12'],
    width: '100%',
  },
  fields: {
    gap: themeTokens.spacing['12'],
    width: '100%',
  },
  form: {
    gap: themeTokens.spacing.lg,
    width: '100%',
  },
  inlineLink: {
    alignSelf: 'stretch',
  },
  inlineLinkText: {
    fontSize: themeTokens.typography.size.bodySmall,
    fontWeight: '500',
    lineHeight: themeTokens.typography.lineHeight.bodySmall,
  },
  link: {
    justifyContent: 'center',
    minHeight: 44,
  },
  linkText: {
    fontSize: themeTokens.typography.size.body,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  note: {
    fontSize: themeTokens.typography.size.bodySmall,
    lineHeight: themeTokens.typography.lineHeight.body,
  },
  noteMedium: {
    fontSize: themeTokens.typography.size.label,
    fontWeight: '500',
    lineHeight: themeTokens.typography.lineHeight.label,
  },
  stack: {
    gap: themeTokens.spacing['40'],
    width: '100%',
  },
});
