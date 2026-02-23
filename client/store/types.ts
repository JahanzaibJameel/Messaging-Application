/**
 * Re-export all types from the centralized types module
 * This file is kept for backwards compatibility
 * New code should import directly from @/types
 */

export type {
  User,
  Chat,
  GroupChat,
  Message,
  MessageAttachment,
  Status,
  Call,
  AppSettings,
  SyncState,
  AuthState,
  ChatListState,
  ChatState,
} from "@/types";
