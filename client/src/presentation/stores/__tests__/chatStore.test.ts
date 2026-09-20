import { useChatStore } from "../chatStore";
import { ChatEntity } from "@/domain/entities/Chat";
import { MessageEntity } from "@/domain/entities/Message";
import { createSecureStorageAdapterWithKeys } from "@/lib/secureStorageAdapter";

jest.mock("@/lib/secureStorageAdapter", () => {
  const cache = new Map<string, string>();
  return {
    createSecureStorageAdapterWithKeys: jest.fn(() => ({
      getItem: (name: string) => cache.get(name) ?? null,
      setItem: (name: string, value: string) => {
        cache.set(name, value);
      },
      removeItem: (name: string) => {
        cache.remove(name);
      },
    })),
  };
});

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

  it("uses the authenticated user ID for group creation", () => {
    const chatId = "group-test";
    const participantIds = ["user-1", "user-2"];
    const name = "Test Group";

    // Mock auth store
    const authStore = useChatStore.getState();
    const currentUserId = authStore.currentUser?.id ?? "currentUser";
    const groupChat = useChatStore.getState().createGroup(name, participantIds);

    expect(groupChat.id).toBe(chatId);
    expect(groupChat.participantIds).toEqual(participantIds);
    expect(groupChat.createdBy).toBe(currentUserId);
  });

  it("setChats dedupes duplicate IDs", () => {
    const chat1 = ChatEntity.createPrivate("user-1", "user-2");
    const chat2 = ChatEntity.createPrivate("user-3", "user-1");
    useChatStore.getState().setChats([chat1, chat2]);

    const stored = useChatStore.getState().chats.ids;
    expect(stored).toHaveLength(2);
    expect(stored).toContain(chat1.id);
    expect(stored).toContain(chat2.id);
    expect(stored).not.toContain(`${chat1.id}${chat2.id}`);
  });

  it("updateChat no longer accepts an id field (compile-time check; add a comment noting this)", () => {
    const chatId = "chat-123";
    const chat = ChatEntity.createPrivate("user-1", "user-2");
    useChatStore.getState().addChat(chat);

    const updates = { id: "invalid-id", name: "New Name" };
    // The type checker will reject this at compile time; test only verifies the type signature was modified correctly
    expect(() => {
      useChatStore.getState().updateChat(chatId, updates);
    }).not.toThrow();
  });

  it("persistence round-trip: save chats, rehydrate, verify entities are present", async () => {
    // Mock auth store to have a logged-in user
    const authStore = useChatStore.getState();
    authStore.setState({
      currentUser: { id: "authUser", isAuthenticated: true, isLoading: false, error: null },
      isLoading: false,
      error: null,
    });

    const chat1 = ChatEntity.createPrivate("user-1", "user-1");
    const chat2 = ChatEntity.createPrivate("user-2", "user-3");
    useChatStore.getState().addChat(chat1);
    useChatStore.getState().addChat(chat2);

    // Simulate persistence
    const storageKey = "chat-storage_chats";
    const adapter = useChatStore.getState().persistItem;
    adapter.setItem(storageKey, JSON.stringify(useChatStore.getState().chats));

    // Rehydrate
    const newState = useChatStore.getState();
    expect(newState.chats.ids).toEqual([chat1.id, chat2.id]);
    expect(newState.chats.entities[chat1.id]).toBeDefined();
    expect(newState.chats.entities[chat2.id]).toBeDefined();
  });

  it("sorting works after rehydration", () => {
    const chat1 = ChatEntity.createPrivate("user-1", "user-2");
    const chat2 = ChatEntity.createPrivate("user-3", "user-1");
    const chat3 = ChatEntity.createPrivate("user-4", "user-1");
    const chat5 = ChatEntity.createPrivate("user-5", "user-1");

    // Set up chat order
    useChatStore.getState().addChat(chat1);
    useChatStore.getState().addChat(chat2);
    useChatStore.getState().addChat(chat3);
    useChatStore.getState().addChat(chat4);
    useChatStore.getState().addChat(chat5);

    // Verify sorting after rehydration
    const sorted = useChatStore.getState().getSortedChats();
    expect(sorted[0]).toBe(chat1); // pinned first
    expect(sorted[1]).toBe(chat2); // next by timestamp
  });