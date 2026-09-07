/**
 * OTPScreen Component Tests
 * Tests the real OTPScreen with mocked dependencies.
 */

import "../../../test-utils/i18nMock";

import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Pressable, TextInput } from "react-native";

import OTPScreen from "../OTPScreen";

const mockVerifyOtp = jest.fn();
const mockNavigationReplace = jest.fn();

const mockAuthStoreState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  pendingPhone: "+1 1234567890",
  login: jest.fn(),
  verifyOtp: mockVerifyOtp,
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

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 44,
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

jest.mock("@/components/ThemedText", () => ({
  ThemedText: ({ children, style }: any) => <>{children}</>,
}));

jest.mock("@/components/KeyboardAwareScrollViewCompat", () => ({
  KeyboardAwareScrollViewCompat: ({ children }: any) => <>{children}</>,
}));

jest.mock("react-native-reanimated", () => {
  const View = require("react-native/Libraries/Components/View/View");

  // Create a chainable animation mock that handles any order of .delay() and .duration()
  const createChainable = () => {
    const chain = {
      delay: () => chain,
      duration: () => chain,
    };
    return chain;
  };

  return {
    useAnimatedStyle: () => ({}),
    useSharedValue: (v: any) => ({ value: v }),
    withSpring: (v: any) => v,
    withSequence: (...args: any[]) => args,
    FadeIn: createChainable(),
    default: View,
  };
});

jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAvoidingView: ({ children }: any) => <>{children}</>,
  KeyboardProvider: ({ children }: any) => <>{children}</>,
}));

describe("OTPScreen", () => {
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
    replace: mockNavigationReplace,
  };

  const mockRoute = {
    params: { phone: "+1 1234567890" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyOtp.mockClear();
    mockNavigationReplace.mockClear();
  });

  describe("Initial Render", () => {
    it("renders OTP title", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      expect(screen.getByText("Verify your number")).toBeTruthy();
    });

    it("renders phone number in subtitle", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      expect(screen.getByText("Enter the 6-digit code sent to +1 1234567890")).toBeTruthy();
    });

    it("renders 6 OTP input fields", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      for (let i = 0; i < 6; i++) {
        expect(screen.getByTestId("input-otp-" + i)).toBeTruthy();
      }
    });

    it("renders Resend Code button", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      expect(screen.getByText("Resend Code")).toBeTruthy();
    });

    it("renders input fields with empty values", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      for (let i = 0; i < 6; i++) {
        const input = screen.getByTestId("input-otp-" + i);
        expect(input.props.value).toBe("");
      }
    });
  });

  describe("OTP Input", () => {
    it("accepts single digit input", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const input0 = screen.getByTestId("input-otp-0");
      fireEvent.changeText(input0, "1");

      expect(mockVerifyOtp).not.toHaveBeenCalled(); // Only one digit, not complete
    });

    it("handles paste of full 6-digit code", async () => {
      mockVerifyOtp.mockResolvedValue(true);

      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const input0 = screen.getByTestId("input-otp-0");
      fireEvent.changeText(input0, "123456");

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith("123456");
      });
    });

    it("trims pasted code to 6 digits", async () => {
      mockVerifyOtp.mockResolvedValue(true);

      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const input0 = screen.getByTestId("input-otp-0");
      fireEvent.changeText(input0, "123456789");

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith("123456");
      });
    });
  });

  describe("OTP Verification", () => {
    it("calls verifyOtp when 6 digits are entered", async () => {
      mockVerifyOtp.mockResolvedValue(true);

      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const inputs = Array.from({ length: 6 }, (_, i) => screen.getByTestId("input-otp-" + i));

      fireEvent.changeText(inputs[0], "1");
      fireEvent.changeText(inputs[1], "2");
      fireEvent.changeText(inputs[2], "3");
      fireEvent.changeText(inputs[3], "4");
      fireEvent.changeText(inputs[4], "5");
      fireEvent.changeText(inputs[5], "6");

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith("123456");
      });
    });

    it("navigates to Main screen on successful verification", async () => {
      mockVerifyOtp.mockResolvedValue(true);

      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const inputs = Array.from({ length: 6 }, (_, i) => screen.getByTestId("input-otp-" + i));

      fireEvent.changeText(inputs[0], "1");
      fireEvent.changeText(inputs[1], "2");
      fireEvent.changeText(inputs[2], "3");
      fireEvent.changeText(inputs[3], "4");
      fireEvent.changeText(inputs[4], "5");
      fireEvent.changeText(inputs[5], "6");

      await waitFor(() => {
        expect(mockNavigationReplace).toHaveBeenCalledWith("Main");
      });
    });

    it("shows error on failed verification and does not navigate", async () => {
      mockVerifyOtp.mockResolvedValue(false);

      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const inputs = Array.from({ length: 6 }, (_, i) => screen.getByTestId("input-otp-" + i));

      fireEvent.changeText(inputs[0], "1");
      fireEvent.changeText(inputs[1], "2");
      fireEvent.changeText(inputs[2], "3");
      fireEvent.changeText(inputs[3], "4");
      fireEvent.changeText(inputs[4], "5");
      fireEvent.changeText(inputs[5], "6");

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith("123456");
      });

      expect(mockNavigationReplace).not.toHaveBeenCalled();
    });

    it("clears inputs after failed verification", async () => {
      mockVerifyOtp.mockResolvedValue(false);

      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const inputs = Array.from({ length: 6 }, (_, i) => screen.getByTestId("input-otp-" + i));

      fireEvent.changeText(inputs[0], "1");
      fireEvent.changeText(inputs[1], "2");
      fireEvent.changeText(inputs[2], "3");
      fireEvent.changeText(inputs[3], "4");
      fireEvent.changeText(inputs[4], "5");
      fireEvent.changeText(inputs[5], "6");

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalled();
      });

      // After verification fails, OTP should be cleared
      for (let i = 0; i < 6; i++) {
        const input = screen.getByTestId("input-otp-" + i);
        expect(input.props.value).toBe("");
      }
    });

    it("disables inputs during verification", async () => {
      mockVerifyOtp.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const inputs = Array.from({ length: 6 }, (_, i) => screen.getByTestId("input-otp-" + i));

      fireEvent.changeText(inputs[0], "1");
      fireEvent.changeText(inputs[1], "2");
      fireEvent.changeText(inputs[2], "3");
      fireEvent.changeText(inputs[3], "4");
      fireEvent.changeText(inputs[4], "5");
      fireEvent.changeText(inputs[5], "6");

      await waitFor(() => {
        // Inputs should be disabled during verification
        inputs.forEach((input) => {
          expect(input.props.editable).toBe(false);
        });
      });
    });
  });

  describe("Resend Code", () => {
    it("shows Resend Code button", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      expect(screen.getByText("Resend Code")).toBeTruthy();
    });

    it("clears all inputs when Resend Code is pressed", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const inputs = Array.from({ length: 6 }, (_, i) => screen.getByTestId("input-otp-" + i));

      // Fill some inputs
      fireEvent.changeText(inputs[0], "1");
      fireEvent.changeText(inputs[1], "2");

      // Press Resend
      fireEvent.press(screen.getByText("Resend Code"));

      // All inputs should be cleared
      for (let i = 0; i < 6; i++) {
        const input = screen.getByTestId("input-otp-" + i);
        expect(input.props.value).toBe("");
      }
    });
  });

  describe("Backspace Handling", () => {
    it("handles backspace on input field", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const input1 = screen.getByTestId("input-otp-1");

      // Simulate backspace on second input (when it's empty)
      fireEvent.changeText(input1, "2");
      fireEvent(input1, "keyPress", { nativeEvent: { key: "Backspace" } });
    });
  });

  describe("Accessibility", () => {
    it("all OTP inputs have testIDs", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      for (let i = 0; i < 6; i++) {
        expect(screen.getByTestId("input-otp-" + i)).toBeTruthy();
      }
    });

    it("uses number-pad keyboard type", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const input = screen.getByTestId("input-otp-0");
      expect(input.props.keyboardType).toBe("number-pad");
    });

    it("uses maxLength of 6", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const input = screen.getByTestId("input-otp-0");
      expect(input.props.maxLength).toBe(6);
    });

    it("uses selectTextOnFocus", () => {
      render(<OTPScreen navigation={mockNavigation as any} route={mockRoute as any} />);

      const input = screen.getByTestId("input-otp-0");
      expect(input.props.selectTextOnFocus).toBe(true);
    });
  });
});
