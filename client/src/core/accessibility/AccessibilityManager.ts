/**
 * Enterprise Accessibility Manager
 * WCAG 2.1 AA compliance utilities and helpers
 */

import React from 'react';
import { Platform, AccessibilityInfo, Dimensions } from "react-native";
import { logger } from "../logger";

// WCAG 2.1 AA compliance thresholds
export const WCAG_CONSTANTS = {
  // Color contrast ratios
  CONTRAST_RATIOS: {
    AA_NORMAL: 4.5, // Normal text (14pt+)
    AA_LARGE: 3.0, // Large text (18pt+ or 14pt bold)
    AAA_NORMAL: 7.0, // Enhanced contrast
    AAA_LARGE: 4.5, // Enhanced contrast for large text
  },

  // Touch target sizes (44x44 points minimum)
  MIN_TOUCH_TARGET: 44,

  // Font scaling
  MIN_FONT_SCALE: 0.8,
  MAX_FONT_SCALE: 2.0,

  // Animation durations
  REDUCED_MOTION_DURATION: 0.1, // seconds
} as const;

export interface AccessibilityConfig {
  reduceMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
  fontScale: number;
  colorScheme: "light" | "dark" | "high-contrast";
  largeText: boolean;
}

class AccessibilityManagerClass {
  private config: AccessibilityConfig = {
    reduceMotion: false,
    highContrast: false,
    screenReader: false,
    fontScale: 1.0,
    colorScheme: "light",
    largeText: false,
  };

  private listeners: Set<(config: AccessibilityConfig) => void> = new Set();

  constructor() {
    this.initializeAccessibilityInfo();
  }

  private async initializeAccessibilityInfo() {
    try {
      // Get initial accessibility settings
      const [reduceMotion, screenReader, highContrast, colorScheme] = await Promise.all([
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isHighContrastEnabled?.() || Promise.resolve(false),
        this.getColorScheme(),
      ]);

      this.config = {
        reduceMotion,
        highContrast,
        screenReader,
        fontScale: await this.getFontScale(),
        colorScheme,
        largeText: await this.isLargeTextEnabled(),
      };

      // Listen for changes
      AccessibilityInfo.addEventListener("reduceMotionChanged", this.handleReduceMotionChange);
      AccessibilityInfo.addEventListener("screenReaderChanged", this.handleScreenReaderChange);
      AccessibilityInfo.addEventListener("highContrastChanged", this.handleHighContrastChange);

      logger.info("Accessibility manager initialized", this.config);
    } catch (error) {
      logger.error("Failed to initialize accessibility manager:", error);
    }
  }

  private handleReduceMotionChange = (reduceMotion: boolean) => {
    this.updateConfig({ reduceMotion });
  };

  private handleScreenReaderChange = (screenReader: boolean) => {
    this.updateConfig({ screenReader });
  };

  private handleHighContrastChange = (highContrast: boolean) => {
    this.updateConfig({ highContrast });
  };

  private async getFontScale(): Promise<number> {
    try {
      // On iOS, we can get font scale from AccessibilityInfo
      if (Platform.OS === "ios") {
        return (await AccessibilityInfo.getFontScale?.()) || 1.0;
      }

      // On Android, use Dimensions as fallback
      const { fontScale } = Dimensions.get("window");
      return fontScale || 1.0;
    } catch (error) {
      logger.error("Failed to get font scale:", error);
      return 1.0;
    }
  }

  private async isLargeTextEnabled(): Promise<boolean> {
    try {
      return (await AccessibilityInfo.isBoldTextEnabled?.()) || false;
    } catch (error) {
      logger.error("Failed to check large text preference:", error);
      return false;
    }
  }

  private async getColorScheme(): Promise<"light" | "dark" | "high-contrast"> {
    try {
      const isHighContrast = (await AccessibilityInfo.isHighContrastEnabled?.()) || false;
      if (isHighContrast) {
        return "high-contrast";
      }

      // You might want to integrate with your theme system here
      return "light"; // This should come from your theme context
    } catch (error) {
      logger.error("Failed to get color scheme:", error);
      return "light";
    }
  }

  private updateConfig(updates: Partial<AccessibilityConfig>) {
    this.config = { ...this.config, ...updates };
    this.notifyListeners();
    logger.info("Accessibility config updated", { updates, config: this.config });
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.config));
  }

  // Public API
  public getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  public subscribe(listener: (config: AccessibilityConfig) => void): () => void {
    this.listeners.add(listener);
    listener(this.config); // Immediately call with current config

    return () => {
      this.listeners.delete(listener);
    };
  }

  // Color contrast utilities
  public getContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);

    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(color: string): number {
    // Remove # if present
    const hex = color.replace("#", "");

    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const sRGB = [r, g, b].map((val) => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  public meetsWCAGStandard(
    foreground: string,
    background: string,
    isLargeText: boolean = false
  ): { aa: boolean; aaa: boolean; ratio: number } {
    const ratio = this.getContrastRatio(foreground, background);

    return {
      ratio,
      aa:
        ratio >=
        (isLargeText
          ? WCAG_CONSTANTS.CONTRAST_RATIOS.AA_LARGE
          : WCAG_CONSTANTS.CONTRAST_RATIOS.AA_NORMAL),
      aaa:
        ratio >=
        (isLargeText
          ? WCAG_CONSTANTS.CONTRAST_RATIOS.AAA_LARGE
          : WCAG_CONSTANTS.CONTRAST_RATIOS.AAA_NORMAL),
    };
  }

  // Touch target validation
  public validateTouchTarget(width: number, height: number): boolean {
    return width >= WCAG_CONSTANTS.MIN_TOUCH_TARGET && height >= WCAG_CONSTANTS.MIN_TOUCH_TARGET;
  }

  // Animation utilities
  public shouldReduceMotion(): boolean {
    return this.config.reduceMotion;
  }

  public getAnimationDuration(duration: number): number {
    return this.config.reduceMotion ? WCAG_CONSTANTS.REDUCED_MOTION_DURATION : duration;
  }

  // Font scaling utilities
  public getScaledFontSize(baseSize: number): number {
    const scaledSize = baseSize * this.config.fontScale;
    return Math.max(
      baseSize * WCAG_CONSTANTS.MIN_FONT_SCALE,
      Math.min(scaledSize, baseSize * WCAG_CONSTANTS.MAX_FONT_SCALE)
    );
  }

  // Screen reader utilities
  public isScreenReaderActive(): boolean {
    return this.config.screenReader;
  }

  // High contrast utilities
  public isHighContrastMode(): boolean {
    return this.config.highContrast;
  }

  // Accessibility label generator
  public generateAccessibilityLabel(
    identifier: string,
    action?: string,
    state?: string,
    value?: string
  ): string {
    const parts = [identifier];

    if (action) parts.push(action);
    if (state) parts.push(state);
    if (value) parts.push(value);

    return parts.join(", ");
  }

  // Focus management utilities
  public announceToScreenReader(message: string): void {
    if (this.config.screenReader) {
      // Use AccessibilityInfo.announceForAccessibility if available
      if (AccessibilityInfo.announceForAccessibility) {
        AccessibilityInfo.announceForAccessibility(message);
      } else {
        logger.info("Screen reader announcement:", message);
      }
    }
  }

  // Validation utilities
  public validateAccessibilityProps(props: {
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: string;
    accessible?: boolean;
  }): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if interactive element has accessibility label
    if (props.accessible !== false && !props.accessibilityLabel) {
      errors.push("Interactive elements must have accessibilityLabel");
    }

    // Check accessibility label length
    if (props.accessibilityLabel && props.accessibilityLabel.length > 100) {
      warnings.push("Accessibility label should be concise (under 100 characters)");
    }

    // Check for accessibility hint when action isn't obvious
    if (props.accessible !== false && props.accessibilityLabel && !props.accessibilityHint) {
      const hasObviousAction = ["button", "link", "switch"].includes(props.accessibilityRole || "");
      if (!hasObviousAction) {
        warnings.push("Consider adding accessibilityHint for non-obvious actions");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Cleanup
  public cleanup(): void {
    AccessibilityInfo.removeEventListener("reduceMotionChanged", this.handleReduceMotionChange);
    AccessibilityInfo.removeEventListener("screenReaderChanged", this.handleScreenReaderChange);
    AccessibilityInfo.removeEventListener("highContrastChanged", this.handleHighContrastChange);
    this.listeners.clear();
  }
}

// Singleton instance
export const AccessibilityManager = new AccessibilityManagerClass();

// React hooks
export const useAccessibility = () => {
  const [config, setConfig] = React.useState(AccessibilityManager.getConfig());

  React.useEffect(() => {
    const unsubscribe = AccessibilityManager.subscribe(setConfig);
    return unsubscribe;
  }, []);

  return {
    ...config,
    manager: AccessibilityManager,
  };
};

export const useAccessibilityLabel = (
  identifier: string,
  action?: string,
  state?: string,
  value?: string
) => {
  const { screenReader } = useAccessibility();

  return React.useMemo(() => {
    return screenReader
      ? AccessibilityManager.generateAccessibilityLabel(identifier, action, state, value)
      : "";
  }, [identifier, action, state, value, screenReader]);
};
