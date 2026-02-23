/**
 * Chat Hook
 * Provides chat operations for React components
 */

import { useCallback, useEffect, useState } from 'react';
import { useChatStore, useMessageStore, useUIStore, useAuthStore } from '../stores';
import { chatRepository } from '../../data/repositories';
import { logger } from '../../core/logger';
import { ChatEntity } from '../../domain/entities/Chat';
import { MessageEntity } from '../../domain/entities/Message';
import type { Chat, GroupChat } from '../../domain/entities/Chat';
import type { Message } from '../../domain/entities/Message';

interface UseChatOptions {
  chatId?: string;
  autoMarkAsRead?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { chatId, autoMarkAsRead = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentUser } = useAuthStore();
  const { getChatById, updateChat, deleteChat } = useChatStore();
  const { getMessagesByChatId, addMessage, updateMessage, deleteMessage } = useMessageStore();
  const { showToast } = useUIStore();

  const chat = chatId ? getChatById(chatId) : null;
  const messages = chatId ? getMessagesByChatId(chatId) : [];

  // Load chat data
  useEffect(() => {
    if (!chatId) return;

    const loadChat = async () => {
      setIsLoading(true);
      try {
        const chatData = await chatRepository.getById(chatId);
        if (chatData) {
          updateChat(chatId, chatData);
        }
      } catch (error) {
        logger.error('Failed to load chat', error as Error, 'useChat');
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
  }, [chatId, updateChat]);

  // Auto mark as read
  useEffect(() => {
    if (chatId && autoMarkAsRead && chat && chat.unreadCount > 0) {
      markAsRead();
    }
  }, [chatId, chat?.unreadCount, autoMarkAsRead]);

  // Send text message
  const sendMessage = useCallback(async (text: string, replyTo?: string) => {
    if (!chatId || !currentUser) return null;

    try {
      const message = MessageEntity.create({
        chatId,
        senderId: currentUser.id,
        type: 'text',
        text,
        replyTo,
      });

      // Add to local store immediately (optimistic)
      addMessage(message);

      // Save to repository
      await chatRepository.saveMessage(message);

      // Update chat last message
      const currentChat = getChatById(chatId);
      if (currentChat) {
        currentChat.updateLastMessage(message);
        updateChat(chatId, currentChat);
      }

      return message;
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to send message',
        duration: 3000,
      });
      return null;
    }
  }, [chatId, currentUser, addMessage, updateChat, getChatById, showToast]);

  // Send media message
  const sendMediaMessage = useCallback(async (
    type: 'image' | 'video' | 'audio' | 'document',
    uri: string,
    metadata?: { width?: number; height?: number; duration?: number; fileName?: string; fileSize?: number }
  ) => {
    if (!chatId || !currentUser) return null;

    try {
      const message = MessageEntity.create({
        chatId,
        senderId: currentUser.id,
        type,
        text: metadata?.fileName || '',
        attachment: {
          uri,
          type,
          width: metadata?.width,
          height: metadata?.height,
          duration: metadata?.duration,
          fileName: metadata?.fileName,
          fileSize: metadata?.fileSize,
        },
      });

      addMessage(message);
      await chatRepository.saveMessage(message);

      return message;
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to send media',
        duration: 3000,
      });
      return null;
    }
  }, [chatId, currentUser, addMessage, showToast]);

  // Delete message
  const deleteMessageById = useCallback(async (messageId: string) => {
    try {
      await chatRepository.deleteMessage(messageId);
      deleteMessage(messageId);
      showToast({
        type: 'success',
        message: 'Message deleted',
        duration: 2000,
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to delete message',
        duration: 3000,
      });
    }
  }, [deleteMessage, showToast]);

  // Mark as read
  const markAsRead = useCallback(async () => {
    if (!chatId) return;

    try {
      await chatRepository.markAsRead(chatId);
      const currentChat = getChatById(chatId);
      if (currentChat) {
        currentChat.markAsRead();
        updateChat(chatId, currentChat);
      }
    } catch (error) {
      logger.error('Failed to mark as read', error as Error, 'useChat');
    }
  }, [chatId, updateChat, getChatById]);

  // Pin/Unpin chat
  const togglePin = useCallback(async () => {
    if (!chatId) return;

    const currentChat = getChatById(chatId);
    if (!currentChat) return;

    try {
      if (currentChat.isPinned) {
        currentChat.unpin();
      } else {
        currentChat.pin();
      }
      await chatRepository.save(currentChat);
      updateChat(chatId, currentChat);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to update chat',
        duration: 3000,
      });
    }
  }, [chatId, updateChat, getChatById, showToast]);

  // Mute/Unmute chat
  const toggleMute = useCallback(async () => {
    if (!chatId) return;

    const currentChat = getChatById(chatId);
    if (!currentChat) return;

    try {
      if (currentChat.isMuted) {
        currentChat.unmute();
      } else {
        currentChat.mute();
      }
      await chatRepository.save(currentChat);
      updateChat(chatId, currentChat);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to update chat',
        duration: 3000,
      });
    }
  }, [chatId, updateChat, getChatById, showToast]);

  // Archive/Unarchive chat
  const toggleArchive = useCallback(async () => {
    if (!chatId) return;

    const currentChat = getChatById(chatId);
    if (!currentChat) return;

    try {
      if (currentChat.isArchived) {
        currentChat.unarchive();
      } else {
        currentChat.archive();
      }
      await chatRepository.save(currentChat);
      updateChat(chatId, currentChat);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to update chat',
        duration: 3000,
      });
    }
  }, [chatId, updateChat, getChatById, showToast]);

  // Delete chat
  const deleteChatById = useCallback(async () => {
    if (!chatId) return;

    try {
      await chatRepository.delete(chatId);
      deleteChat(chatId);
      showToast({
        type: 'success',
        message: 'Chat deleted',
        duration: 2000,
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to delete chat',
        duration: 3000,
      });
    }
  }, [chatId, deleteChat, showToast]);

  // Clear chat history
  const clearHistory = useCallback(async () => {
    if (!chatId) return;

    try {
      await chatRepository.clearHistory(chatId);
      showToast({
        type: 'success',
        message: 'History cleared',
        duration: 2000,
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to clear history',
        duration: 3000,
      });
    }
  }, [chatId, showToast]);

  return {
    // Data
    chat,
    messages,
    isLoading,

    // Actions
    sendMessage,
    sendMediaMessage,
    deleteMessage: deleteMessageById,
    markAsRead,
    togglePin,
    toggleMute,
    toggleArchive,
    deleteChat: deleteChatById,
    clearHistory,
  };
}

// Hook for group management
export function useGroupChat(chatId: string) {
  const { getChatById, updateChat } = useChatStore();
  const { showToast } = useUIStore();

  const chat = getChatById(chatId);
  const isGroup = chat?.type === 'group';
  const groupChat = isGroup ? (chat as GroupChat) : null;

  const addParticipant = useCallback(async (userId: string) => {
    if (!groupChat) return;

    try {
      await chatRepository.addParticipant(chatId, userId);
      groupChat.participantIds.push(userId);
      updateChat(chatId, groupChat);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to add participant',
        duration: 3000,
      });
    }
  }, [chatId, groupChat, updateChat, showToast]);

  const removeParticipant = useCallback(async (userId: string) => {
    if (!groupChat) return;

    try {
      await chatRepository.removeParticipant(chatId, userId);
      groupChat.participantIds = groupChat.participantIds.filter(id => id !== userId);
      groupChat.adminIds = groupChat.adminIds.filter(id => id !== userId);
      updateChat(chatId, groupChat);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to remove participant',
        duration: 3000,
      });
    }
  }, [chatId, groupChat, updateChat, showToast]);

  const makeAdmin = useCallback(async (userId: string) => {
    if (!groupChat) return;

    try {
      await chatRepository.makeAdmin(chatId, userId);
      if (!groupChat.adminIds.includes(userId)) {
        groupChat.adminIds.push(userId);
        updateChat(chatId, groupChat);
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to make admin',
        duration: 3000,
      });
    }
  }, [chatId, groupChat, updateChat, showToast]);

  const removeAdmin = useCallback(async (userId: string) => {
    if (!groupChat) return;

    try {
      await chatRepository.removeAdmin(chatId, userId);
      groupChat.adminIds = groupChat.adminIds.filter(id => id !== userId);
      updateChat(chatId, groupChat);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to remove admin',
        duration: 3000,
      });
    }
  }, [chatId, groupChat, updateChat, showToast]);

  const updateGroupInfo = useCallback(async (updates: Partial<GroupChat>) => {
    if (!groupChat) return;

    try {
      await chatRepository.updateGroupInfo(chatId, updates);
      Object.assign(groupChat, updates);
      updateChat(chatId, groupChat);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to update group info',
        duration: 3000,
      });
    }
  }, [chatId, groupChat, updateChat, showToast]);

  return {
    groupChat,
    isAdmin: (userId: string) => groupChat?.adminIds.includes(userId) ?? false,
    isParticipant: (userId: string) => groupChat?.participantIds.includes(userId) ?? false,
    addParticipant,
    removeParticipant,
    makeAdmin,
    removeAdmin,
    updateGroupInfo,
  };
}
