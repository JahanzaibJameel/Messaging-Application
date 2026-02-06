import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#25D366",
    text: "#000000",
    textSecondary: "#667781",
    buttonText: "#FFFFFF",
    tabIconDefault: "#667781",
    tabIconSelected: "#25D366",
    link: "#25D366",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F0F2F5",
    backgroundSecondary: "#E5E5E5",
    backgroundTertiary: "#D9D9D9",
    surface: "#F0F2F5",
    divider: "#E5E5E5",
    success: "#00A884",
    error: "#E53935",
    online: "#00A884",
    bubbleSender: "#25D366",
    bubbleReceiver: "#F0F2F5",
    inputBackground: "#F0F2F5",
  },
  dark: {
    primary: "#25D366",
    text: "#E9EDEF",
    textSecondary: "#8696A0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8696A0",
    tabIconSelected: "#25D366",
    link: "#25D366",
    backgroundRoot: "#0B141A",
    backgroundDefault: "#1F2C34",
    backgroundSecondary: "#2A3942",
    backgroundTertiary: "#3B4A54",
    surface: "#1F2C34",
    divider: "#2A3942",
    success: "#00A884",
    error: "#E53935",
    online: "#00A884",
    bubbleSender: "#005C4B",
    bubbleReceiver: "#1F2C34",
    inputBackground: "#1F2C34",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 80,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
  bubble: 16,
  bubbleTail: 4,
};

export const Typography = {
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Shadows = {
  bubble: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
