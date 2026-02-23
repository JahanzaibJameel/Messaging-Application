/**
 * WebSocket Message Handler
 * Processes incoming WebSocket messages and updates stores
 */

import type { WebSocketClient } from './WebSocketClient';
import { logger } from '../../core/logger';
import { useMessageStore, useChatStore, useUIStore } from '../../presentation/stores';
import type { Message } from '../../domain/entities/Message';
import type { Chat, GroupChat } from '../../domain/entities/Chat';
import type { User } from '../../domain/entities/User';

// Message Types
interface NewMessagePayload {
  id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  text?: string;
  attachment?: {
    uri: string;
    thumbnail?: string;
    width?: number;
    height?: number;
    duration?: number;
    fileName?: string;
    fileSize?: number;
  };
  timestamp: string;
  replyTo?: string;
}

interface MessageStatusPayload {
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
}

interface TypingPayload {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

interface UserStatusPayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface ReactionPayload {
  messageId: string;
  userId: string;
  emoji: string;
  action: 'add' | 'remove';
}

interface ChatUpdatePayload {
  chatId: string;
  updates: Partial<Chat>;
}

export class MessageHandler {
  private wsClient: WebSocketClient;
  private unsubscribeHandlers: (() => void)[] = [];

  constructor(wsClient: WebSocketClient) {
    this.wsClient = wsClient;
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // New message received
    this.unsubscribeHandlers.push(
      this.wsClient.onMessage('new_message', (payload: unknown) => {
        this.handleNewMessage(payload as NewMessagePayload);
      })
    );

    // Message status update
    this.unsubscribeHandlers.push(
      this.wsClient.onMessage('message_status', (payload: unknown) => {
        this.handleMessageStatus(payload as MessageStatusPayload);
      })
    );

    // Typing indicator
    this.unsubscribeHandlers.push(
      this.wsClient.onMessage('typing', (payload: unknown) => {
        this.handleTyping(payload as TypingPayload);
      })
    );

    // User status change
    this.unsubscribeHandlers.push(
      this.wsClient.onMessage('user_status', (payload: unknown) => {
        this.handleUserStatus(payload as UserStatusPayload);
      })
    );

    // Reaction update
    this.unsubscribeHandlers.push(
      this.wsClient.onMessage('reaction', (payload: unknown) => {
        this.handleReaction(payload as ReactionPayload);
      })
    );

    // Chat update
    this.unsubscribeHandlers.push(
      this.wsClient.onMessage('chat_update', (payload: unknown) => {
        this.handleChatUpdate(payload as ChatUpdatePayload);
      })
    );

    // User joined group
    this.unsubscribeHandlers.push(
      this.wsClient.onMessage('user_joined', (payload: unknown) => {
        this.handleUserJoined(payload as { chatId: string; user: User });
      })
    );

    // User left group
    this.unsubscribeHandlers.push(
      this.wsClient.onMessage('user_left', (payload: unknown) => {
        this.handleUserLeft(payload as { chatId: string; userId: string });
      })
    );
  }

  private handleNewMessage(payload: NewMessagePayload): void {
    const messageStore = useMessageStore.getState();
    const chatStore = useChatStore.getState();
    const uiStore = useUIStore.getState();

    // Create message entity
    const message: Message = {
      id: payload.id,
      chatId: payload.chatId,
      senderId: payload.senderId,
      type: payload.type,
      text: payload.text,
      attachment: payload.attachment,
      timestamp: new Date(payload.timestamp),
      status: 'delivered',
      replyTo: payload.replyTo,
      reactions: [],
      edited: false,
      localOnly: false,
    };

    // Add to store
    messageStore.addMessage(message);

    // Update chat's last message
    chatStore.updateLastMessage(payload.chatId, message);

    // Increment unread count if not current chat
    const currentChatId = chatStore.activeChatId;
    if (currentChatId !== payload.chatId) {
      const chat = chatStore.getChatById(payload.chatId);
      if (chat && !chat.isMuted) {
        chatStore.updateChat(payload.chatId, {
          unreadCount: chat.unreadCount + 1,
        });

        // Show notification
        uiStore.showToast({
          type: 'info',
          message: 'New message received',
          duration: 3000,
        });
      }
    }
  }

  private handleMessageStatus(payload: MessageStatusPayload): void {
    const messageStore = useMessageStore.getState();

    messageStore.updateMessage(payload.messageId, {
      status: payload.status,
    });
  }

  private handleTyping(payload: TypingPayload): void {
    const messageStore = useMessageStore.getState();

    messageStore.setTyping(payload.chatId, payload.userId, payload.isTyping);
  }

  private handleUserStatus(payload: UserStatusPayload): void {
    // This would update user store when implemented
    logger.info('User status changed', 'MessageHandler', payload);
  }

  private handleReaction(payload: ReactionPayload): void {
    const messageStore = useMessageStore.getState();

    if (payload.action === 'add') {
      messageStore.addReaction(payload.messageId, payload.userId, payload.emoji);
    } else {
      messageStore.removeReaction(payload.messageId, payload.userId);
    }
  }

  private handleChatUpdate(payload: ChatUpdatePayload): void {
    const chatStore = useChatStore.getState();

    chatStore.updateChat(payload.chatId, payload.updates);
  }

  private handleUserJoined(payload: { chatId: string; user: User }): void {
    const chatStore = useChatStore.getState();
    const uiStore = useUIStore.getState();

    const chat = chatStore.getChatById(payload.chatId);
    if (chat && chat.type === 'group') {
      const groupChat = chat as GroupChat;
      if (!groupChat.participantIds.includes(payload.user.id)) {
        groupChat.participantIds.push(payload.user.id);
        chatStore.updateChat(payload.chatId, {
          participantIds: groupChat.participantIds,
        });
      }
    }

    uiStore.showToast({
      type: 'info',
      message: `${payload.user.name} joined the group`,
      duration: 3000,
    });
  }

  private handleUserLeft(payload: { chatId: string; userId: string }): void {
    const chatStore = useChatStore.getState();

    const chat = chatStore.getChatById(payload.chatId);
    if (chat && chat.type === 'group') {
      const groupChat = chat as GroupChat;
      groupChat.participantIds = groupChat.participantIds.filter(
        (id) => id !== payload.userId
      );
      chatStore.updateChat(payload.chatId, {
        participantIds: groupChat.participantIds,
      });
    }
  }

  // Send methods
  sendMessage(chatId: string, message: Message): boolean {
    return this.wsClient.send({
      type: 'send_message',
      payload: {
        chatId,
        messageId: message.id,
        type: message.type,
        text: message.text,
        attachment: message.attachment,
        replyTo: message.replyTo,
      },
      timestamp: new Date().toISOString(),
    });
  }

  sendTypingIndicator(chatId: string, isTyping: boolean): boolean {
    return this.wsClient.send({
      type: 'typing',
      payload: {
        chatId,
        isTyping,
      },
      timestamp: new Date().toISOString(),
    });
  }

  sendMessageStatus(messageId: string, status: 'delivered' | 'read'): boolean {
    return this.wsClient.send({
      type: 'message_status',
      payload: {
        messageId,
        status,
      },
      timestamp: new Date().toISOString(),
    });
  }

  sendReaction(messageId: string, emoji: string, action: 'add' | 'remove'): boolean {
    return this.wsClient.send({
      type: 'reaction',
      payload: {
        messageId,
        emoji,
        action,
      },
      timestamp: new Date().toISOString(),
    });
  }

  joinChat(chatId: string): boolean {
    return this.wsClient.send({
      type: 'join_chat',
      payload: { chatId },
      timestamp: new Date().toISOString(),
    });
  }

  leaveChat(chatId: string): boolean {
    return this.wsClient.send({
      type: 'leave_chat',
      payload: { chatId },
      timestamp: new Date().toISOString(),
    });
  }

  // Cleanup
  destroy(): void {
    this.unsubscribeHandlers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeHandlers = [];
  }
}

// Singleton instance
let messageHandlerInstance: MessageHandler | null = null;

export function getMessageHandler(wsClient?: WebSocketClient): MessageHandler {
  if (!messageHandlerInstance) {
    if (!wsClient) {
      throw new Error('WebSocketClient required for MessageHandler initialization');
    }
    messageHandlerInstance = new MessageHandler(wsClient);
  }
  return messageHandlerInstance;
}

export function resetMessageHandler(): void {
  if (messageHandlerInstance) {
    messageHandlerInstance.destroy();
    messageHandlerInstance = null;
  }
}
