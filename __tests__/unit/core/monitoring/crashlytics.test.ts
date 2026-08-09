import {
  crash,
  getCrashlytics,
  recordError as recordCrashlyticsError,
  setAttribute,
  setCrashlyticsCollectionEnabled,
} from '@react-native-firebase/crashlytics';
import { Platform } from 'react-native';

import { initializeMonitoring, recordError, triggerTestCrash } from '@/core/monitoring/crashlytics';

describe('crashlytics wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(setCrashlyticsCollectionEnabled).mockResolvedValue(null);
    jest.mocked(setAttribute).mockResolvedValue(null);
  });

  it('enables collection and sets platform attributes', async () => {
    await initializeMonitoring();

    const instance = getCrashlytics();
    expect(setCrashlyticsCollectionEnabled).toHaveBeenCalledWith(instance, true);
    expect(setAttribute).toHaveBeenCalledWith(instance, 'platform', Platform.OS);
    expect(setAttribute).toHaveBeenCalledWith(instance, 'app_version', '0.0.1');
    expect(setAttribute).toHaveBeenCalledWith(instance, 'build', '1');
  });

  it('swallows initialize failures', async () => {
    jest.mocked(setCrashlyticsCollectionEnabled).mockRejectedValueOnce(new Error('missing'));
    await expect(initializeMonitoring()).resolves.toBeUndefined();
  });

  it('records Error and non-Error values', async () => {
    const err = new Error('boom');
    await recordError(err);
    expect(recordCrashlyticsError).toHaveBeenCalledWith(getCrashlytics(), err);

    await recordError('string-fail');
    expect(recordCrashlyticsError).toHaveBeenCalledWith(
      getCrashlytics(),
      expect.objectContaining({ message: 'string-fail' }),
    );
  });

  it('warns in __DEV__ when recordError cannot call native', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.mocked(recordCrashlyticsError).mockImplementationOnce(() => {
      throw new Error('native down');
    });
    await recordError(new Error('ignored'));
    expect(warn).toHaveBeenCalledWith('[crashlytics]', expect.any(Error));
    warn.mockRestore();
  });

  it('triggers a controlled crash in __DEV__', () => {
    triggerTestCrash();
    expect(crash).toHaveBeenCalledWith(getCrashlytics());
  });
});
