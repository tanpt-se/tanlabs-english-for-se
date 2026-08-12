import { getAnalytics, logEvent } from '@react-native-firebase/analytics';

import { trackEvent } from '@/core/analytics/events';

const mockedLogEvent = logEvent as unknown as jest.MockedFunction<
  (...args: unknown[]) => Promise<void>
>;

describe('analytics event whitelist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLogEvent.mockResolvedValue(undefined);
  });

  it('ignores non-allowed event names without throwing', async () => {
    await expect(trackEvent('secret_english_text', { text: 'hello' })).resolves.toBeUndefined();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('accepts allowed lifecycle events and sanitizes params', async () => {
    await trackEvent('app_open');
    await trackEvent('login_success', {
      email: 'secret@example.com',
      display_name: 'hidden',
      text: 'practice',
      password: 'x',
      source: 'home',
      count: 2,
      flagged: true,
      skip: undefined,
    });

    expect(logEvent).toHaveBeenCalledWith(getAnalytics(), 'app_open', undefined);
    expect(logEvent).toHaveBeenCalledWith(getAnalytics(), 'login_success', {
      source: 'home',
      count: 2,
      flagged: 1,
    });
  });

  it('drops params that sanitize to an empty object', async () => {
    await trackEvent('logout', { email: 'a@b.c', text: 'x' });
    expect(logEvent).toHaveBeenCalledWith(getAnalytics(), 'logout', undefined);
  });

  it('accepts grammar practice completion with score bucket only', async () => {
    await trackEvent('grammar_practice_completed', {
      topic_slug: 'present-simple',
      lesson_slug: 'core',
      score_bucket: '70-84',
      score: 78,
      text: 'ignored',
    });
    expect(logEvent).toHaveBeenCalledWith(getAnalytics(), 'grammar_practice_completed', {
      topic_slug: 'present-simple',
      lesson_slug: 'core',
      score_bucket: '70-84',
    });
  });

  it('accepts grammar funnel open events', async () => {
    await trackEvent('grammar_opened');
    await trackEvent('grammar_topic_opened', { topic_slug: 'modals', email: 'x@y.z' });
    expect(logEvent).toHaveBeenCalledWith(getAnalytics(), 'grammar_opened', undefined);
    expect(logEvent).toHaveBeenCalledWith(getAnalytics(), 'grammar_topic_opened', {
      topic_slug: 'modals',
    });
  });

  it('logs in __DEV__ when Firebase analytics fails', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    mockedLogEvent.mockRejectedValueOnce(new Error('analytics down'));
    await trackEvent('app_open', { source: 'boot' });
    expect(log).toHaveBeenCalledWith('[analytics]', 'app_open', { source: 'boot' });
    log.mockRestore();
  });
});
