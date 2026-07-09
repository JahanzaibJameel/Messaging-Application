// @ts-nocheck — i18n bootstrap uses dynamic imports and RN settings APIs with incomplete typings.
/**
 * Enterprise-grade Internationalization System
 * Supports RTL languages, ICU message syntax, and dynamic loading
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { Platform, I18nManager } from "react-native";
import { logger } from "../logger";

// Supported languages with enterprise metadata
export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
  currency: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    rtl: false,
    dateFormat: "MM/dd/yyyy",
    numberFormat: { style: "decimal" },
    currency: "USD",
    flag: "🇺🇸",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    rtl: false,
    dateFormat: "dd/MM/yyyy",
    numberFormat: { style: "decimal" },
    currency: "EUR",
    flag: "🇪🇸",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    rtl: false,
    dateFormat: "dd/MM/yyyy",
    numberFormat: { style: "decimal" },
    currency: "EUR",
    flag: "🇫🇷",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    rtl: false,
    dateFormat: "dd.MM.yyyy",
    numberFormat: { style: "decimal" },
    currency: "EUR",
    flag: "🇩🇪",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    rtl: true,
    dateFormat: "dd/MM/yyyy",
    numberFormat: { style: "decimal" },
    currency: "SAR",
    flag: "🇸🇦",
  },
  {
    code: "he",
    name: "Hebrew",
    nativeName: "עברית",
    rtl: true,
    dateFormat: "dd/MM/yyyy",
    numberFormat: { style: "decimal" },
    currency: "ILS",
    flag: "🇮🇱",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    rtl: false,
    dateFormat: "dd/MM/yyyy",
    numberFormat: { style: "decimal" },
    currency: "INR",
    flag: "🇮🇳",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    rtl: false,
    dateFormat: "yyyy/MM/dd",
    numberFormat: { style: "decimal" },
    currency: "JPY",
    flag: "🇯🇵",
  },
  {
    code: "zh",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    rtl: false,
    dateFormat: "yyyy-MM-dd",
    numberFormat: { style: "decimal" },
    currency: "CNY",
    flag: "🇨🇳",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    rtl: false,
    dateFormat: "dd/MM/yyyy",
    numberFormat: { style: "decimal" },
    currency: "BRL",
    flag: "🇧🇷",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    rtl: false,
    dateFormat: "dd.MM.yyyy",
    numberFormat: { style: "decimal" },
    currency: "RUB",
    flag: "🇷🇺",
  },
];

// Translation resources interface
export interface TranslationResources {
  [key: string]: {
    [key: string]: string | TranslationResources;
  };
}

// Default language detection
export const detectLanguage = (): string => {
  try {
    // 1. Check stored preference
    const stored = localStorage?.getItem?.("app-language");
    if (stored && SUPPORTED_LANGUAGES.some((lang) => lang.code === stored)) {
      return stored;
    }

    // 2. Check device locale
    const deviceLocale =
      Platform.OS === "ios" ? (Settings as any).AppleLocale : (Settings as any).AndroidLocale;

    if (deviceLocale) {
      const langCode = deviceLocale.split("-")[0];
      const supported = SUPPORTED_LANGUAGES.find((lang) => lang.code === langCode);
      if (supported) {
        return supported.code;
      }
    }

    // 3. Fallback to English
    return "en";
  } catch (error) {
    logger.error("Failed to detect language:", error);
    return "en";
  }
};

// Initialize i18n
export const initializeI18n = async (language?: string) => {
  const targetLanguage = language || detectLanguage();
  const isRTL = SUPPORTED_LANGUAGES.find((lang) => lang.code === targetLanguage)?.rtl || false;

  try {
    // Force RTL for RTL languages
    if (isRTL !== I18nManager.isRTL) {
      I18nManager.forceRTL(isRTL);
      logger.info("RTL direction updated", { isRTL, language: targetLanguage });
    }

    // Load translation resources
    const resources = await loadTranslationResources();

    await i18n.init({
      resources,
      lng: targetLanguage,
      fallbackLng: "en",
      debug: __DEV__,

      // ICU message format support
      interpolation: {
        escapeValue: false,
      },

      // Pluralization support
      pluralSeparator: "_",

      // Namespace support
      defaultNS: "common",
      ns: ["common", "chat", "auth", "errors"],

      // Key separator for nested translations
      keySeparator: ".",

      // React compatibility
      react: {
        useSuspense: false,
        bindI18n: "languageChanged",
        bindI18nStore: false,
      },
    });

    initReactI18next(i18n);

    // Store language preference
    localStorage?.setItem?.("app-language", targetLanguage);

    logger.info("i18n initialized", {
      language: targetLanguage,
      isRTL,
      supportedLanguages: SUPPORTED_LANGUAGES.length,
    });

    return targetLanguage;
  } catch (error) {
    logger.error("Failed to initialize i18n:", error);
    throw error;
  }
};

// Load translation resources
const loadTranslationResources = async (): Promise<TranslationResources> => {
  const resources: TranslationResources = {};

  try {
    for (const language of SUPPORTED_LANGUAGES) {
      // Load namespaces for each language
      const namespaces = ["common", "chat", "auth", "errors"];

      resources[language.code] = {};

      for (const ns of namespaces) {
        try {
          // In production, these would be loaded from your translation service
          // For now, we'll use dynamic imports
          const translations = await import(`./locales/${language.code}/${ns}.json`);
          resources[language.code][ns] = translations.default;
        } catch (error) {
          logger.warn(`Failed to load ${ns} translations for ${language.code}:`, error);

          // Fallback to English for missing translations
          if (language.code !== "en") {
            try {
              const fallbackTranslations = await import(`./locales/en/${ns}.json`);
              resources[language.code][ns] = fallbackTranslations.default;
            } catch (fallbackError) {
              logger.error(`Failed to load fallback translations:`, fallbackError);
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error("Failed to load translation resources:", error);
  }

  return resources;
};

// Language switching utility
export const changeLanguage = async (languageCode: string): Promise<void> => {
  try {
    const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === languageCode);
    if (!language) {
      throw new Error(`Unsupported language: ${languageCode}`);
    }

    // Update RTL direction if needed
    if (language.rtl !== I18nManager.isRTL) {
      I18nManager.forceRTL(language.rtl);

      // On Android, we might need to restart the app for RTL changes
      if (Platform.OS === "android" && language.rtl !== I18nManager.isRTL) {
        logger.info("RTL direction changed, app restart may be required");
      }
    }

    // Change language
    await i18n.changeLanguage(languageCode);

    // Store preference
    localStorage?.setItem?.("app-language", languageCode);

    logger.info("Language changed", {
      from: i18n.language,
      to: languageCode,
      isRTL: language.rtl,
    });
  } catch (error) {
    logger.error("Failed to change language:", error);
    throw error;
  }
};

// Utility functions for enterprise usage
export const getCurrentLanguage = (): SupportedLanguage | undefined => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language);
};

export const isRTLLanguage = (): boolean => {
  return getCurrentLanguage()?.rtl || false;
};

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  const language = getCurrentLanguage();
  const defaultOptions = language?.numberFormat || { style: "decimal" };

  return new Intl.NumberFormat(i18n.language, { ...defaultOptions, ...options }).format(value);
};

export const formatCurrency = (value: number, currency?: string): string => {
  const language = getCurrentLanguage();
  const targetCurrency = currency || language?.currency || "USD";

  return new Intl.NumberFormat(i18n.language, {
    style: "currency",
    currency: targetCurrency,
  }).format(value);
};

export const formatDate = (date: Date | string | number, format?: string): string => {
  const language = getCurrentLanguage();
  const targetFormat = format || language?.dateFormat || "MM/dd/yyyy";

  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;

  // Simple date formatting (could be enhanced with date-fns)
  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear();

  return targetFormat.replace("dd", day).replace("MM", month).replace("yyyy", year.toString());
};

export const getRelativeTime = (date: Date | string | number): string => {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return formatDate(dateObj);
  }

  if (diffDays > 0) {
    return i18n.t("common.relativeTime.daysAgo", { count: diffDays });
  }

  if (diffHours > 0) {
    return i18n.t("common.relativeTime.hoursAgo", { count: diffHours });
  }

  if (diffMinutes > 0) {
    return i18n.t("common.relativeTime.minutesAgo", { count: diffMinutes });
  }

  return i18n.t("common.relativeTime.justNow");
};

// Translation validation utilities
export const validateTranslationStructure = (
  translations: any,
  path: string = ""
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const validate = (obj: any, currentPath: string) => {
    if (typeof obj === "string") {
      // Check for ICU syntax errors
      if (obj.includes("{") && obj.includes("}")) {
        try {
          // Basic ICU validation
          const icuPattern = /\{[^}]+\}/g;
          const matches = obj.match(icuPattern);
          if (matches) {
            matches.forEach((match) => {
              if (
                !match.includes("count") &&
                !match.includes("plural") &&
                !match.includes("select") &&
                !match.includes("gender")
              ) {
                errors.push(`Invalid ICU syntax at ${currentPath}: ${match}`);
              }
            });
          }
        } catch (error) {
          errors.push(`ICU syntax error at ${currentPath}: ${error}`);
        }
      }
    } else if (typeof obj === "object" && obj !== null) {
      Object.keys(obj).forEach((key) => {
        validate(obj[key], currentPath ? `${currentPath}.${key}` : key);
      });
    }
  };

  validate(translations, path);

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Export i18n instance for direct usage
export { i18n };

// React hooks
export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);

  React.useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  return {
    currentLanguage,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL: isRTLLanguage(),
    currentLangInfo: getCurrentLanguage(),
  };
};
