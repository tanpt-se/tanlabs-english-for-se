import { trackEvent } from '@/core/analytics/events';

describe('analytics event whitelist', () => {
  it('ignores non-allowed event names without throwing', async () => {
    await expect(trackEvent('secret_english_text', { text: 'hello' })).resolves.toBeUndefined();
  });

  it('accepts allowed lifecycle events', async () => {
    await expect(trackEvent('app_open')).resolves.toBeUndefined();
    await expect(trackEvent('login_success')).resolves.toBeUndefined();
  });
});
