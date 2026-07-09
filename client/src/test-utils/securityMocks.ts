/**
 * Security Module Mocks
 * Provides mock implementations for security modules in test environment
 */

// Keychain mocks
export const mockKeychain = {
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  getSupportedBiometryType: jest.fn(),
  ACCESS_CONTROL: {},
  AUTHENTICATION_TYPE: {},
  BIOMETRY_TYPE: {},
};

// Keychain function mocks
export const mockGetToken = jest.fn();
export const mockSetToken = jest.fn();
export const mockResetToken = jest.fn();
export const mockSetUserCredentials = jest.fn();
export const mockGetUserCredentials = jest.fn();
export const mockResetUserCredentials = jest.fn();
export const mockHasAuthenticationData = jest.fn();
export const mockClearAllAuthenticationData = jest.fn();

// SSL Pinning mocks
export const mockSslPinning = {
  fetch: jest.fn(),
  getCookies: jest.fn(),
  clearCookies: jest.fn(),
};

// Secure transport mocks
export const mockSecureFetch = jest.fn();
export const mockCreateSecureWebSocket = jest.fn();
export const mockValidateCertificate = jest.fn();
export const mockGetSecureUrl = jest.fn();
export const mockIsSecureUrl = jest.fn();
export const mockEnforceSecureUrl = jest.fn();

// SSL Pinning config mocks
export const mockGetSSLPinningConfig = jest.fn();
export const mockValidateSSLPinningConfig = jest.fn();
export const mockGetCertificateHashForDomain = jest.fn();
export const mockShouldUseSSLPinning = jest.fn();

// Secure storage mocks
export const mockInitializeSecureStorage = jest.fn();
export const mockSecureSet = jest.fn();
export const mockSecureGet = jest.fn();
export const mockSecureDelete = jest.fn();
export const mockSecureSetJSON = jest.fn();
export const mockSecureGetJSON = jest.fn();
export const mockSecureContains = jest.fn();
export const mockSecureGetAllKeys = jest.fn();
export const mockSecureClearAll = jest.fn();

// Device security mocks
export const mockDeviceInfo = {
  isEmulator: jest.fn(),
  isJailBroken: jest.fn(),
  isRooted: jest.fn(),
  getBuildNumber: jest.fn(),
  getVersion: jest.fn(),
  getBundleId: jest.fn(),
  getSystemName: jest.fn(),
  getSystemVersion: jest.fn(),
  getModel: jest.fn(),
  getBrand: jest.fn(),
  getDeviceId: jest.fn(),
};

export const mockCheckDeviceSecurity = jest.fn();
export const mockGetSecurityStatus = jest.fn();
export const mockIsDeviceSecure = jest.fn();
export const mockUpdateSecurityConfig = jest.fn();
export const mockRefreshSecurityStatus = jest.fn();

// Logger mocks
export const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  breadcrumb: jest.fn(),
  time: jest.fn(),
  timeEnd: jest.fn(),
  networkRequest: jest.fn(),
  userInteraction: jest.fn(),
  security: jest.fn(),
  setLogLevel: jest.fn(),
  getRecentLogs: jest.fn(),
  getLogsByLevel: jest.fn(),
  getLogsByCategory: jest.fn(),
  clearLogs: jest.fn(),
  exportLogs: jest.fn(),
};

// Mock implementations for default values
const createDefaultTokenStorage = () => ({
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
});

const createDefaultUserCredentials = () => ({
  userId: "mock-user-id",
  email: "mock@example.com",
  username: "mockuser",
});

const createDefaultSecurityStatus = () => ({
  isJailbroken: false,
  isEmulator: false,
  isRooted: false,
  isSecure: true,
  threats: [],
});

const createDefaultSSLPinningConfig = () => ({
  domain: "api.chatapp.com",
  wsDomain: "ws.chatapp.com",
  enabled: true,
  certificateHashes: ["mock-cert-hash"],
  allowInsecureConnections: false,
  timeout: 15000,
});

// Setup all security mocks with default implementations
export const setupSecurityMocks = () => {
  // Keychain mocks
  mockKeychain.getGenericPassword.mockResolvedValue({
    username: "access_token",
    password: "mock-access-token",
  });
  mockKeychain.setGenericPassword.mockResolvedValue(true);
  mockKeychain.resetGenericPassword.mockResolvedValue(true);

  mockGetToken.mockResolvedValue(createDefaultTokenStorage());
  mockSetToken.mockResolvedValue(true);
  mockResetToken.mockResolvedValue(true);
  mockSetUserCredentials.mockResolvedValue(true);
  mockGetUserCredentials.mockResolvedValue(createDefaultUserCredentials());
  mockResetUserCredentials.mockResolvedValue(true);
  mockHasAuthenticationData.mockResolvedValue(true);
  mockClearAllAuthenticationData.mockResolvedValue(true);

  // SSL Pinning mocks
  mockSslPinning.fetch.mockResolvedValue({
    status: 200,
    statusText: "OK",
    headers: {},
    data: "mock-response-data",
  });

  mockSecureFetch.mockResolvedValue({
    status: 200,
    statusText: "OK",
    headers: {},
    data: "mock-response-data",
  });

  mockCreateSecureWebSocket.mockResolvedValue(new WebSocket("ws://localhost:8080"));
  mockValidateCertificate.mockResolvedValue(true);
  mockGetSecureUrl.mockReturnValue("https://api.chatapp.com/test");
  mockIsSecureUrl.mockReturnValue(true);
  mockEnforceSecureUrl.mockReturnValue("https://api.chatapp.com/test");

  mockGetSSLPinningConfig.mockReturnValue(createDefaultSSLPinningConfig());
  mockValidateSSLPinningConfig.mockReturnValue(true);
  mockGetCertificateHashForDomain.mockReturnValue(["mock-cert-hash"]);
  mockShouldUseSSLPinning.mockReturnValue(true);

  // Secure storage mocks
  mockInitializeSecureStorage.mockResolvedValue(true);
  mockSecureSet.mockResolvedValue(true);
  mockSecureGet.mockResolvedValue("mock-secure-value");
  mockSecureDelete.mockResolvedValue(true);
  mockSecureSetJSON.mockResolvedValue(true);
  mockSecureGetJSON.mockResolvedValue({ mockData: "value" });
  mockSecureContains.mockResolvedValue(true);
  mockSecureGetAllKeys.mockResolvedValue(["key1", "key2"]);
  mockSecureClearAll.mockResolvedValue(true);

  // Device security mocks
  mockDeviceInfo.isEmulator.mockResolvedValue(false);
  mockDeviceInfo.isJailBroken.mockResolvedValue(false);
  mockDeviceInfo.isRooted.mockResolvedValue(false);

  mockCheckDeviceSecurity.mockResolvedValue(createDefaultSecurityStatus());
  mockGetSecurityStatus.mockReturnValue(createDefaultSecurityStatus());
  mockIsDeviceSecure.mockReturnValue(true);
  mockUpdateSecurityConfig.mockReturnValue(undefined);
  mockRefreshSecurityStatus.mockResolvedValue(createDefaultSecurityStatus());

  // Logger mocks - no return values for most methods
  mockLogger.debug.mockReturnValue(undefined);
  mockLogger.info.mockReturnValue(undefined);
  mockLogger.warn.mockReturnValue(undefined);
  mockLogger.error.mockReturnValue(undefined);
  mockLogger.fatal.mockReturnValue(undefined);
  mockLogger.breadcrumb.mockReturnValue(undefined);
  mockLogger.time.mockReturnValue(undefined);
  mockLogger.timeEnd.mockReturnValue(undefined);
  mockLogger.networkRequest.mockReturnValue(undefined);
  mockLogger.userInteraction.mockReturnValue(undefined);
  mockLogger.security.mockReturnValue(undefined);
  mockLogger.setLogLevel.mockReturnValue(undefined);
  mockLogger.getRecentLogs.mockReturnValue([]);
  mockLogger.getLogsByLevel.mockReturnValue([]);
  mockLogger.getLogsByCategory.mockReturnValue([]);
  mockLogger.clearLogs.mockReturnValue(undefined);
  mockLogger.exportLogs.mockReturnValue("[]");
};

// Reset all security mocks
export const resetSecurityMocks = () => {
  // Keychain mocks
  mockKeychain.getGenericPassword.mockReset();
  mockKeychain.setGenericPassword.mockReset();
  mockKeychain.resetGenericPassword.mockReset();

  mockGetToken.mockReset();
  mockSetToken.mockReset();
  mockResetToken.mockReset();
  mockSetUserCredentials.mockReset();
  mockGetUserCredentials.mockReset();
  mockResetUserCredentials.mockReset();
  mockHasAuthenticationData.mockReset();
  mockClearAllAuthenticationData.mockReset();

  // SSL Pinning mocks
  mockSslPinning.fetch.mockReset();

  mockSecureFetch.mockReset();
  mockCreateSecureWebSocket.mockReset();
  mockValidateCertificate.mockReset();
  mockGetSecureUrl.mockReset();
  mockIsSecureUrl.mockReset();
  mockEnforceSecureUrl.mockReset();

  mockGetSSLPinningConfig.mockReset();
  mockValidateSSLPinningConfig.mockReset();
  mockGetCertificateHashForDomain.mockReset();
  mockShouldUseSSLPinning.mockReset();

  // Secure storage mocks
  mockInitializeSecureStorage.mockReset();
  mockSecureSet.mockReset();
  mockSecureGet.mockReset();
  mockSecureDelete.mockReset();
  mockSecureSetJSON.mockReset();
  mockSecureGetJSON.mockReset();
  mockSecureContains.mockReset();
  mockSecureGetAllKeys.mockReset();
  mockSecureClearAll.mockReset();

  // Device security mocks
  mockDeviceInfo.isEmulator.mockReset();
  mockDeviceInfo.isJailBroken.mockReset();
  mockDeviceInfo.isRooted.mockReset();

  mockCheckDeviceSecurity.mockReset();
  mockGetSecurityStatus.mockReset();
  mockIsDeviceSecure.mockReset();
  mockUpdateSecurityConfig.mockReset();
  mockRefreshSecurityStatus.mockReset();

  // Logger mocks
  mockLogger.debug.mockReset();
  mockLogger.info.mockReset();
  mockLogger.warn.mockReset();
  mockLogger.error.mockReset();
  mockLogger.fatal.mockReset();
  mockLogger.breadcrumb.mockReset();
  mockLogger.time.mockReset();
  mockLogger.timeEnd.mockReset();
  mockLogger.networkRequest.mockReset();
  mockLogger.userInteraction.mockReset();
  mockLogger.security.mockReset();
  mockLogger.setLogLevel.mockReset();
  mockLogger.getRecentLogs.mockReset();
  mockLogger.getLogsByLevel.mockReset();
  mockLogger.getLogsByCategory.mockReset();
  mockLogger.clearLogs.mockReset();
  mockLogger.exportLogs.mockReset();
};

// Helper functions for test assertions
export const expectKeychainCall = (functionName: string, ...args: any[]) => {
  const mockFunction = {
    getToken: mockGetToken,
    setToken: mockSetToken,
    resetToken: mockResetToken,
    setUserCredentials: mockSetUserCredentials,
    getUserCredentials: mockGetUserCredentials,
    resetUserCredentials: mockResetUserCredentials,
  }[functionName];

  if (mockFunction) {
    expect(mockFunction).toHaveBeenCalledWith(...args);
  }
};

export const expectSecureStorageCall = (functionName: string, ...args: any[]) => {
  const mockFunction = {
    secureSet: mockSecureSet,
    secureGet: mockSecureGet,
    secureDelete: mockSecureDelete,
    secureSetJSON: mockSecureSetJSON,
    secureGetJSON: mockSecureGetJSON,
  }[functionName];

  if (mockFunction) {
    expect(mockFunction).toHaveBeenCalledWith(...args);
  }
};

export const expectLoggerCall = (level: string, message: string, data?: any) => {
  expect(mockLogger[level]).toHaveBeenCalledWith(message, data, expect.any(String));
};

export const expectSecurityCheck = () => {
  expect(mockCheckDeviceSecurity).toHaveBeenCalled();
};

export default {
  setupSecurityMocks,
  resetSecurityMocks,
  expectKeychainCall,
  expectSecureStorageCall,
  expectLoggerCall,
  expectSecurityCheck,
};
