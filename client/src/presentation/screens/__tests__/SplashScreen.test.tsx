import "../../../test-utils/i18nMock";

import React from "react";
import { render, screen } from "@testing-library/react-native";
import { useAuthStore } from "../../stores/authStore";
import SplashScreen from "../SplashScreen";

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

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("@/components/Avatar", () => {
  const { View } = require("react-native");
  return { Avatar: () => <View testID="avatar" /> };
});

jest.mock("@/components/SettingsItem", () => {
  const { Pressable, Text, View } = require("react-native");
  return {
    SettingsItem: (props: {
      icon: string;
      title: string;
      onPress?: () => void;
      destructive?: boolean;
      showArrow?: boolean;
    }) => (
      <Pressable testID={`settings-${props.title}`} onPress={props.onPress}>
        <Text>{props.title}</Text>
      </Pressable>
    ),
  };
});

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

jest.mock("../../../../assets/images/icon.png", () => "icon.png");

const mockReplace = jest.fn();
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  replace: mockReplace,
  dispatch: jest.fn(),
  setParams: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  reset: jest.fn(),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  setOptions: jest.fn(),
};

function renderScreen() {
  return render(<SplashScreen navigation={mockNavigation as never} />);
}

describe("SplashScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      pendingPhone: undefined,
    });
  });

  describe("rendering", () => {
    it("renders the app name", () => {
      renderScreen();
      expect(screen.getByText("ChatApp")).toBeTruthy();
    });

    it("renders the logo image", () => {
      renderScreen();
      expect(screen.getByTestId("logo")).toBeTruthy();
    });

    it("renders animated text view", () => {
      renderScreen();
      const appName = screen.getByTestId("app-name");
      expect(appName).toBeTruthy();
    });
  });

  describe("navigation", () => {
    it("navigates to Login when not authenticated after 1.5s", async () => {
      renderScreen();

      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          resolve();
        }, 1600);
      });

      expect(mockReplace).toHaveBeenCalledWith("Login");
    });

    it("navigates to Main when authenticated after 1.5s", async () => {
      useAuthStore.setState({ isAuthenticated: true });
      renderScreen();

      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          resolve();
        }, 1600);
      });

      expect(mockReplace).toHaveBeenCalledWith("Main");
    });

    it("does not navigate before 1.5s", async () => {
      renderScreen();
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          resolve();
        }, 1000);
      });
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("clears timer on unmount before it fires", async () => {
      const { unmount } = renderScreen();
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          resolve();
        }, 100);
      });
      unmount();
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          resolve();
        }, 100);
      });
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
