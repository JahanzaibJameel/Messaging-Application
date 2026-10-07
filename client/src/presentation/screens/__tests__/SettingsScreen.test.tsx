import "../../../test-utils/i18nMock";

import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import SettingsScreen from "../SettingsScreen";

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 56,
}));

jest.mock("@react-navigation/bottom-tabs", () => ({
  useBottomTabBarHeight: () => 49,
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

const mockExpoConfig: { version?: string } = { version: "2.3.4" };
jest.mock("expo-constants", () => ({
  get expoConfig() {
    return mockExpoConfig;
  },
}));

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      backgroundRoot: "#fff",
      text: "#000",
      textSecondary: "#666",
      primary: "#007AFF",
      surface: "#f5f5f5",
      divider: "#ddd",
      error: "#E53935",
    },
  }),
}));

let mockSetEnabled = jest.fn();
const mockLogout = jest.fn();
let mockAppLock: Record<string, unknown>;

jest.mock("@/hooks/useAppLock", () => ({
  useAppLock: () => mockAppLock,
}));

let mockAuthState: {
  currentUser: {
    id: string;
    name: string;
    phone: string;
    avatar: string;
    isOnline: boolean;
    status: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: unknown;
  pendingPhone: string | undefined;
  login: jest.Mock;
  verifyOtp: jest.Mock;
  logout: jest.Mock;
  setUser: jest.Mock;
  setAuthenticated: jest.Mock;
  clearError: jest.Mock;
};

jest.mock("@/presentation/stores", () => ({
  useAuthStore: Object.assign(() => mockAuthState, {
    getState: () => mockAuthState,
    setState: (partial: unknown) => {
      Object.assign(mockAuthState, partial);
    },
  }),
}));

jest.mock("@/components/Avatar", () => {
  const { View } = require("react-native");
  return { Avatar: ({ size }: { size: string }) => <View testID={`avatar-${size}`} /> };
});

jest.mock("@/components/SettingsItem", () => {
  const { Pressable, Text, View, Switch } = require("react-native");
  return {
    SettingsItem: (props: {
      icon: string;
      title: string;
      subtitle?: string;
      onPress?: () => void;
      showArrow?: boolean;
      toggle?: { value: boolean; onValueChange: (v: boolean) => void };
      destructive?: boolean;
      disabled?: boolean;
    }) => (
      <View testID={`settings-item-${props.title}`} disabled={props.disabled}>
        <Text>{props.title}</Text>
        {props.subtitle ? <Text>{props.subtitle}</Text> : null}
        {props.toggle ? (
          <Switch
            testID={`switch-${props.title}`}
            value={props.toggle.value}
            onValueChange={props.toggle.onValueChange}
            disabled={props.disabled}
          />
        ) : null}
        {props.onPress ? (
          <Pressable testID={`press-${props.title}`} onPress={props.onPress} />
        ) : null}
      </View>
    ),
  };
});

const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  reset: mockReset,
  dispatch: jest.fn(),
  setParams: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  setOptions: jest.fn(),
};

const mockUser = {
  id: "user-1",
  name: "Alice",
  phone: "+1234567890",
  avatar: "https://example.com/avatar.png",
  isOnline: true,
  status: "online",
};

function renderScreen() {
  return render(<SettingsScreen navigation={mockNavigation as never} />);
}

describe("SettingsScreen", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExpoConfig.version = "2.3.4";
    mockAuthState = {
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      pendingPhone: undefined,
      login: jest.fn(),
      verifyOtp: jest.fn(),
      logout: mockLogout,
      setUser: jest.fn(),
      setAuthenticated: jest.fn(),
      clearError: jest.fn(),
    };
    mockAppLock = {
      enabled: false,
      available: true,
      checking: false,
      setEnabled: (mockSetEnabled = jest.fn().mockResolvedValue(true)),
    };
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation((...args: unknown[]) => {
      const buttons = args[2] as { onPress?: () => void; style?: string }[];
      const confirmBtn = buttons?.find((b) => b.style === "destructive");
      confirmBtn?.onPress?.();
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
    mockExpoConfig.version = "2.3.4";
  });

  describe("rendering", () => {
    it("renders the profile section with user name, phone and avatar", () => {
      renderScreen();
      expect(screen.getByText("Alice")).toBeTruthy();
      expect(screen.getByText("+1234567890")).toBeTruthy();
      expect(screen.getByTestId("avatar-large")).toBeTruthy();
    });

    it("renders 'User' fallback name and empty phone when currentUser is null", () => {
      mockAuthState.currentUser = null;
      renderScreen();
      expect(screen.getByText("User")).toBeTruthy();
      expect(screen.queryByText("+1234567890")).toBeNull();
    });

    it("renders App Lock with Available/Enabled/Unavailable subtitles", () => {
      renderScreen();
      expect(screen.getByText("Available")).toBeTruthy();

      mockAppLock = { ...mockAppLock, enabled: true };
      renderScreen();
      expect(screen.getByText("Enabled")).toBeTruthy();

      mockAppLock = { ...mockAppLock, enabled: false, available: false };
      renderScreen();
      expect(screen.getByText("Unavailable")).toBeTruthy();
    });

    it("renders App Lock/Version/Log Out items and section titles", () => {
      renderScreen();
      expect(screen.getByTestId("settings-item-App Lock")).toBeTruthy();
      expect(screen.getByTestId("settings-item-App Version")).toBeTruthy();
      expect(screen.getByTestId("settings-item-Log Out")).toBeTruthy();
      expect(screen.getByText("Security")).toBeTruthy();
      expect(screen.getByText("About")).toBeTruthy();
    });

    it("renders the app version, fallback and pre-release variants", () => {
      renderScreen();
      expect(screen.getByText("2.3.4")).toBeTruthy();

      mockExpoConfig.version = undefined;
      renderScreen();
      expect(screen.getByText("1.0.0")).toBeTruthy();

      mockExpoConfig.version = "2.3.4-alpha.1";
      renderScreen();
      expect(screen.getByText("2.3.4-alpha.1")).toBeTruthy();

      mockExpoConfig.version = "1.0.0+build.123";
      renderScreen();
      expect(screen.getByText("1.0.0+build.123")).toBeTruthy();
    });

    it("renders profile with different and unicode user data", () => {
      mockAuthState.currentUser = { ...mockUser, name: "Bob", phone: "+9876543210" };
      renderScreen();
      expect(screen.getByText("Bob")).toBeTruthy();
      expect(screen.getByText("+9876543210")).toBeTruthy();

      mockAuthState.currentUser = {
        ...mockUser,
        name: "日本語",
        avatar: "https://example.com/u.jpg",
      };
      renderScreen();
      expect(screen.getByText("日本語")).toBeTruthy();
      expect(screen.getByTestId("avatar-large")).toBeTruthy();
    });
  });

  describe("app lock toggle", () => {
    it("disables the toggle when unavailable or checking", () => {
      mockAppLock = { ...mockAppLock, available: false };
      renderScreen();
      expect(screen.getByTestId("switch-App Lock")).toHaveProp("disabled", true);

      mockAppLock = { ...mockAppLock, available: true, checking: true };
      renderScreen();
      expect(screen.getByTestId("switch-App Lock")).toHaveProp("disabled", true);
    });

    it("alerts when enabling app lock but biometrics are not available", async () => {
      mockAppLock = { ...mockAppLock, available: false, enabled: false };
      renderScreen();
      await act(async () => {
        fireEvent(screen.getByTestId("switch-App Lock"), "valueChange", true);
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        "App Lock",
        "Biometric authentication is not available on this device."
      );
    });

    it("alerts with the failure message when enabling app lock returns false", async () => {
      mockSetEnabled.mockResolvedValueOnce(false);
      renderScreen();
      await act(async () => {
        fireEvent(screen.getByTestId("switch-App Lock"), "valueChange", true);
      });
      expect(Alert.alert).toHaveBeenCalledWith("App Lock", "Unable to enable App Lock. Try again.");
    });

    it("alerts with the failure message when disabling app lock returns false", async () => {
      mockSetEnabled.mockResolvedValueOnce(false);
      mockAppLock = { ...mockAppLock, enabled: true };
      renderScreen();
      await act(async () => {
        fireEvent(screen.getByTestId("switch-App Lock"), "valueChange", false);
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        "App Lock",
        "Unable to disable App Lock. Authenticate and try again."
      );
    });

    it("calls setEnabled with the toggled value", async () => {
      renderScreen();
      await act(async () => {
        fireEvent(screen.getByTestId("switch-App Lock"), "valueChange", true);
      });
      expect(mockSetEnabled).toHaveBeenCalledWith(true);

      mockAppLock = { ...mockAppLock, enabled: true };
      renderScreen();
      await act(async () => {
        fireEvent(screen.getByTestId("switch-App Lock"), "valueChange", false);
      });
      expect(mockSetEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe("haptics", () => {
    it("calls notificationAsync on successful enable and disable", async () => {
      const { notificationAsync } = require("expo-haptics");
      renderScreen();
      await act(async () => {
        fireEvent(screen.getByTestId("switch-App Lock"), "valueChange", true);
      });
      expect(notificationAsync).toHaveBeenCalledWith(expect.anything());

      mockAppLock = { ...mockAppLock, enabled: true };
      renderScreen();
      await act(async () => {
        fireEvent(screen.getByTestId("switch-App Lock"), "valueChange", false);
      });
      expect(notificationAsync).toHaveBeenCalledWith(expect.anything());
    });

    it("does not call haptics on failed enable", async () => {
      mockSetEnabled.mockResolvedValueOnce(false);
      renderScreen();
      await act(async () => {
        fireEvent(screen.getByTestId("switch-App Lock"), "valueChange", true);
      });
      expect(require("expo-haptics").notificationAsync).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("shows the logout confirmation alert", () => {
      renderScreen();
      fireEvent.press(screen.getByTestId("press-Log Out"));
      expect(alertSpy).toHaveBeenCalledWith(
        "Log Out",
        "Are you sure you want to log out?",
        expect.any(Array)
      );
    });

    it("calls logout and navigates to Splash on confirm", async () => {
      renderScreen();
      await act(async () => {
        fireEvent.press(screen.getByTestId("press-Log Out"));
      });
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "Splash" }],
      });
    });

    it("does not call logout on cancel", async () => {
      alertSpy.mockImplementation((title, message, buttons) => {
        const cancelBtn = (buttons as { onPress?: () => void; style?: string }[]).find(
          (b) => b.style === "cancel"
        );
        cancelBtn?.onPress?.();
      });
      renderScreen();
      await act(async () => {
        fireEvent.press(screen.getByTestId("press-Log Out"));
      });
      expect(mockLogout).not.toHaveBeenCalled();
    });
  });
});
