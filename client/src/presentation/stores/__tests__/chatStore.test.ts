/**
 * Unit tests for presentation chatStore (normalized entity state)
 */

import { useChatStore } from "../chatStore";
import { ChatEntity } from "@domain/entities/Chat";
import { MessageEntity } from "@domain/entities/Message";

const emptyEntityState = { ids: [], entities: {} };

describe("chatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      chats: emptyEntityState,
      activeChatId: null,
      isLoading: false,
      error: null,
    });
  });

  it("initializes with empty normalized chat state", () => {
    const state = useChatStore.getState();
    expect(state.chats.ids).toEqual([]);
    expect(state.chats.entities).toEqual({});
    expect(state.activeChatId).toBeNull();
  });

  it("adds and retrieves chats", () => {
    const chat = ChatEntity.createPrivate("user-2", "user-1");
    useChatStore.getState().addChat(chat);

    const stored = useChatStore.getState().getChatById(chat.id);
    expect(stored?.id).toBe(chat.id);
    expect(useChatStore.getState().getAllChats()).toHaveLength(1);
  });

  it("pins, mutes, archives, and marks chats as read", () => {
    const chat = ChatEntity.createPrivate("user-2", "user-1");
    useChatStore.getState().addChat(chat);

    useChatStore.getState().pinChat(chat.id);
    expect(useChatStore.getState().getChatById(chat.id)?.isPinned).toBe(true);

    useChatStore.getState().muteChat(chat.id);
    expect(useChatStore.getState().getChatById(chat.id)?.isMuted).toBe(true);

    useChatStore.getState().archiveChat(chat.id);
    expect(useChatStore.getState().getChatById(chat.id)?.isArchived).toBe(true);

    useChatStore.getState().markChatAsRead(chat.id);
    expect(useChatStore.getState().getChatById(chat.id)?.unreadCount).toBe(0);
  });

  it("updates last message on a chat", () => {
    const chat = ChatEntity.createPrivate("user-2", "user-1");
    useChatStore.getState().addChat(chat);

    const message = MessageEntity.create({
      chatId: chat.id,
      senderId: "user-1",
      type: "text",
      text: "Hello",
    });

    useChatStore.getState().updateLastMessage(chat.id, message);
    expect(useChatStore.getState().getChatById(chat.id)?.lastMessage?.text).toBe("Hello");
  });
});
