/**
 * Formatting utilities
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';

dayjs.extend(relativeTime);
dayjs.extend(calendar);

/**
 * Format message timestamp for chat list
 */
export function formatChatListTime(timestamp: Date | string): string {
  const date = dayjs(timestamp);
  const now = dayjs();

  if (date.isSame(now, 'day')) {
    return date.format('HH:mm');
  }

  if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return 'Yesterday';
  }

  if (date.isSame(now, 'week')) {
    return date.format('ddd');
  }

  if (date.isSame(now, 'year')) {
    return date.format('MMM D');
  }

  return date.format('MM/DD/YY');
}

/**
 * Format message timestamp for chat bubbles
 */
export function formatMessageTime(timestamp: Date | string): string {
  return dayjs(timestamp).format('HH:mm');
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: Date | string): string {
  return dayjs(timestamp).fromNow();
}

/**
 * Format calendar time (e.g., "Today at 2:30 PM")
 */
export function formatCalendarTime(timestamp: Date | string): string {
  return dayjs(timestamp).calendar();
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `0:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +X (XXX) XXX-XXXX
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
