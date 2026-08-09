import {
  DEFAULT_FEATURE_FLAGS,
  listInvalidRemoteFlagKeys,
  parseFeatureFlags,
} from '@/core/remote-config/parser';

describe('remote config parser', () => {
  it('returns defaults for empty input', () => {
    expect(parseFeatureFlags(null)).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it('parses boolean flags', () => {
    expect(
      parseFeatureFlags([
        { key: 'feature_grammar', value: true },
        { key: 'feature_vocabulary', value: false },
      ]),
    ).toEqual({
      ...DEFAULT_FEATURE_FLAGS,
      grammar: true,
      vocabulary: false,
    });
  });

  it('keeps defaults for invalid values and lists invalid keys', () => {
    const rows = [{ key: 'feature_ai', value: 'yes' }];
    expect(parseFeatureFlags(rows).ai).toBe(false);
    expect(listInvalidRemoteFlagKeys(rows)).toEqual(['feature_ai']);
  });
});
