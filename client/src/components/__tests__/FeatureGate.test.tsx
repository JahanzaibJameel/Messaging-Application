/**
 * FeatureGate Component Tests
 * Tests for conditional rendering based on feature flags
 */

import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { FeatureGate } from "../FeatureGate";
import { DEFAULT_FEATURE_FLAGS } from "../../stores/featureFlagsStore";

import { useFeatureFlag } from "../../hooks/useFeatureFlag";

// Mock the useFeatureFlag hook
jest.mock("../../hooks/useFeatureFlag", () => ({
  useFeatureFlag: jest.fn(),
}));

describe("FeatureGate Component", () => {
  const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render children when flag is enabled", () => {
      mockUseFeatureFlag.mockReturnValue(true);

      render(
        <FeatureGate flag="enableVoiceMessages">
          <Text testID="child-content">Voice Message Feature</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("child-content")).toBeTruthy();
      expect(screen.getByText("Voice Message Feature")).toBeTruthy();
    });

    it("should not render children when flag is disabled", () => {
      mockUseFeatureFlag.mockReturnValue(false);

      render(
        <FeatureGate flag="enableVoiceMessages">
          <Text testID="child-content">Voice Message Feature</Text>
        </FeatureGate>
      );

      expect(screen.queryByTestId("child-content")).toBeFalsy();
      expect(screen.queryByText("Voice Message Feature")).toBeFalsy();
    });

    it("should render fallback when flag is disabled", () => {
      mockUseFeatureFlag.mockReturnValue(false);

      render(
        <FeatureGate
          flag="enableVoiceMessages"
          fallback={<Text testID="fallback-content">Feature Disabled</Text>}
        >
          <Text testID="child-content">Voice Message Feature</Text>
        </FeatureGate>
      );

      expect(screen.queryByTestId("child-content")).toBeFalsy();
      expect(screen.getByTestId("fallback-content")).toBeTruthy();
      expect(screen.getByText("Feature Disabled")).toBeTruthy();
    });

    it("should render fallback when flag is disabled and children are provided", () => {
      mockUseFeatureFlag.mockReturnValue(false);

      render(
        <FeatureGate
          flag="enableVoiceMessages"
          fallback={<Text testID="fallback-content">Fallback</Text>}
        >
          <Text testID="child-content">Child</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("fallback-content")).toBeTruthy();
      expect(screen.queryByTestId("child-content")).toBeFalsy();
    });
  });

  describe("Fallback Behavior", () => {
    it("should not render fallback when flag is enabled", () => {
      mockUseFeatureFlag.mockReturnValue(true);

      render(
        <FeatureGate
          flag="enableVoiceMessages"
          fallback={<Text testID="fallback-content">Fallback</Text>}
        >
          <Text testID="child-content">Child</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("child-content")).toBeTruthy();
      expect(screen.queryByTestId("fallback-content")).toBeFalsy();
    });

    it("should render multiple children when flag is enabled", () => {
      mockUseFeatureFlag.mockReturnValue(true);

      render(
        <FeatureGate flag="enableVoiceMessages">
          <Text testID="child-1">Child 1</Text>
          <Text testID="child-2">Child 2</Text>
          <View testID="child-3" />
        </FeatureGate>
      );

      expect(screen.getByTestId("child-1")).toBeTruthy();
      expect(screen.getByTestId("child-2")).toBeTruthy();
      expect(screen.getByTestId("child-3")).toBeTruthy();
    });

    it("should render complex fallback component", () => {
      mockUseFeatureFlag.mockReturnValue(false);

      const ComplexFallback = () => (
        <View testID="complex-fallback">
          <Text testID="fallback-title">Feature Not Available</Text>
          <Text testID="fallback-description">This feature is currently disabled.</Text>
        </View>
      );

      render(
        <FeatureGate flag="enableVoiceMessages" fallback={<ComplexFallback />}>
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("complex-fallback")).toBeTruthy();
      expect(screen.getByTestId("fallback-title")).toBeTruthy();
      expect(screen.getByTestId("fallback-description")).toBeTruthy();
      expect(screen.queryByTestId("child-content")).toBeFalsy();
    });
  });

  describe("Loading State", () => {
    it("should render loading component when provided", () => {
      mockUseFeatureFlag.mockReturnValue(true);

      render(
        <FeatureGate
          flag="enableVoiceMessages"
          loading={<Text testID="loading-content">Loading...</Text>}
        >
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("loading-content")).toBeTruthy();
      expect(screen.queryByTestId("child-content")).toBeFalsy();
    });

    it("should render loading when flag is disabled", () => {
      mockUseFeatureFlag.mockReturnValue(false);

      render(
        <FeatureGate
          flag="enableVoiceMessages"
          loading={<Text testID="loading-content">Loading...</Text>}
          fallback={<Text testID="fallback-content">Fallback</Text>}
        >
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("loading-content")).toBeTruthy();
      expect(screen.queryByTestId("fallback-content")).toBeFalsy();
      expect(screen.queryByTestId("child-content")).toBeFalsy();
    });
  });

  describe("Development Mode", () => {
    const originalDev = __DEV__;

    afterEach(() => {
      // Restore original __DEV__ value
      (global as any).__DEV__ = originalDev;
    });

    it("should show debug info in development when enabled", () => {
      (global as any).__DEV__ = true;
      mockUseFeatureFlag.mockReturnValue(true);

      render(
        <FeatureGate flag="enableVoiceMessages" showDebug={true}>
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("child-content")).toBeTruthy();
      // Debug info should be visible in development
      expect(screen.getByText(/🚩 Feature:/)).toBeTruthy();
      expect(screen.getByText(/Status: ✅ ENABLED/)).toBeTruthy();
    });

    it("should show debug info for disabled flag in development", () => {
      (global as any).__DEV__ = true;
      mockUseFeatureFlag.mockReturnValue(false);

      render(
        <FeatureGate flag="enableVoiceMessages" showDebug={true}>
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      expect(screen.queryByTestId("child-content")).toBeFalsy();
      expect(screen.getByText(/🚩 Feature:/)).toBeTruthy();
      expect(screen.getByText(/Status: ❌ DISABLED/)).toBeTruthy();
    });

    it("should not show debug info when showDebug is false", () => {
      (global as any).__DEV__ = true;
      mockUseFeatureFlag.mockReturnValue(true);

      render(
        <FeatureGate flag="enableVoiceMessages" showDebug={false}>
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("child-content")).toBeTruthy();
      expect(screen.queryByText(/🚩 Feature:/)).toBeFalsy();
    });

    it("should not show debug info in production", () => {
      (global as any).__DEV__ = false;
      mockUseFeatureFlag.mockReturnValue(true);

      render(
        <FeatureGate flag="enableVoiceMessages" showDebug={true}>
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("child-content")).toBeTruthy();
      expect(screen.queryByText(/🚩 Feature:/)).toBeFalsy();
    });
  });

  describe("Flag Information", () => {
    it("should display correct flag information in debug mode", () => {
      (global as any).__DEV__ = true;
      mockUseFeatureFlag.mockReturnValue(true);

      render(
        <FeatureGate flag="enableVoiceMessages" showDebug={true}>
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      const flagInfo = DEFAULT_FEATURE_FLAGS.enableVoiceMessages;
      expect(screen.getByText("Voice Messages")).toBeTruthy();
      expect(screen.getByText("functionality")).toBeTruthy();
      expect(screen.getByText("Rollout: 30%")).toBeTruthy();
    });

    it("should handle flags without rollout percentage", () => {
      (global as any).__DEV__ = true;
      mockUseFeatureFlag.mockReturnValue(true);

      // Use a flag without rollout percentage
      const flagWithoutRollout = Object.keys(DEFAULT_FEATURE_FLAGS).find(
        (key) => DEFAULT_FEATURE_FLAGS[key].rolloutPercentage === undefined
      );

      if (flagWithoutRollout) {
        render(
          <FeatureGate
            flag={flagWithoutRollout as keyof typeof DEFAULT_FEATURE_FLAGS}
            showDebug={true}
          >
            <Text testID="child-content">Child Content</Text>
          </FeatureGate>
        );

        expect(screen.queryByText(/Rollout:/)).toBeFalsy();
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty children", () => {
      mockUseFeatureFlag.mockReturnValue(true);

      render(<FeatureGate flag="enableVoiceMessages">{null}</FeatureGate>);

      // Should not crash
      expect(screen.queryByTestId("child-content")).toBeFalsy();
    });

    it("should handle undefined fallback", () => {
      mockUseFeatureFlag.mockReturnValue(false);

      render(
        <FeatureGate flag="enableVoiceMessages">
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      expect(screen.queryByTestId("child-content")).toBeFalsy();
      // Should not crash
    });

    it("should handle multiple FeatureGate components", () => {
      mockUseFeatureFlag.mockImplementation((flag) => {
        return flag === "enableVoiceMessages";
      });

      render(
        <View testID="container">
          <FeatureGate flag="enableVoiceMessages">
            <Text testID="voice-enabled">Voice Enabled</Text>
          </FeatureGate>
          <FeatureGate flag="enableDarkMode">
            <Text testID="dark-enabled">Dark Enabled</Text>
          </FeatureGate>
        </View>
      );

      expect(screen.getByTestId("voice-enabled")).toBeTruthy();
      expect(screen.queryByTestId("dark-enabled")).toBeFalsy();
    });
  });

  describe("Type Safety", () => {
    it("should accept valid flag keys", () => {
      mockUseFeatureFlag.mockReturnValue(true);

      expect(() => {
        render(
          <FeatureGate flag="enableVoiceMessages">
            <Text>Test</Text>
          </FeatureGate>
        );
      }).not.toThrow();
    });

    it("should handle all defined flags", () => {
      mockUseFeatureFlag.mockReturnValue(true);

      Object.keys(DEFAULT_FEATURE_FLAGS).forEach((flagKey) => {
        expect(() => {
          render(
            <FeatureGate flag={flagKey as keyof typeof DEFAULT_FEATURE_FLAGS}>
              <Text>Test</Text>
            </FeatureGate>
          );
        }).not.toThrow();
      });
    });
  });

  describe("Performance", () => {
    it("should handle rapid re-renders", () => {
      mockUseFeatureFlag.mockReturnValue(true);

      const { rerender } = render(
        <FeatureGate flag="enableVoiceMessages">
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("child-content")).toBeTruthy();

      // Rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(
          <FeatureGate flag="enableVoiceMessages">
            <Text testID="child-content">Child Content {i}</Text>
          </FeatureGate>
        );
      }

      expect(screen.getByTestId("child-content")).toBeTruthy();
    });

    it("should handle flag value changes", () => {
      const { rerender } = render(
        <FeatureGate flag="enableVoiceMessages">
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      // Initially disabled
      mockUseFeatureFlag.mockReturnValue(false);
      expect(screen.queryByTestId("child-content")).toBeFalsy();

      // Enable flag
      mockUseFeatureFlag.mockReturnValue(true);
      rerender(
        <FeatureGate flag="enableVoiceMessages">
          <Text testID="child-content">Child Content</Text>
        </FeatureGate>
      );

      expect(screen.getByTestId("child-content")).toBeTruthy();
    });
  });
});
