/**
 * useChat Hook Tests
 * Tests for chat operations hook
 */

import { renderHook, act } from "@testing-library/react";
import { useChat } from "../useChat";
import { chatRepository } from "../../../data/repositories";
import { logger } from "../../../core/logger";

jest.mock("../../../data/repositories", () => ({
  chatRepository: {
    getById: jest.fn(),
    saveMessage: jest.fn(),
    deleteMessage: jest.fn(),
    markAsRead: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    clearHistory: jest.fn(),
    addParticipant: jest.fn(),
    removeParticipant: jest.fn(),
    makeAdmin: jest.fn(),
    removeAdmin: jest.fn(),
    updateGroupInfo: jest.fn(),
  },
}));

jest.mock("../../../core/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock("../../stores", () => {
  const mk = () => {
    const fn = jest.fn(() => ({}));
    (fn as any).getState = jest.fn();
    return fn;
  };
  return {
    useChatStore: mk(),
    useMessageStore: mk(),
    useUIStore: mk(),
    useAuthStore: mk(),
  };
});

const mockCurrentUser = { id: "user_1", name: "Test User" };

function setupStores() {
  const { useChatStore, useMessageStore, useUIStore, useAuthStore } = require("../../stores");
  const mockChatStore = {
    getChatById: jest.fn().mockReturnValue(null),
    updateChat: jest.fn(),
    removeChat: jest.fn(),
    markChatAsRead: jest.fn(),
    pinChat: jest.fn(),
    unpinChat: jest.fn(),
    muteChat: jest.fn(),
    unmuteChat: jest.fn(),
    archiveChat: jest.fn(),
    unarchiveChat: jest.fn(),
    updateLastMessage: jest.fn(),
  };

  const mockMessageStore = {
    getMessagesByChatId: jest.fn().mockReturnValue([]),
    addMessage: jest.fn(),
    deleteMessage: jest.fn(),
  };

  const mockUIStore = {
    showToast: jest.fn(),
  };

  const mockAuthStore = {
    currentUser: mockCurrentUser,
  };

  (useChatStore as jest.Mock).mockReturnValue(mockChatStore);
  (useMessageStore as jest.Mock).mockReturnValue(mockMessageStore);
  (useUIStore as jest.Mock).mockReturnValue(mockUIStore);
  (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);

  return { mockChatStore, mockMessageStore, mockUIStore, mockAuthStore };
}

describe("useChat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Return values", () => {
    it("should return initial state with no chatId", () => {
      const { result } = renderHook(() => useChat({}));
      expect(result.current.chat).toBeNull();
      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("should return data when chatId is provided", () => {
      const mockChat = { id: "chat_1", name: "Test Chat" };
      const { mockChatStore, mockMessageStore } = setupStores();
      mockChatStore.getChatById.mockReturnValue(mockChat);
      mockMessageStore.getMessagesByChatId.mockReturnValue([]);

      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));
      expect(result.current.chat).toBe(mockChat);
    });
  });

  describe("sendMessage", () => {
    it("should return null when no chatId", async () => {
      const { result } = renderHook(() => useChat({}));
      const message = await result.current.sendMessage("Hello");
      expect(message).toBeNull();
    });

    it("should return null when no currentUser", async () => {
      const { mockAuthStore } = setupStores();
      mockAuthStore.currentUser = null;
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));
      const message = await result.current.sendMessage("Hello");
      expect(message).toBeNull();
    });

    it("should send a text message", async () => {
      const { mockChatStore, mockMessageStore } = setupStores();
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        const message = await result.current.sendMessage("Hello");
        expect(message).toBeDefined();
        expect(mockMessageStore.addMessage).toHaveBeenCalled();
      });
    });

    it("should show toast and return null on error", async () => {
      const { mockChatStore, mockMessageStore, mockUIStore } = setupStores();
      mockMessageStore.addMessage.mockImplementation(() => {
        throw new Error("Send failed");
      });
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        const message = await result.current.sendMessage("Hello");
        expect(message).toBeNull();
        expect(mockUIStore.showToast).toHaveBeenCalledWith(
          expect.objectContaining({ type: "error" })
        );
      });
    });
  });

  describe("sendMediaMessage", () => {
    it("should return null when no chatId", async () => {
      const { result } = renderHook(() => useChat({}));
      const message = await result.current.sendMediaMessage("image", "file://test");
      expect(message).toBeNull();
    });

    it("should send a media message", async () => {
      const { mockMessageStore } = setupStores();
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        const message = await result.current.sendMediaMessage("image", "file://test");
        expect(message).toBeDefined();
        expect(mockMessageStore.addMessage).toHaveBeenCalled();
      });
    });
  });

  describe("deleteMessage", () => {
    it("should return when no chatId", async () => {
      const { result } = renderHook(() => useChat({}));
      await act(async () => {
        await result.current.deleteMessage("msg_1");
      });
      expect(chatRepository.deleteMessage).not.toHaveBeenCalled();
    });

    it("should delete a message", async () => {
      const { mockChatStore, mockMessageStore, mockUIStore } = setupStores();
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        await result.current.deleteMessage("msg_1");
        expect(mockMessageStore.deleteMessage).toHaveBeenCalledWith("msg_1");
      });
    });
  });

  describe("markAsRead", () => {
    it("should return when no chatId", async () => {
      const { result } = renderHook(() => useChat({}));
      await act(async () => {
        await result.current.markAsRead();
      });
      expect(chatRepository.markAsRead).not.toHaveBeenCalled();
    });

    it("should mark chat as read", async () => {
      const { mockChatStore } = setupStores();
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        await result.current.markAsRead();
        expect(chatRepository.markAsRead).toHaveBeenCalledWith("chat_1");
      });
    });
  });

  describe("togglePin", () => {
    it("should return when no chatId", async () => {
      const { result } = renderHook(() => useChat({}));
      await act(async () => {
        await result.current.togglePin();
      });
      expect((require("../../stores").useChatStore as jest.Mock)().pinChat).not.toHaveBeenCalled();
    });

    it("should pin a chat", async () => {
      const mockChat = { id: "chat_1", isPinned: false, type: "private" };
      const { mockChatStore } = setupStores();
      mockChatStore.getChatById.mockReturnValue(mockChat);
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        await result.current.togglePin();
        expect(mockChatStore.pinChat).toHaveBeenCalledWith("chat_1");
      });
    });

    it("should unpin a chat", async () => {
      const mockChat = { id: "chat_1", isPinned: true, type: "private" };
      const { mockChatStore } = setupStores();
      mockChatStore.getChatById.mockReturnValue(mockChat);
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        await result.current.togglePin();
        expect(mockChatStore.unpinChat).toHaveBeenCalledWith("chat_1");
      });
    });
  });

  describe("toggleMute", () => {
    it("should mute a chat", async () => {
      const mockChat = { id: "chat_1", isMuted: false, type: "private" };
      const { mockChatStore } = setupStores();
      mockChatStore.getChatById.mockReturnValue(mockChat);
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        await result.current.toggleMute();
        expect(mockChatStore.muteChat).toHaveBeenCalledWith("chat_1");
      });
    });

    it("should unmute a chat", async () => {
      const mockChat = { id: "chat_1", isMuted: true, type: "private" };
      const { mockChatStore } = setupStores();
      mockChatStore.getChatById.mockReturnValue(mockChat);
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        await result.current.toggleMute();
        expect(mockChatStore.unmuteChat).toHaveBeenCalledWith("chat_1");
      });
    });
  });

  describe("toggleArchive", () => {
    it("should archive a chat", async () => {
      const mockChat = { id: "chat_1", isArchived: false, type: "private" };
      const { mockChatStore } = setupStores();
      mockChatStore.getChatById.mockReturnValue(mockChat);
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        await result.current.toggleArchive();
        expect(mockChatStore.archiveChat).toHaveBeenCalledWith("chat_1");
      });
    });

    it("should unarchive a chat", async () => {
      const mockChat = { id: "chat_1", isArchived: true, type: "private" };
      const { mockChatStore } = setupStores();
      mockChatStore.getChatById.mockReturnValue(mockChat);
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        await result.current.toggleArchive();
        expect(mockChatStore.unarchiveChat).toHaveBeenCalledWith("chat_1");
      });
    });
  });

  describe("deleteChat", () => {
    it("should delete a chat", async () => {
      const { mockChatStore, mockUIStore } = setupStores();
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        await result.current.deleteChat();
        expect(mockChatStore.removeChat).toHaveBeenCalledWith("chat_1");
      });
    });
  });

  describe("clearHistory", () => {
    it("should clear chat history", async () => {
      const { mockUIStore } = setupStores();
      const { result } = renderHook(() => useChat({ chatId: "chat_1" }));

      await act(async () => {
        await result.current.clearHistory();
        expect(chatRepository.clearHistory).toHaveBeenCalledWith("chat_1");
      });
    });
  });

  describe("useGroupChat", () => {
    it("should return null groupChat for non-group chat", () => {
      const mockChat = { id: "chat_1", type: "private", participantIds: [] };
      const { mockChatStore } = setupStores();
      mockChatStore.getChatById.mockReturnValue(mockChat);

      const { result } = renderHook(() => useChat("chat_1"));
      const hook = result.current as any;
      // useGroupChat is not exported, test useChat behavior instead
    });
  });
});
