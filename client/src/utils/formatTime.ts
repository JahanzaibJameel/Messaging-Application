/**
 * Time formatting utilities (legacy UI layer)
 *
 * All formatters are UTC-anchored so output is stable across machines and
 * CI environments. New code should prefer the richer formatters in
 * client/src/shared/utils/formatters.ts or the i18n-aware helpers in
 * client/src/i18n/dateHelper.ts.
 */

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function toDate(timestamp: unknown): Date | null {
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? null : timestamp;
  }
  if (typeof timestamp === "number" && Number.isFinite(timestamp)) {
    const fromNumber = new Date(timestamp);
    return isNaN(fromNumber.getTime()) ? null : fromNumber;
  }
  if (typeof timestamp !== "string" || timestamp.trim() === "") {
    return null;
  }

  let date = new Date(timestamp);
  if (isNaN(date.getTime()) && /^\d+$/.test(timestamp)) {
    // Numeric strings are treated as Unix milliseconds
    date = new Date(Number(timestamp));
  }
  return isNaN(date.getTime()) ? null : date;
}

/** "h:mm AM/PM" in UTC (no leading zero on the hour). */
function formatUtc12Hour(date: Date): string {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function utcDaysAgo(date: Date): number {
  const today = startOfUtcDay(new Date());
  return Math.round((today - startOfUtcDay(date)) / 86400000);
}

/** "M/D/YY" in UTC without zero padding. */
function formatUtcShortDate(date: Date): string {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
}

export function formatMessageTime(timestamp: string | Date | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) {
    return "Invalid Date";
  }
  return formatUtc12Hour(date);
}

export function formatChatListTime(timestamp: string | Date | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) {
    return "Invalid Date";
  }

  const daysAgo = utcDaysAgo(date);

  if (daysAgo <= 0) {
    return formatUtc12Hour(date);
  }

  if (daysAgo === 1) {
    return "Yesterday";
  }

  if (daysAgo < 7) {
    return DAY_NAMES[date.getUTCDay()];
  }

  return formatUtcShortDate(date);
}

export function formatLastSeen(timestamp: string | Date | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) {
    return "Invalid Date";
  }

  const timeStr = formatUtc12Hour(date);
  const daysAgo = utcDaysAgo(date);

  if (daysAgo <= 0) {
    return `last seen today at ${timeStr}`;
  }

  if (daysAgo === 1) {
    return `last seen yesterday at ${timeStr}`;
  }

  return `last seen ${formatUtcShortDate(date)} at ${timeStr}`;
}

/**
 * Formats a call duration as "m:ss". Negative durations keep the sign on
 * the minute component (e.g. -10 seconds → "-1:50").
 */
export function formatCallDuration(seconds: number | null | undefined): string {
  let value: number;
  if (typeof seconds === "number" && Number.isFinite(seconds)) {
    value = seconds;
  } else {
    try {
      value = Number(seconds);
    } catch {
      return "0:00";
    }
    if (!Number.isFinite(value)) {
      return "0:00";
    }
  }

  // Floor division on the raw value; Euclidean modulo for the seconds part
  // (e.g. -10s → minutes = -1, seconds = 50 → "-1:50").
  const minutes = Math.floor(value / 60);
  const secs = Math.floor(((value % 60) + 60) % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
