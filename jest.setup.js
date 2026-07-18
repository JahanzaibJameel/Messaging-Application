/**
 * Jest setup file for React Native testing
 */

import "react-native-gesture-handler/jestSetup";

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock NetInfo
jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, type: "wifi" })),
  addEventListener: jest.fn(),
}));

// Mock react-native-keychain
jest.mock("react-native-keychain", () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: "test", password: "test" })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-ssl-pinning
jest.mock("react-native-ssl-pinning", () => ({
  fetch: jest.fn(() => Promise.resolve({ status: 200, data: {} })),
}));

// Mock react-native-gesture-handler (single mock: RootView + handler stubs)
jest.mock("react-native-gesture-handler", () => {
  const View = require("react-native/Libraries/Components/View/View");
  return {
    GestureHandlerRootView: ({ children }) => children,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    Toolbar: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// Mock react-native-keyboard-controller
jest.mock("react-native-keyboard-controller", () => ({
  KeyboardProvider: ({ children }) => children,
  KeyboardController: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock expo-status-bar
jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }) => children,
}));

// Mock NavigationContainer
jest.mock("@react-navigation/native", () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock MMKV
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    contains: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Use real immer for Zustand immer middleware (mock breaks store updates)

// Mock Sentry
jest.mock("@sentry/react-native", () => {
  const mockScope = {
    setTag: jest.fn(),
    setUser: jest.fn(),
    setContext: jest.fn(),
    setLevel: jest.fn(),
  };
  return {
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setUser: jest.fn(),
    clearUser: jest.fn(),
    addBreadcrumb: jest.fn(),
    withScope: jest.fn((callback) => callback(mockScope)),
    configureScope: jest.fn((callback) => callback(mockScope)),
    startTransaction: jest.fn(() => ({
      finish: jest.fn(),
      setTag: jest.fn(),
    })),
    reactNavigationIntegration: jest.fn(() => ({})),
    ErrorBoundary: ({ children }) => children,
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

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
