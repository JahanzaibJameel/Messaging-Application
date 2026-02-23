/**
 * WebSocket React Hook
 * Provides WebSocket functionality for React components
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { getWebSocketClient, resetWebSocketClient, type WebSocketStatus } from './WebSocketClient';
import { getMessageHandler, resetMessageHandler } from './MessageHandler';
import type { Message } from '@domain/entities/Message';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const wsClientRef = useRef(getWebSocketClient());
  const messageHandlerRef = useRef(getMessageHandler(wsClientRef.current));

  useEffect(() => {
    const wsClient = wsClientRef.current;

    // Subscribe to status changes
    const unsubscribeStatus = wsClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
      
      if (newStatus === 'connected' && onConnect) {
        onConnect();
      } else if (newStatus === 'disconnected' && onDisconnect) {
        onDisconnect();
      }
    });

    // Auto-connect
    if (autoConnect) {
      wsClient.connect();
    }

    return () => {
      unsubscribeStatus();
    };
  }, [autoConnect, onConnect, onDisconnect]);

  // Connection methods
  const connect = useCallback(() => {
    wsClientRef.current.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsClientRef.current.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    wsClientRef.current.disconnect();
    setTimeout(() => {
      wsClientRef.current.connect();
    }, 100);
  }, []);

  // Message sending methods
  const sendMessage = useCallback((chatId: string, message: Message): boolean => {
    return messageHandlerRef.current.sendMessage(chatId, message);
  }, []);

  const sendTypingIndicator = useCallback((chatId: string, isTyping: boolean): boolean => {
    return messageHandlerRef.current.sendTypingIndicator(chatId, isTyping);
  }, []);

  const sendMessageStatus = useCallback((messageId: string, status: 'delivered' | 'read'): boolean => {
    return messageHandlerRef.current.sendMessageStatus(messageId, status);
  }, []);

  const sendReaction = useCallback((messageId: string, emoji: string, action: 'add' | 'remove'): boolean => {
    return messageHandlerRef.current.sendReaction(messageId, emoji, action);
  }, []);

  const joinChat = useCallback((chatId: string): boolean => {
    return messageHandlerRef.current.joinChat(chatId);
  }, []);

  const leaveChat = useCallback((chatId: string): boolean => {
    return messageHandlerRef.current.leaveChat(chatId);
  }, []);

  // Typing indicator with debounce
  const sendTyping = useCallback((chatId: string) => {
    sendTypingIndicator(chatId, true);
    
    // Auto-stop typing after 3 seconds
    setTimeout(() => {
      sendTypingIndicator(chatId, false);
    }, 3000);
  }, [sendTypingIndicator]);

  return {
    // Status
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isReconnecting: status === 'reconnecting',
    
    // Connection control
    connect,
    disconnect,
    reconnect,
    
    // Message operations
    sendMessage,
    sendTypingIndicator,
    sendTyping,
    sendMessageStatus,
    sendReaction,
    joinChat,
    leaveChat,
  };
}

// Hook for chat-specific WebSocket operations
export function useChatWebSocket(chatId: string | null) {
  const { 
    isConnected, 
    sendTyping, 
    sendMessageStatus, 
    sendReaction,
    joinChat,
    leaveChat,
  } = useWebSocket();
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Join/leave chat when chatId changes
  useEffect(() => {
    if (!chatId || !isConnected) return;

    joinChat(chatId);

    return () => {
      leaveChat(chatId);
    };
  }, [chatId, isConnected, joinChat, leaveChat]);

  // Typing indicator with debounce
  const startTyping = useCallback(() => {
    if (!chatId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    sendTyping(chatId);
  }, [chatId, sendTyping]);

  // Mark messages as read
  const markAsRead = useCallback((messageId: string) => {
    if (isConnected) {
      sendMessageStatus(messageId, 'read');
    }
  }, [isConnected, sendMessageStatus]);

  // Add reaction
  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (isConnected) {
      sendReaction(messageId, emoji, 'add');
    }
  }, [isConnected, sendReaction]);

  // Remove reaction
  const removeReaction = useCallback((messageId: string) => {
    if (isConnected) {
      sendReaction(messageId, '', 'remove');
    }
  }, [isConnected, sendReaction]);

  return {
    isConnected,
    startTyping,
    markAsRead,
    addReaction,
    removeReaction,
  };
}

// Cleanup function for app logout
export function cleanupWebSocket(): void {
  resetMessageHandler();
  resetWebSocketClient();
}
