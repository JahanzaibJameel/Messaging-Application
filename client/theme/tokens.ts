/**
 * Modern spacing, typography, and elevation system
 * @module theme/tokens
 */

export const spacing = {
  // Base unit: 4px
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
};

export const typography = {
  // Size, lineHeight, fontWeight
  xs: {
    size: 12,
    lineHeight: 16,
    weight: "400",
  },
  sm: {
    size: 14,
    lineHeight: 20,
    weight: "400",
  },
  base: {
    size: 16,
    lineHeight: 24,
    weight: "400",
  },
  lg: {
    size: 18,
    lineHeight: 28,
    weight: "500",
  },
  xl: {
    size: 20,
    lineHeight: 32,
    weight: "600",
  },
  "2xl": {
    size: 24,
    lineHeight: 36,
    weight: "700",
  },
};

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 999,
};

export const shadows = {
  none: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
};

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};
