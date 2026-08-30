/**
 * Formatting utilities
 *
 * Uses date-fns exclusively — dayjs has been removed.
 */

import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisYear,
  formatDistanceToNow,
} from "date-fns";

// ---------------------------------------------------------------------------
// Date / time formatters
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toDate(timestamp: Date | string | number | null | undefined): Date | null {
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? null : timestamp;
  }
  if (timestamp === null || timestamp === undefined) {
    return null;
  }
  const date = new Date(timestamp as string | number);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a time as "h:mm AM/PM" (UTC-stable, used in message bubbles).
 * Invalid or missing inputs yield "Invalid Date".
 */
export function formatTime(timestamp: Date | string | number | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) {
    return "Invalid Date";
  }

  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Format a date as "Month D, YYYY" (UTC-stable).
 * Accepts Date objects, date strings and numeric timestamps.
 * Invalid or missing inputs yield "Invalid Date".
 */
export function formatDate(timestamp: Date | string | number | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) {
    return "Invalid Date";
  }

  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/**
 * Format a timestamp for display in the chat list.
 *
 * Rules (matches WhatsApp-style):
 *   Same day    → "14:05"
 *   Yesterday   → "Yesterday"
 *   This week   → "Mon" / "Tue" …
 *   This year   → "Jan 5"
 *   Older       → "01/05/24"
 */
export function formatChatListTime(timestamp: Date | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  if (isToday(date)) {
    return format(date, "HH:mm");
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  if (isThisWeek(date, { weekStartsOn: 1 })) {
    return format(date, "EEE"); // Mon, Tue …
  }

  if (isThisYear(date)) {
    return format(date, "MMM d"); // Jan 5
  }

  return format(date, "MM/dd/yy"); // 01/05/24
}

/**
 * Format a message timestamp for chat bubbles.
 * Returns "HH:mm" (24-hour clock).
 */
export function formatMessageTime(timestamp: Date | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return format(date, "HH:mm");
}

/**
 * Format a relative time string, e.g. "2 hours ago".
 */
export function formatRelativeTime(timestamp: Date | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format a calendar-style time, e.g. "Today at 14:05" or "01/05/24 14:05".
 */
export function formatCalendarTime(timestamp: Date | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  if (isToday(date)) {
    return `Today at ${format(date, "HH:mm")}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "HH:mm")}`;
  }

  return format(date, "MM/dd/yy HH:mm");
}

// ---------------------------------------------------------------------------
// Non-date formatters (unchanged)
// ---------------------------------------------------------------------------

/**
 * Format a duration in seconds as "h:mm:ss" (or "m:ss" under an hour).
 * Handles negative durations and invalid inputs ("0:00").
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "0:00";
  }

  const sign = seconds < 0 ? "-" : "";
  let remaining = Math.floor(Math.abs(seconds));
  const hours = Math.floor(remaining / 3600);
  remaining %= 3600;
  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  // Negative durations always include the hour segment (e.g. "-0:01:00").
  const showHours = hours > 0 || seconds < 0;
  const minutesText = showHours ? minutes.toString().padStart(2, "0") : minutes.toString();
  return `${sign}${showHours ? `${hours}:` : ""}${minutesText}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format a file size in bytes to a human-readable string
 * with binary (1024-based) units up to EB.
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
    return "0 B";
  }

  if (Math.abs(bytes) < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB", "PB", "EB"];
  let size = bytes;
  let unitIndex = -1;

  while (Math.abs(size) >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  let text = size.toFixed(2);
  if (text.endsWith("0")) {
    text = text.slice(0, -1);
  }

  return `${text} ${units[unitIndex]}`;
}

/**
 * Format a phone number into a readable form.
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * Truncate text with an ellipsis at `maxLength` characters.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format a number with locale-appropriate thousand separators.
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Extract up to two uppercase initials from a display name.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
