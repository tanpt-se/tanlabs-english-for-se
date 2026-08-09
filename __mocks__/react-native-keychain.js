const credentials = new Map();

module.exports = {
  ACCESSIBLE: {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
  },
  SECURITY_LEVEL: {
    SECURE_SOFTWARE: 1,
  },
  STORAGE_TYPE: {
    AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth',
  },
  getGenericPassword: jest.fn(async ({ service }) => credentials.get(service) || false),
  resetGenericPassword: jest.fn(async ({ service }) => credentials.delete(service)),
  setGenericPassword: jest.fn(async (username, password, { service }) => {
    credentials.set(service, { username, password, service, storage: 'mock' });
    return { service, storage: 'mock' };
  }),
  __reset: () => credentials.clear(),
};
