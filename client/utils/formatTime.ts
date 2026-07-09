/**
 * Time formatting utilities (legacy UI layer)
 *
 * Migrated from dayjs to date-fns to eliminate the dayjs dependency.
 * New code should prefer the richer formatters in
 * client/src/shared/utils/formatters.ts or the i18n-aware helpers in
 * client/src/i18n/dateHelper.ts.
 */

import {
  format,
  isToday,
  isYesterday,
  differenceInDays,
  formatDistanceToNow,
} from "date-fns";

function toDate(timestamp: string | Date): Date {
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
}

export function formatMessageTime(timestamp: string | Date): string {
  return format(toDate(timestamp), "h:mm a");
}

export function formatChatListTime(timestamp: string | Date): string {
  const date = toDate(timestamp);

  if (isToday(date)) {
    return format(date, "h:mm a");
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  const daysAgo = differenceInDays(new Date(), date);
  if (daysAgo < 7) {
    return format(date, "EEEE"); // Monday, Tuesday …
  }

  return format(date, "M/d/yy");
}

export function formatLastSeen(timestamp: string | Date): string {
  const date = toDate(timestamp);
  const timeStr = format(date, "h:mm a");

  if (isToday(date)) {
    return `last seen today at ${timeStr}`;
  }

  if (isYesterday(date)) {
    return `last seen yesterday at ${timeStr}`;
  }

  return `last seen ${format(date, "M/d/yy")} at ${timeStr}`;
}

export function formatCallDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatStatusTime(timestamp: string | Date): string {
  return formatDistanceToNow(toDate(timestamp), { addSuffix: true });
}
