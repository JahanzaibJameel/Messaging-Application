/**
 * Shared constants
 */

// App constants
export const APP_NAME = 'ChatApp';
export const APP_VERSION = '3.0.0';

// Storage keys
export const STORAGE_KEYS = {
  AUTH: '@chatapp/auth',
  CHATS: '@chatapp/chats',
  MESSAGES: '@chatapp/messages',
  SETTINGS: '@chatapp/settings',
  SYNC: '@chatapp/sync',
} as const;

// Sync constants
export const SYNC_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000,
  BATCH_SIZE: 50,
  SYNC_INTERVAL: 30000,
} as const;

// Message constants
export const MESSAGE_CONFIG = {
  MAX_TEXT_LENGTH: 4096,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  TYPING_TIMEOUT: 3000,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;

// Animation durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;
