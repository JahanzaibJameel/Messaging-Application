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
 * Format a duration in seconds to a readable mm:ss string.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0
    ? `${mins}:${secs.toString().padStart(2, "0")}`
    : `0:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
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
