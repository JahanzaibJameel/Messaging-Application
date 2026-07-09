/**
 * Mock for react-native-device-info
 * Provides mock implementations for device information
 */

export const mockDeviceInfo = {
  getVersion: jest.fn(() => "3.0.0"),
  getBuildNumber: jest.fn(() => "1"),
  getBundleId: jest.fn(() => "com.chatapp.app"),
  getSystemName: jest.fn(() => "iOS"),
  getModel: jest.fn(() => "iPhone"),
  getDeviceId: jest.fn(() => "test-device-id"),
  isEmulator: jest.fn(() => false),
  isTablet: jest.fn(() => false),
  hasNotch: jest.fn(() => true),
  getUniqueId: jest.fn(() => "unique-device-id"),
  getManufacturer: jest.fn(() => "Apple"),
  getSystemVersion: jest.fn(() => "16.0"),
  getBrand: jest.fn(() => "Apple"),
  getDeviceType: jest.fn(() => "iPhone"),
  isLandscape: jest.fn(() => false),
  getConstants: jest.fn(() => ({
    FontScale: 2,
    Dimensions: { width: 375, height: 812 },
    StatusBarHeight: 44,
  })),
};

export default mockDeviceInfo;
