/**
 * Chat Service
 * Unified real-time messaging service that connects WebSocket client
 * with message store and handles connection lifecycle.
 */

import React from "react";
import { getToken } from "@/security/keychain";
import { getWebSocketClient, resetWebSocketClient } from "./WebSocketClient";
import { getMessageHandler, resetMessageHandler } from "./MessageHandler";
import { useAuthStore, useMessageStore, useChatStore } from "@/presentation/stores";
import { logger } from "@/core/logger";
import type { Message } from "@/domain/entities/Message";

let isInitialized = false;
let isConnecting = false;

export async function initializeChatService(): Promise<void> {
  if (isInitialized || isConnecting) return;

  isConnecting = true;

  try {
    const { accessToken } = await getToken();
    if (!accessToken) {
      logger.warn("No auth token available for chat service", "ChatService");
      isConnecting = false;
      return;
    }

    const wsClient = getWebSocketClient();
    wsClient.updateAuthToken(accessToken);

    // Initialize message handler (singleton)
    getMessageHandler(wsClient);

    wsClient.connect();
    isInitialized = true;
  } catch (error) {
    logger.error("Failed to initialize chat service", error as Error, "ChatService");
  } finally {
    isConnecting = false;
  }
}

export function disconnectChatService(): void {
  const wsClient = getWebSocketClient();
  wsClient.disconnect();
  resetMessageHandler();
  isInitialized = false;
}

export function sendChatMessage(chatId: string, message: Message): boolean {
  const wsClient = getWebSocketClient();
  if (!wsClient.isConnected()) {
    logger.warn("Cannot send message: not connected", "ChatService");
    return false;
  }

  const messageHandler = getMessageHandler(wsClient);
  return messageHandler.sendMessage(chatId, message);
}

export function joinChat(chatId: string): boolean {
  const wsClient = getWebSocketClient();
  if (!wsClient.isConnected()) return false;

  const messageHandler = getMessageHandler(wsClient);
  return messageHandler.joinChat(chatId);
}

export function leaveChat(chatId: string): boolean {
  const wsClient = getWebSocketClient();
  if (!wsClient.isConnected()) return false;

  const messageHandler = getMessageHandler(wsClient);
  return messageHandler.leaveChat(chatId);
}

export function sendTypingIndicator(chatId: string, isTyping: boolean): boolean {
  const wsClient = getWebSocketClient();
  if (!wsClient.isConnected()) return false;

  const messageHandler = getMessageHandler(wsClient);
  return messageHandler.sendTypingIndicator(chatId, isTyping);
}

export function sendMessageStatus(messageId: string, status: "delivered" | "read"): boolean {
  const wsClient = getWebSocketClient();
  if (!wsClient.isConnected()) return false;

  const messageHandler = getMessageHandler(wsClient);
  return messageHandler.sendMessageStatus(messageId, status);
}

export function sendReaction(messageId: string, emoji: string, action: "add" | "remove"): boolean {
  const wsClient = getWebSocketClient();
  if (!wsClient.isConnected()) return false;

  const messageHandler = getMessageHandler(wsClient);
  return messageHandler.sendReaction(messageId, emoji, action);
}

export function isConnected(): boolean {
  return getWebSocketClient().isConnected();
}

export function getConnectionStatus():
  "connecting" | "connected" | "disconnected" | "reconnecting" {
  return getWebSocketClient().getStatus();
}

export function resetChatService(): void {
  resetWebSocketClient();
  resetMessageHandler();
  isInitialized = false;
  isConnecting = false;
}

// Hook for React components
export function useChatService(chatId: string | null) {
  const { currentUser } = useAuthStore();
  const { getMessagesByChatId, addMessage, updateMessage, deleteMessage, setReplyingTo } =
    useMessageStore();
  const { markChatAsRead } = useChatStore();

  // Join/leave chat when chatId changes
  React.useEffect(() => {
    if (!chatId || !currentUser) return;

    joinChat(chatId);
    markChatAsRead(chatId);

    return () => {
      leaveChat(chatId);
    };
  }, [chatId, currentUser, markChatAsRead]);

  const sendMessage = React.useCallback(
    (text: string, replyTo?: string) => {
      if (!currentUser || !chatId) return;

      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chatId,
        senderId: currentUser.id,
        type: "text" as const,
        text,
        timestamp: new Date(),
        status: "sending" as const,
        replyTo,
        reactions: [],
        edited: false,
        localOnly: true,
        retryCount: 0,
      } as Message;

      // Add optimistically
      addMessage(message);

      // Send via WebSocket
      const sent = sendChatMessage(chatId, message);
      if (sent) {
        updateMessage(message.id, { status: "sent", localOnly: false });
      } else {
        updateMessage(message.id, { status: "failed" });
      }

      setReplyingTo(null);
      return message;
    },
    [currentUser, chatId, addMessage, updateMessage, setReplyingTo]
  );

  return {
    isConnected: isConnected(),
    sendMessage,
    sendTyping: (chatId: string) => {
      sendTypingIndicator(chatId, true);
      setTimeout(() => sendTypingIndicator(chatId, false), 3000);
    },
    markAsRead: (messageId: string) => sendMessageStatus(messageId, "read"),
    addReaction: (messageId: string, emoji: string) => sendReaction(messageId, emoji, "add"),
    removeReaction: (messageId: string) => sendReaction(messageId, "", "remove"),
    getMessagesByChatId,
    deleteMessage,
    setReplyingTo,
  };
}
