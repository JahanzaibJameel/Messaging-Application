/**
 * Modern 2026 theme configuration with glassmorphism & gradient effects
 * @module theme/colors
 */

const lightTheme = {
  // Primary colors
  primary: "#25D366", // WhatsApp green
  primaryVariant: "#1FAD5D",
  secondary: "#128C7E",
  tertiary: "#075E54",

  // Backgrounds
  background: "#FFFFFF",
  surface: "#F0F0F0",
  surfaceVariant: "#E5E5EA",

  // Text colors
  text: "#000000",
  textSecondary: "#65676B",
  textTertiary: "#8A8D91",

  // Status colors
  success: "#25D366",
  warning: "#FFA500",
  error: "#FF3B30",
  info: "#007AFF",

  // Glass effect
  glass: "rgba(255, 255, 255, 0.7)",
  glassBorder: "rgba(255, 255, 255, 0.2)",

  // Shadows
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowDark: "rgba(0, 0, 0, 0.15)",

  // Chat bubbles
  bubbleOwn: "#DCF8C6",
  bubbleOther: "#FFFFFF",
  bubbleTimestamp: "#99A8A6",
};

const darkTheme = {
  // Primary colors
  primary: "#25D366", // Keep green for consistency
  primaryVariant: "#1FAD5D",
  secondary: "#128C7E",
  tertiary: "#075E54",

  // Backgrounds
  background: "#0B141A",
  surface: "#111B22",
  surfaceVariant: "#202C33",

  // Text colors
  text: "#FFFFFF",
  textSecondary: "#AEBAC1",
  textTertiary: "#8A8D91",

  // Status colors
  success: "#31A24C",
  warning: "#FF9500",
  error: "#FF453A",
  info: "#0A84FF",

  // Glass effect
  glass: "rgba(17, 27, 34, 0.7)",
  glassBorder: "rgba(255, 255, 255, 0.1)",

  // Shadows
  shadow: "rgba(0, 0, 0, 0.3)",
  shadowDark: "rgba(0, 0, 0, 0.5)",

  // Chat bubbles
  bubbleOwn: "#056162",
  bubbleOther: "#202C33",
  bubbleTimestamp: "#8A8D91",
};

export const colors = {
  light: lightTheme,
  dark: darkTheme,
};

export type ThemeColors = typeof lightTheme;
