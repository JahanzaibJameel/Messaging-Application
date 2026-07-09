import React from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * Returns true if user has requested reduced motion.
 * Should be used to disable non-essential animations.
 */
export const isReduceMotionEnabled = (): Promise<boolean> => {
  return AccessibilityInfo.isReduceMotionEnabled();
};

/**
 * Builds a consistent accessibility label from component props.
 */
export const getAccessibleLabel = (base: string, role?: string, state?: string): string => {
  let label = base;
  if (role) label += `, ${role}`;
  if (state) label += `, ${state}`;
  return label;
};

/**
 * Hook that returns whether animations should be disabled.
 * Falls back to false until promise resolves.
 */
export const useAccessibleAnimation = () => {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  return reduceMotion;
};

/**
 * Returns true if screen reader is currently active.
 * Useful for optimizing content for screen reader users.
 */
export const isScreenReaderEnabled = (): Promise<boolean> => {
  return AccessibilityInfo.isScreenReaderEnabled();
};

/**
 * Hook that returns whether screen reader is active.
 * Falls back to false until promise resolves.
 */
export const useScreenReader = () => {
  const [screenReaderEnabled, setScreenReaderEnabled] = React.useState(false);

  React.useEffect(() => {
    const handleScreenReaderChange = (enabled: boolean) => {
      setScreenReaderEnabled(enabled);
    };

    isScreenReaderEnabled().then(handleScreenReaderChange);

    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      handleScreenReaderChange
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return screenReaderEnabled;
};

/**
 * Creates accessibility properties for touchable elements.
 * Ensures minimum touch target size of 44x44 points.
 */
export const getTouchableAccessibilityProps = (
  label: string,
  hint?: string,
  role: "button" | "link" | "tab" = "button"
) => {
  return {
    accessibilityRole: role,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: {
      disabled: false,
      selected: false,
    },
    style: {
      minHeight: 44,
      minWidth: 44,
    },
  };
};

/**
 * Creates accessibility properties for text elements.
 */
export const getTextAccessibilityProps = (label: string, role?: "text" | "header" | "label") => {
  return {
    accessibilityRole: role || "text",
    accessibilityLabel: label,
    accessible: true,
  };
};

/**
 * Checks if color contrast meets WCAG AA standards.
 * This is a simplified check - in production, use a proper contrast library.
 */
export const checkColorContrast = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  // This is a placeholder - implement proper contrast calculation
  // For production, use a library like 'color-contrast'
  const aaRatio = isLargeText ? 3.0 : 4.5;

  // Placeholder implementation - replace with actual contrast calculation
  try {
    // In real implementation, convert hex to RGB and calculate luminance
    // Then calculate contrast ratio: (L1 + 0.05) / (L2 + 0.05)
    return true; // Placeholder
  } catch {
    return false;
  }
};

/**
 * Announces message to screen reader users.
 * Useful for dynamic content updates.
 */
export const announceToScreenReader = (message: string): void => {
  if (Platform.OS === "ios") {
    AccessibilityInfo.announceForAccessibility(message);
  } else {
    // Android fallback
    AccessibilityInfo.announceForAccessibility(message);
  }
};

/**
 * Creates accessibility properties for lists.
 */
export const getListAccessibilityProps = (label: string) => {
  return {
    accessibilityRole: "list",
    accessibilityLabel: label,
    accessibilityState: {
      disabled: false,
    },
  };
};

/**
 * Creates accessibility properties for list items.
 */
export const getListItemAccessibilityProps = (label: string, position?: number) => {
  const positionLabel = position !== undefined ? `, Item ${position + 1}` : "";
  return {
    accessibilityRole: "listitem",
    accessibilityLabel: `${label}${positionLabel}`,
    accessibilityState: {
      disabled: false,
    },
  };
};
