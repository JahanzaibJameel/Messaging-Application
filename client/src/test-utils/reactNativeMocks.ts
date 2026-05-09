/**
 * React Native Mocks
 * Mocks for React Native components and modules for testing
 */

import { Text } from 'react-native';

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      emit: jest.fn(),
    })),
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
      Version: '14.0',
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812, scale: 2, fontScale: 1 })),
    },
    PixelRatio: {
      roundToNearestPixel: jest.fn((val) => val),
      getFontScale: jest.fn(() => 1),
    },
  };
});

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn().mockResolvedValue('test-device-id'),
  getVersion: jest.fn().mockResolvedValue('1.0.0'),
  getBuildNumber: jest.fn().mockResolvedValue('1'),
  getSystemName: jest.fn().mockResolvedValue('iOS'),
  getSystemVersion: jest.fn().mockResolvedValue('14.0'),
  getModel: jest.fn().mockResolvedValue('iPhone'),
  getBrand: jest.fn().mockResolvedValue('Apple'),
  getDeviceId: jest.fn().mockResolvedValue('iPhone123'),
  isEmulator: jest.fn().mockResolvedValue(false),
  isJailBroken: jest.fn().mockResolvedValue(false),
  isRooted: jest.fn().mockResolvedValue(false),
}));

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
    getAllKeys: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  getSupportedBiometryType: jest.fn(),
  ACCESS_CONTROL: {},
  AUTHENTICATION_TYPE: {},
  BIOMETRY_TYPE: {},
}));

// Mock react-native-ssl-pinning
jest.mock('react-native-ssl-pinning', () => ({
  fetch: jest.fn(),
  getCookies: jest.fn(),
  clearCookies: jest.fn(),
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(() => jest.fn()),
  })),
  useRoute: jest.fn(() => ({
    params: {},
    key: 'test-route',
    name: 'TestRoute',
  })),
  useFocusEffect: jest.fn(),
  useIsFocused: jest.fn(() => true),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Mock crypto-js
jest.mock('crypto-js', () => ({
  lib: {
    WordArray: {
      random: jest.fn(() => ({ toString: () => 'mock-encryption-key' })),
    },
  },
  AES: {
    encrypt: jest.fn(() => ({ toString: () => 'encrypted-data' })),
    decrypt: jest.fn(() => ({ toString: (format: any) => format === 'Utf8' ? 'decrypted-data' : '' })),
  },
  enc: {
    Utf8: 'utf8',
  },
}));

// Mock @sentry/react-native
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addUserActionBreadcrumb: jest.fn(),
  addBreadcrumb: jest.fn(),
  configureScope: jest.fn(),
  withScope: jest.fn(),
  init: jest.fn(),
  setTag: jest.fn(),
  setUser: jest.fn(),
  clearUser: jest.fn(),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => key),
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  })),
}));

// Mock @shopify/flash-list
jest.mock('@shopify/flash-list', () => ({
  FlashList: 'FlashList',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  })),
  SafeAreaView: 'SafeAreaView',
}));

export default {};
