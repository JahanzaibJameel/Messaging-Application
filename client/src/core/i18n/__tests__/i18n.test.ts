/**
 * i18n Tests
 * Tests for internationalization configuration and locale management
 */

import {
  detectLanguage,
  changeLanguage,
  getCurrentLanguage,
  isRTLLanguage,
  formatNumber,
  formatCurrency,
  formatDate,
  getRelativeTime,
  validateTranslationStructure,
  SUPPORTED_LANGUAGES,
  i18n,
} from "../i18n";

jest.mock("react-i18next", () => ({
  initReactI18next: jest.fn(),
}));

jest.mock("../../../core/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
  I18nManager: {
    isRTL: false,
    forceRTL: jest.fn(),
  },
  Settings: {
    AppleLocale: "en_US",
    AndroidLocale: "en_US",
  },
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

(i18n as any).t = jest.fn((key: string) => {
  const map: Record<string, string> = {
    "common.relativeTime.justNow": "Just now",
    "common.relativeTime.minutesAgo": "minutes ago",
    "common.relativeTime.hoursAgo": "hours ago",
    "common.relativeTime.daysAgo": "days ago",
  };
  return map[key] || key;
});

describe("i18n", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("SUPPORTED_LANGUAGES", () => {
    it("should contain all supported languages", () => {
      expect(SUPPORTED_LANGUAGES.length).toBe(11);
    });

    it("should include English as first language", () => {
      const en = SUPPORTED_LANGUAGES.find((l) => l.code === "en");
      expect(en).toBeDefined();
      expect(en!.rtl).toBe(false);
    });

    it("should include RTL languages", () => {
      const ar = SUPPORTED_LANGUAGES.find((l) => l.code === "ar");
      const he = SUPPORTED_LANGUAGES.find((l) => l.code === "he");
      expect(ar!.rtl).toBe(true);
      expect(he!.rtl).toBe(true);
    });
  });

  describe("detectLanguage", () => {
    it("should return stored language preference when available", () => {
      (localStorageMock.getItem as jest.Mock).mockReturnValue("es");
      const result = detectLanguage();
      expect(result).toBe("es");
    });

    it("should return device locale when stored preference is not available", () => {
      (localStorageMock.getItem as jest.Mock).mockReturnValue(null);
      const result = detectLanguage();
      expect(result).toBe("en");
    });

    it("should return English as fallback when nothing is found", () => {
      (localStorageMock.getItem as jest.Mock).mockReturnValue(null);
      const result = detectLanguage();
      expect(result).toBe("en");
    });

    it("should catch errors and return English", () => {
      (localStorageMock.getItem as jest.Mock).mockImplementation(() => {
        throw new Error("Storage error");
      });
      const result = detectLanguage();
      expect(result).toBe("en");
    });
  });

  describe("getCurrentLanguage", () => {
    it("should return the current language from i18n", () => {
      (i18n.language as string) = "en";
      const result = getCurrentLanguage();
      expect(result?.code).toBe("en");
    });

    it("should return undefined for unsupported language", () => {
      (i18n.language as string) = "xx";
      const result = getCurrentLanguage();
      expect(result).toBeUndefined();
    });
  });

  describe("isRTLLanguage", () => {
    it("should return true for RTL languages", () => {
      (i18n.language as string) = "ar";
      expect(isRTLLanguage()).toBe(true);
    });

    it("should return false for LTR languages", () => {
      (i18n.language as string) = "en";
      expect(isRTLLanguage()).toBe(false);
    });
  });

  describe("formatNumber", () => {
    it("should format a number", () => {
      (i18n.language as string) = "en";
      const result = formatNumber(1234.56);
      expect(typeof result).toBe("string");
      expect(result).toContain("1,234");
    });
  });

  describe("formatCurrency", () => {
    it("should format a number as currency", () => {
      (i18n.language as string) = "en";
      const result = formatCurrency(1234.56);
      expect(typeof result).toBe("string");
      expect(result).toContain("$");
    });
  });

  describe("formatDate", () => {
    it("should format a date with default format", () => {
      (i18n.language as string) = "en";
      const result = formatDate(new Date("2024-01-15"));
      expect(result).toBe("01/15/2024");
    });

    it("should format with custom format", () => {
      const result = formatDate(new Date("2024-01-15"), "dd/MM/yyyy");
      expect(result).toBe("15/01/2024");
    });

    it("should handle string dates", () => {
      (i18n.language as string) = "en";
      const result = formatDate("2024-01-15");
      expect(result).toBe("01/15/2024");
    });
  });

  describe("getRelativeTime", () => {
    it("should return justNow for recent times", () => {
      (i18n.language as string) = "en";
      const now = new Date();
      const result = getRelativeTime(now);
      expect(result).toBe("Just now");
    });

    it("should return minutes ago", () => {
      (i18n.language as string) = "en";
      const past = new Date(Date.now() - 5 * 60 * 1000);
      const result = getRelativeTime(past);
      expect(result).toContain("minutes ago");
    });

    it("should return days ago for older dates", () => {
      (i18n.language as string) = "en";
      const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(past);
      expect(result).toContain("days ago");
    });
  });

  describe("validateTranslationStructure", () => {
    it("should return valid for simple translations", () => {
      const translations = { greeting: "Hello" };
      const result = validateTranslationStructure(translations);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return valid for nested translations", () => {
      const translations = { common: { greeting: "Hello" } };
      const result = validateTranslationStructure(translations);
      expect(result.valid).toBe(true);
    });

    it("should detect invalid ICU syntax", () => {
      const translations = { message: "Hello {name}" };
      const result = validateTranslationStructure(translations);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
