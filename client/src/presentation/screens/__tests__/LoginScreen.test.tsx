/**
 * LoginScreen Component Tests
 * Tests the real LoginScreen with mocked dependencies.
 */

import "../../../test-utils/i18nMock";

import React from "react";
import { View } from "react-native";
import { render, fireEvent, screen, waitFor } from "@testing-library/react-native";

import LoginScreen from "../LoginScreen";

const mockPressable = ({ children, onPress, disabled, style }: any) => (
  <View onPress={onPress} disabled={disabled} testID="button-continue">
    {children}
  </View>
);

const mockLogin = jest.fn();

const mockAuthStoreState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  pendingPhone: undefined,
  login: mockLogin,
  verifyOtp: jest.fn(),
  logout: jest.fn(),
  setUser: jest.fn(),
  setAuthenticated: jest.fn(),
  clearError: jest.fn(),
};

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

jest.mock("@/presentation/stores", () => ({
  useAuthStore: () => mockAuthStoreState,
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
    },
  }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../../components/ThemedText", () => ({
  ThemedText: ({ children, style }: any) => {
    const RN = require("react-native");
    return <RN.Text>{children}</RN.Text>;
  },
}));

jest.mock("@/components/Button", () => {
  const RN = require("react-native");
  return {
    Button: ({ children, onPress, disabled, style }: any) => (
      <RN.View onPress={onPress} disabled={disabled} testID="button-continue">
        {children}
      </RN.View>
    ),
  };
});

jest.mock("../../../components/KeyboardAwareScrollViewCompat", () => ({
  KeyboardAwareScrollViewCompat: ({ children }: any) => <>{children}</>,
}));

jest.mock("react-native-reanimated", () => {
  const RN = require("react-native");

  const createChainable = () => {
    const chain = {
      delay: () => chain,
      duration: () => chain,
    };
    return chain;
  };

  return {
    __esModule: true,
    default: {
      useAnimatedStyle: () => ({}),
      useSharedValue: (v: any) => ({ value: v }),
      withSpring: (v: any) => v,
      withSequence: (...args: any[]) => args,
      FadeIn: createChainable(),
      View: RN.View,
    },
    useAnimatedStyle: () => ({}),
    useSharedValue: (v: any) => ({ value: v }),
    withSpring: (v: any) => v,
    withSequence: (...args: any[]) => args,
    FadeIn: createChainable(),
    View: RN.View,
  };
});

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("../../../assets/images/empty-chats.png", () => "empty-chats.png");

describe("LoginScreen", () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockClear();
    mockNavigation.navigate.mockClear();
  });

  describe("Initial Render", () => {
    it("renders phone number input", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      expect(screen.getByTestId("input-phone")).toBeTruthy();
    });

    it("renders title text", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      expect(screen.getByText("Enter your phone number")).toBeTruthy();
    });

    it("renders description text", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      expect(
        screen.getByText("We'll send you a verification code to confirm your number")
      ).toBeTruthy();
    });

    it("renders Continue button", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      expect(screen.getByTestId("button-continue")).toBeTruthy();
    });

    it("renders terms text", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      expect(screen.getByText(/By continuing/)).toBeTruthy();
    });

    it("renders with default country code +1", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      expect(screen.getByText("+1")).toBeTruthy();
    });
  });

  describe("Phone Number Input", () => {
    it("allows typing phone number", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      const input = screen.getByTestId("input-phone");
      fireEvent.changeText(input, "1234567890");

      expect(input.props.value).toBe("1234567890");
    });

    it("limits input to 15 characters", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      const input = screen.getByTestId("input-phone");
      expect(input.props.maxLength).toBe(15);
    });

    it("uses phone-pad keyboard type", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      const input = screen.getByTestId("input-phone");
      expect(input.props.keyboardType).toBe("phone-pad");
    });
  });

  describe("Continue Button", () => {
    it("disables button when phone number is too short (< 10 chars)", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      fireEvent.changeText(screen.getByTestId("input-phone"), "123");
      const button = screen.getByTestId("button-continue");
      expect(button.props.disabled).toBe(true);
    });

    it("enables button when phone number is 10+ chars", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      fireEvent.changeText(screen.getByTestId("input-phone"), "1234567890");
      const button = screen.getByTestId("button-continue");
      expect(button.props.disabled).toBe(false);
    });

    it("calls login with full phone number on Continue press", async () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      fireEvent.changeText(screen.getByTestId("input-phone"), "1234567890");
      fireEvent.press(screen.getByTestId("button-continue"));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("+1 1234567890");
      });
    });

    it("does not call login when phone number is too short", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      fireEvent.changeText(screen.getByTestId("input-phone"), "123");
      fireEvent.press(screen.getByTestId("button-continue"));

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("navigates to OTP screen after successful login", async () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      fireEvent.changeText(screen.getByTestId("input-phone"), "1234567890");
      fireEvent.press(screen.getByTestId("button-continue"));

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith("OTP", { phone: "+1 1234567890" });
      });
    });
  });

  describe("Accessibility", () => {
    it("has testID on phone input", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      expect(screen.getByTestId("input-phone")).toBeTruthy();
    });

    it("has testID on Continue button", () => {
      render(<LoginScreen navigation={mockNavigation as any} />);

      expect(screen.getByTestId("button-continue")).toBeTruthy();
    });
  });
});
