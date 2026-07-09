import { formatDistanceToNow, format } from "date-fns";
import { enUS, arSA } from "date-fns/locale";
import i18n from "./index";

const locales = {
  en: enUS,
  ar: arSA,
};

/**
 * Returns a localized "time ago" string (e.g., "2 hours ago")
 * Uses date-fns with proper locale support
 */
export const timeAgo = (date: Date): string => {
  const lang = i18n.language.split("-")[0] as keyof typeof locales;
  const locale = locales[lang] || enUS;

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale,
  });
};

/**
 * Returns a localized date string (e.g., "January 1, 2023")
 */
export const formatDate = (date: Date, formatStr: string = "PPP"): string => {
  const lang = i18n.language.split("-")[0] as keyof typeof locales;
  const locale = locales[lang] || enUS;

  return format(date, formatStr, { locale });
};

/**
 * Returns a localized time string (e.g., "3:30 PM")
 */
export const formatTime = (date: Date): string => {
  const lang = i18n.language.split("-")[0] as keyof typeof locales;
  const locale = locales[lang] || enUS;

  return format(date, "p", { locale });
};

/**
 * Returns a localized date and time string
 */
export const formatDateTime = (date: Date): string => {
  const lang = i18n.language.split("-")[0] as keyof typeof locales;
  const locale = locales[lang] || enUS;

  return format(date, "PPp", { locale });
};

/**
 * Returns a relative time string using i18n translations
 * Falls back to date-fns if translation not available
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Use i18n translations for common time ranges
  if (diffInSeconds < 60) {
    return i18n.t("time.justNow");
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return i18n.t("time.minutesAgo", { count: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return i18n.t("time.hoursAgo", { count: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return i18n.t("time.daysAgo", { count: diffInDays });
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return i18n.t("time.weeksAgo", { count: diffInWeeks });
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return i18n.t("time.monthsAgo", { count: diffInMonths });
};

/**
 * Formats a timestamp for chat messages
 * Uses relative time for recent messages, absolute time for older ones
 */
export const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  // Use relative time for messages less than 24 hours old
  if (diffInHours < 24) {
    return getRelativeTime(date);
  }

  // Use absolute time for older messages
  return formatTime(date);
};

/**
 * Returns the current locale for date-fns
 */
export const getCurrentLocale = () => {
  const lang = i18n.language.split("-")[0] as keyof typeof locales;
  return locales[lang] || enUS;
};
