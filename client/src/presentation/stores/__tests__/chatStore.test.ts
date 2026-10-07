import type { Chat } from "@/domain/entities/Chat";
import { ChatEntity } from "@/domain/entities/Chat";
import type { Message } from "@/domain/entities/Message";
import { useChatStore } from "../chatStore";
import { useAuthStore } from "../authStore";

jest.mock("../authStore", () => ({
  useAuthStore: { getState: jest.fn(() => ({ currentUser: null })) },
}));

jest.mock("@/lib/secureStorageAdapter", () => {
  const cache = new Map<string, string>();
  const control = { failReads: false };
  return {
    __storageCache: cache,
    __storageControl: control,
    createSecureStorageAdapterWithKeys: jest.fn(() => ({
      getItem: (name: string) => {
        if (control.failReads) {
          return Promise.reject(new Error("secure storage unavailable"));
        }
        return cache.get(name) ?? null;
      },
      setItem: (name: string, value: string) => {
        cache.set(name, value);
      },
      removeItem: (name: string) => {
        cache.delete(name);
      },
    })),
  };
});

const { __storageCache: storageCache, __storageControl: storageControl } = jest.requireMock(
  "@/lib/secureStorageAdapter"
) as {
  __storageCache: Map<string, string>;
  __storageControl: { failReads: boolean };
};

type PersistApi = {
  rehydrate: () => Promise<void> | void;
  getOptions: () => { name: string };
};

const persistApi = (): PersistApi => (useChatStore as unknown as { persist: PersistApi }).persist;

const STORAGE_KEY = persistApi().getOptions().name;

const BASE = new Date("2024-01-01T00:00:00.000Z");

const authGetState = useAuthStore.getState as unknown as jest.Mock;

function mockCurrentUser(user: { id: string } | null): void {
  authGetState.mockReturnValue({ currentUser: user });
}

function plainChat(id: string, overrides: Partial<Chat> = {}): Chat {
  return {
    id,
    type: "private",
    participantIds: ["user-1", "user-2"],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    lastActivity: new Date(BASE),
    createdAt: new Date(BASE),
    updatedAt: new Date(BASE),
    ...overrides,
  };
}

function makeChat(id: string, overrides: Partial<Chat> = {}): ChatEntity {
  return new ChatEntity({
    id,
    type: "private",
    participantIds: ["user-1", "user-2"],
    createdAt: new Date(BASE),
    updatedAt: new Date(BASE),
    lastActivity: new Date(BASE),
    ...overrides,
  });
}

function makeGroupChat(id: string, overrides: Partial<Chat> = {}): ChatEntity {
  return new ChatEntity({
    id,
    type: "group",
    participantIds: ["user-1", "user-2"],
    name: "Original name",
    adminIds: ["user-1"],
    createdBy: "user-1",
    createdAt: new Date(BASE),
    updatedAt: new Date(BASE),
    lastActivity: new Date(BASE),
    ...overrides,
  });
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-1",
    chatId: "chat-1",
    senderId: "user-1",
    type: "text",
    text: "hello",
    timestamp: new Date(BASE),
    status: "sent",
    reactions: [],
    edited: false,
    ...overrides,
  };
}

function add(...chats: Chat[]): void {
  for (const chat of chats) {
    useChatStore.getState().addChat(chat);
  }
}

/**
 * Simulates an app cold start: memory is cleared, the storage slot is replaced
 * with `snapshot` (or emptied), and the store rehydrates from it.
 */
async function coldStart(snapshot: string | null): Promise<void> {
  useChatStore.setState({
    chats: { ids: [], entities: {} },
    activeChatId: null,
  });

  if (snapshot === null) {
    storageCache.delete(STORAGE_KEY);
  } else {
    storageCache.set(STORAGE_KEY, snapshot);
  }

  await persistApi().rehydrate();
}

function snapshot(): string {
  const raw = storageCache.get(STORAGE_KEY);
  if (raw === undefined) {
    throw new Error(`Nothing persisted under the store key "${STORAGE_KEY}"`);
  }
  return raw;
}

describe("chatStore", () => {
  beforeEach(() => {
    storageCache.clear();
    storageControl.failReads = false;
    authGetState.mockReset();
    mockCurrentUser(null);

    useChatStore.setState({
      chats: { ids: [], entities: {} },
      activeChatId: null,
      isLoading: false,
      error: null,
    });
  });

  describe("initial state", () => {
    it("initializes with empty normalized chat state", () => {
      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual([]);
      expect(state.chats.entities).toEqual({});
      expect(state.activeChatId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("persists under a single storage key", () => {
      expect(STORAGE_KEY).toBe("chat-storage_chats");
    });
  });

  describe("setChats", () => {
    it("replaces the collection and normalizes the entities", () => {
      const a = plainChat("a");
      const b = plainChat("b");

      useChatStore.getState().setChats([a, b]);

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual(["a", "b"]);
      expect(Object.keys(state.chats.entities)).toEqual(["a", "b"]);
      expect(state.getAllChats().map((c) => c.id)).toEqual(["a", "b"]);
      expect(state.getChatById("a")).toEqual(a);
    });

    it("drops chats that were not part of the incoming list", () => {
      add(makeChat("stale"));

      useChatStore.getState().setChats([plainChat("fresh")]);

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual(["fresh"]);
      expect(state.getChatById("stale")).toBeUndefined();
    });

    it("clears the collection when given an empty list", () => {
      add(makeChat("a"), makeChat("b"));

      useChatStore.getState().setChats([]);

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual([]);
      expect(state.chats.entities).toEqual({});
      expect(state.getAllChats()).toEqual([]);
    });

    it("FIX: dedupes duplicate ids instead of storing them twice", () => {
      useChatStore
        .getState()
        .setChats([
          plainChat("a", { name: "first a" }),
          plainChat("a", { name: "second a" }),
          plainChat("b"),
        ]);

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual(["a", "b"]);
      expect(state.getAllChats()).toHaveLength(2);
      expect(state.getAllChats().map((c) => c.id)).toEqual(["a", "b"]);
    });

    it("keeps the last payload for a repeated id", () => {
      useChatStore
        .getState()
        .setChats([plainChat("a", { unreadCount: 1 }), plainChat("a", { unreadCount: 7 })]);

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual(["a"]);
      expect(state.getChatById("a")?.unreadCount).toBe(7);
    });
  });

  describe("addChat", () => {
    it("appends a new chat to ids and entities", () => {
      const chat = makeChat("chat-new");

      useChatStore.getState().addChat(chat);

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual(["chat-new"]);
      expect(state.getChatById("chat-new")).toEqual(chat);
      expect(state.getAllChats()).toHaveLength(1);
    });

    it("updates an existing chat without duplicating its id", () => {
      add(makeGroupChat("chat-dup", { unreadCount: 1 }));

      useChatStore
        .getState()
        .addChat(makeGroupChat("chat-dup", { unreadCount: 4, name: "renamed" }));

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual(["chat-dup"]);
      expect(state.getAllChats()).toHaveLength(1);
      expect(state.getChatById("chat-dup")?.unreadCount).toBe(4);
      expect(state.getChatById("chat-dup")?.name).toBe("renamed");
    });

    it("keeps insertion order across several chats", () => {
      add(makeChat("first"), makeChat("second"), makeChat("third"));

      expect(
        useChatStore
          .getState()
          .getAllChats()
          .map((c) => c.id)
      ).toEqual(["first", "second", "third"]);
    });
  });

  describe("updateChat", () => {
    it("merges updates, keeps the id, and stamps updatedAt", () => {
      add(makeChat("chat-u", { unreadCount: 2 }));
      const before = Date.now();

      useChatStore.getState().updateChat("chat-u", { unreadCount: 9, name: "Updated" });

      const chat = useChatStore.getState().getChatById("chat-u");
      expect(chat?.unreadCount).toBe(9);
      expect(chat?.name).toBe("Updated");
      expect(chat?.id).toBe("chat-u");
      expect(chat?.createdAt).toEqual(BASE);
      expect(chat?.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it("FIX: the updates parameter excludes id, so an injected id is discarded", () => {
      add(makeChat("chat-typed"));

      // Type-level guarantee: `updates` is `Partial<Omit<Chat, "id">>`, so passing
      // an inline object literal containing `id` is a compile error. The
      // `@ts-expect-error` below fails `npm run type-check` if that `Omit` is
      // ever removed from the signature. At runtime the store must still keep
      // the original id.
      // @ts-expect-error "id" is deliberately excluded from updateChat updates.
      useChatStore.getState().updateChat("chat-typed", { id: "injected-id", name: "Renamed" });

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual(["chat-typed"]);
      expect(state.getChatById("chat-typed")?.id).toBe("chat-typed");
      expect(state.getChatById("chat-typed")?.name).toBe("Renamed");
      expect(state.getChatById("injected-id")).toBeUndefined();
    });

    it("does nothing for an unknown chat id", () => {
      add(makeChat("chat-known"));

      useChatStore.getState().updateChat("chat-missing", { unreadCount: 3 });

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual(["chat-known"]);
      expect(state.getChatById("chat-missing")).toBeUndefined();
    });
  });

  describe("removeChat", () => {
    it("removes the id and the entity while keeping other chats", () => {
      add(makeChat("keep"), makeChat("drop"), makeChat("keep-too"));

      useChatStore.getState().removeChat("drop");

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual(["keep", "keep-too"]);
      expect(state.getChatById("drop")).toBeUndefined();
      expect(Object.keys(state.chats.entities)).not.toContain("drop");
      expect(state.getAllChats()).toHaveLength(2);
    });

    it("leaves the collection untouched for an unknown chat id", () => {
      add(makeChat("keep"));

      useChatStore.getState().removeChat("never-existed");

      const state = useChatStore.getState();
      expect(state.chats.ids).toEqual(["keep"]);
      expect(state.getChatById("keep")).toBeDefined();
    });

    it("does not disturb activeChatId", () => {
      add(makeChat("active"));
      useChatStore.getState().setActiveChat("active");

      useChatStore.getState().removeChat("active");

      expect(useChatStore.getState().activeChatId).toBe("active");
    });
  });

  describe("setActiveChat", () => {
    it("sets and clears the active chat", () => {
      add(makeChat("a"), makeChat("b"));

      useChatStore.getState().setActiveChat("b");
      expect(useChatStore.getState().activeChatId).toBe("b");

      useChatStore.getState().setActiveChat("a");
      expect(useChatStore.getState().activeChatId).toBe("a");

      useChatStore.getState().setActiveChat(null);
      expect(useChatStore.getState().activeChatId).toBeNull();
    });
  });

  describe("chat flag actions", () => {
    it("pinChat marks the chat as pinned and stamps updatedAt", () => {
      add(makeChat("chat-pin"));

      useChatStore.getState().pinChat("chat-pin");

      const chat = useChatStore.getState().getChatById("chat-pin");
      expect(chat?.isPinned).toBe(true);
      expect(chat?.updatedAt.getTime()).toBeGreaterThan(BASE.getTime());
    });

    it("unpinChat clears the pinned flag", () => {
      add(makeChat("chat-unpin", { isPinned: true }));

      useChatStore.getState().unpinChat("chat-unpin");

      const chat = useChatStore.getState().getChatById("chat-unpin");
      expect(chat?.isPinned).toBe(false);
      expect(chat?.updatedAt.getTime()).toBeGreaterThan(BASE.getTime());
    });

    it("muteChat marks the chat as muted and stamps updatedAt", () => {
      add(makeChat("chat-mute"));

      useChatStore.getState().muteChat("chat-mute");

      const chat = useChatStore.getState().getChatById("chat-mute");
      expect(chat?.isMuted).toBe(true);
      expect(chat?.updatedAt.getTime()).toBeGreaterThan(BASE.getTime());
    });

    it("unmuteChat clears the muted flag", () => {
      add(makeChat("chat-unmute", { isMuted: true }));

      useChatStore.getState().unmuteChat("chat-unmute");

      const chat = useChatStore.getState().getChatById("chat-unmute");
      expect(chat?.isMuted).toBe(false);
      expect(chat?.updatedAt.getTime()).toBeGreaterThan(BASE.getTime());
    });

    it("archiveChat hides the chat from getSortedChats", () => {
      add(makeChat("chat-archive"));

      useChatStore.getState().archiveChat("chat-archive");

      const state = useChatStore.getState();
      expect(state.getChatById("chat-archive")?.isArchived).toBe(true);
      expect(state.getSortedChats()).toEqual([]);
      expect(state.getAllChats()).toHaveLength(1);
    });

    it("unarchiveChat brings the chat back into getSortedChats", () => {
      add(makeChat("chat-unarchive", { isArchived: true }));

      useChatStore.getState().unarchiveChat("chat-unarchive");

      const state = useChatStore.getState();
      expect(state.getChatById("chat-unarchive")?.isArchived).toBe(false);
      expect(state.getSortedChats().map((c) => c.id)).toEqual(["chat-unarchive"]);
    });

    it("markChatAsRead zeroes the unread count", () => {
      add(makeChat("chat-read", { unreadCount: 12 }));

      useChatStore.getState().markChatAsRead("chat-read");

      const chat = useChatStore.getState().getChatById("chat-read");
      expect(chat?.unreadCount).toBe(0);
      expect(chat?.updatedAt.getTime()).toBeGreaterThan(BASE.getTime());
    });

    it("leaves other chats untouched when one chat is flagged", () => {
      add(makeChat("target"), makeChat("bystander", { unreadCount: 3 }));

      useChatStore.getState().pinChat("target");
      useChatStore.getState().muteChat("target");
      useChatStore.getState().archiveChat("target");
      useChatStore.getState().markChatAsRead("target");

      const bystander = useChatStore.getState().getChatById("bystander");
      expect(bystander?.isPinned).toBe(false);
      expect(bystander?.isMuted).toBe(false);
      expect(bystander?.isArchived).toBe(false);
      expect(bystander?.unreadCount).toBe(3);
    });

    it("ignores unknown ids for every flag action", () => {
      add(makeChat("present"));
      const before = useChatStore.getState().getChatById("present");

      const state = useChatStore.getState();
      expect(() => {
        state.pinChat("ghost");
        state.unpinChat("ghost");
        state.muteChat("ghost");
        state.unmuteChat("ghost");
        state.archiveChat("ghost");
        state.unarchiveChat("ghost");
        state.markChatAsRead("ghost");
      }).not.toThrow();

      const after = useChatStore.getState();
      expect(after.chats.ids).toEqual(["present"]);
      expect(after.getChatById("ghost")).toBeUndefined();
      expect(after.getChatById("present")).toEqual(before);
    });
  });

  describe("updateLastMessage", () => {
    it("stores the message and stamps updatedAt", () => {
      add(makeChat("chat-msg"));
      const message = makeMessage({ chatId: "chat-msg", text: "Hello" });

      useChatStore.getState().updateLastMessage("chat-msg", message);

      const chat = useChatStore.getState().getChatById("chat-msg");
      expect(chat?.lastMessage?.text).toBe("Hello");
      expect(chat?.lastMessage?.id).toBe(message.id);
      expect(chat?.updatedAt.getTime()).toBeGreaterThan(BASE.getTime());
    });

    it("replaces a previous last message", () => {
      add(makeChat("chat-msg", { lastMessage: makeMessage({ text: "first" }) }));

      useChatStore.getState().updateLastMessage("chat-msg", makeMessage({ text: "second" }));

      expect(useChatStore.getState().getChatById("chat-msg")?.lastMessage?.text).toBe("second");
    });

    it("does nothing for an unknown chat id", () => {
      add(makeChat("present"));

      useChatStore.getState().updateLastMessage("ghost", makeMessage({ text: "nope" }));

      expect(useChatStore.getState().getChatById("present")?.lastMessage).toBeUndefined();
    });
  });

  describe("createGroup", () => {
    it("FIX: uses the authenticated user id from the auth store", () => {
      mockCurrentUser({ id: "user-auth-42" });

      const group = useChatStore.getState().createGroup("Team", ["user-1", "user-2"]);

      expect(group.createdBy).toBe("user-auth-42");
      expect(group.createdBy).not.toBe("currentUser");
      expect(group.participantIds).toEqual(["user-auth-42", "user-1", "user-2"]);
      expect(group.adminIds).toEqual(["user-auth-42"]);
    });

    it("returns a group chat that is also stored in the collection", () => {
      mockCurrentUser({ id: "user-auth-42" });

      const group = useChatStore.getState().createGroup("Team", ["user-1"]);

      expect(group.type).toBe("group");
      expect(group.id).toMatch(/^group_/);
      expect(group.name).toBe("Team");
      expect(useChatStore.getState().chats.ids).toContain(group.id);
      expect(useChatStore.getState().getChatById(group.id)?.name).toBe("Team");
      expect(useChatStore.getState().getAllChats()).toHaveLength(1);
    });

    it("adds the group to the existing collection instead of replacing it", () => {
      add(plainChat("existing"));

      useChatStore.getState().createGroup("Team", ["user-1"]);

      expect(useChatStore.getState().chats.ids).toHaveLength(2);
      expect(useChatStore.getState().chats.ids[0]).toBe("existing");
    });

    it("does not duplicate the creator when they are also a participant", () => {
      mockCurrentUser({ id: "user-1" });

      const group = useChatStore.getState().createGroup("Team", ["user-1", "user-2"]);

      expect(group.participantIds).toEqual(["user-1", "user-2"]);
      expect(group.createdBy).toBe("user-1");
    });

    it('falls back to "currentUser" when nobody is authenticated', () => {
      mockCurrentUser(null);

      const group = useChatStore.getState().createGroup("Team", ["user-1"]);

      expect(group.createdBy).toBe("currentUser");
      expect(group.participantIds).toEqual(["currentUser", "user-1"]);
    });

    it("creates a group without participants", () => {
      mockCurrentUser({ id: "user-auth-42" });

      const group = useChatStore.getState().createGroup("Solo", []);

      expect(group.participantIds).toEqual(["user-auth-42"]);
      expect(group.createdBy).toBe("user-auth-42");
    });
  });

  describe("getAllChats / getChatById", () => {
    it("getAllChats follows the id order", () => {
      add(makeChat("c"), makeChat("a"), makeChat("b"));

      expect(
        useChatStore
          .getState()
          .getAllChats()
          .map((c) => c.id)
      ).toEqual(["c", "a", "b"]);
    });

    it("getChatById returns undefined for an unknown id", () => {
      expect(useChatStore.getState().getChatById("nope")).toBeUndefined();
    });

    it("getChatById returns the same entity as getAllChats", () => {
      const chat = makeChat("chat-x");
      add(chat);

      const state = useChatStore.getState();
      expect(state.getChatById("chat-x")).toBe(state.getAllChats()[0]);
    });
  });

  describe("getSortedChats", () => {
    it("sorts by updatedAt descending, newest first", () => {
      const at = (offset: number) => new Date(BASE.getTime() + offset);
      const older = makeChat("older", { updatedAt: at(1000) });
      const newer = makeChat("newer", { updatedAt: at(3000) });
      const middle = makeChat("middle", { updatedAt: at(2000) });
      add(older, newer, middle);

      expect(
        useChatStore
          .getState()
          .getSortedChats()
          .map((c) => c.id)
      ).toEqual(["newer", "middle", "older"]);
    });

    it("prefers the last message timestamp over updatedAt", () => {
      const stale = makeChat("stale-updated-at", {
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        lastMessage: makeMessage({ timestamp: new Date("2024-06-01T00:00:00.000Z") }),
      });
      const noMessage = makeChat("no-message", {
        updatedAt: new Date("2024-03-01T00:00:00.000Z"),
      });
      add(stale, noMessage);

      expect(
        useChatStore
          .getState()
          .getSortedChats()
          .map((c) => c.id)
      ).toEqual(["stale-updated-at", "no-message"]);
    });

    it("puts a pinned chat first even when it is the oldest", () => {
      const pinned = makeChat("pinned", {
        isPinned: true,
        updatedAt: new Date("2020-01-01T00:00:00.000Z"),
      });
      const fresh = makeChat("fresh", { updatedAt: new Date("2025-01-01T00:00:00.000Z") });
      add(pinned, fresh);

      expect(
        useChatStore
          .getState()
          .getSortedChats()
          .map((c) => c.id)
      ).toEqual(["pinned", "fresh"]);
    });

    it("puts a pinned chat first even when it was added last", () => {
      const fresh = makeChat("fresh", { updatedAt: new Date("2025-01-01T00:00:00.000Z") });
      const pinned = makeChat("pinned", {
        isPinned: true,
        updatedAt: new Date("2020-01-01T00:00:00.000Z"),
      });
      add(fresh, pinned);

      expect(
        useChatStore
          .getState()
          .getSortedChats()
          .map((c) => c.id)
      ).toEqual(["pinned", "fresh"]);
    });

    it("orders two pinned chats by timestamp", () => {
      const olderPinned = makeChat("older-pinned", {
        isPinned: true,
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      const newerPinned = makeChat("newer-pinned", {
        isPinned: true,
        updatedAt: new Date("2024-05-01T00:00:00.000Z"),
      });
      add(olderPinned, newerPinned);

      expect(
        useChatStore
          .getState()
          .getSortedChats()
          .map((c) => c.id)
      ).toEqual(["newer-pinned", "older-pinned"]);
    });

    it("excludes archived chats but keeps them in the collection", () => {
      const visible = makeChat("visible", { updatedAt: new Date("2024-01-01T00:00:00.000Z") });
      const archived = makeChat("archived", {
        isArchived: true,
        isPinned: true,
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      });
      add(visible, archived);

      const state = useChatStore.getState();
      expect(state.getSortedChats().map((c) => c.id)).toEqual(["visible"]);
      expect(state.getAllChats()).toHaveLength(2);
      expect(state.getChatById("archived")?.isArchived).toBe(true);
    });

    it("returns an empty list when there are no chats", () => {
      expect(useChatStore.getState().getSortedChats()).toEqual([]);
    });

    it("does not mutate the stored id order", () => {
      const older = makeChat("older", { updatedAt: new Date("2024-01-01T00:00:00.000Z") });
      const newer = makeChat("newer", { updatedAt: new Date("2025-01-01T00:00:00.000Z") });
      add(older, newer);

      useChatStore.getState().getSortedChats();

      expect(useChatStore.getState().chats.ids).toEqual(["older", "newer"]);
    });
  });

  describe("getUnreadCount", () => {
    it("returns zero when there are no chats", () => {
      expect(useChatStore.getState().getUnreadCount()).toBe(0);
    });

    it("sums unread counts of unmuted chats", () => {
      add(
        makeChat("a", { unreadCount: 2 }),
        makeChat("b", { unreadCount: 5 }),
        makeChat("c", { unreadCount: 0 })
      );

      expect(useChatStore.getState().getUnreadCount()).toBe(7);
    });

    it("ignores muted chats", () => {
      add(
        makeChat("muted", { unreadCount: 9, isMuted: true }),
        makeChat("loud", { unreadCount: 1 })
      );

      expect(useChatStore.getState().getUnreadCount()).toBe(1);
    });

    // Documented gap: getUnreadCount (chatStore.ts:209) only skips isMuted chats,
    // so unread messages in archived chats are still counted. If archived unread
    // is ever excluded, this expectation must change with the selector.
    it("counts unread in archived chats because only muted chats are skipped", () => {
      add(
        makeChat("archived", { unreadCount: 8, isArchived: true }),
        makeChat("visible", { unreadCount: 2 })
      );

      expect(useChatStore.getState().getUnreadCount()).toBe(10);
    });

    it("iterates ids, skipping ids without an entity and entities without an id", () => {
      const real = makeChat("real", { unreadCount: 4 });
      add(real);
      // "ghost" has no entity; "orphan" has an entity but is not listed in ids.
      useChatStore.setState({
        chats: {
          ids: ["real", "ghost"],
          entities: { real, orphan: makeChat("orphan", { unreadCount: 99 }) },
        },
      });

      expect(useChatStore.getState().getUnreadCount()).toBe(4);
    });

    it("drops back to zero after markChatAsRead", () => {
      add(makeChat("a", { unreadCount: 6 }));

      useChatStore.getState().markChatAsRead("a");

      expect(useChatStore.getState().getUnreadCount()).toBe(0);
    });
  });

  describe("persistence", () => {
    it("round-trips chats through the key the store reads back from", async () => {
      const a = makeChat("persisted-a");
      const b = makeChat("persisted-b");
      useChatStore.getState().setChats([a, b]);

      const persisted = snapshot();
      expect(JSON.parse(persisted).state.chats.ids).toEqual(["persisted-a", "persisted-b"]);

      await coldStart(persisted);

      const rehydrated = useChatStore.getState().getAllChats();
      expect(rehydrated).toHaveLength(2);
      expect(rehydrated.map((c) => c.id).sort()).toEqual(["persisted-a", "persisted-b"]);
      expect(useChatStore.getState().getChatById("persisted-a")).toBeDefined();
      expect(useChatStore.getState().getChatById("persisted-b")).toBeDefined();
    });

    it("rebuilds entities from storage rather than reusing memory", async () => {
      const a = makeChat("persisted-a");
      useChatStore.getState().setChats([a]);

      await coldStart(snapshot());

      const rehydrated = useChatStore.getState().getChatById("persisted-a");
      expect(rehydrated).toBeDefined();
      expect(rehydrated).not.toBe(a);
      expect(rehydrated?.id).toBe("persisted-a");
      expect(rehydrated?.type).toBe("private");
      expect(rehydrated?.participantIds).toEqual(a.participantIds);
    });

    it("FIX: revives persisted dates so getSortedChats stays sortable", async () => {
      const older = makeChat("older", {
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      const newer = makeChat("newer", {
        updatedAt: new Date("2024-05-01T00:00:00.000Z"),
      });
      useChatStore.getState().setChats([older, newer]);

      await coldStart(snapshot());

      const rehydrated = useChatStore.getState();
      expect(rehydrated.getChatById("older")?.updatedAt).toBeInstanceOf(Date);
      expect(rehydrated.getChatById("older")?.createdAt).toBeInstanceOf(Date);
      expect(rehydrated.getChatById("older")?.updatedAt).toEqual(older.updatedAt);

      const sorted = rehydrated.getSortedChats();
      expect(sorted.map((c) => c.id)).toEqual(["newer", "older"]);
    });

    it("revives last message, reaction, and editedAt dates", async () => {
      const chat = makeChat("with-message", {
        lastMessage: makeMessage({
          id: "msg-9",
          timestamp: new Date("2024-07-04T12:00:00.000Z"),
          edited: true,
          editedAt: new Date("2024-07-04T12:30:00.000Z"),
          reactions: [
            { userId: "user-2", emoji: "👍", createdAt: new Date("2024-07-04T12:05:00.000Z") },
          ],
        }),
      });
      useChatStore.getState().setChats([chat]);

      await coldStart(snapshot());

      const restored = useChatStore.getState().getChatById("with-message");
      expect(restored?.lastMessage?.timestamp).toBeInstanceOf(Date);
      expect(restored?.lastMessage?.timestamp).toEqual(new Date("2024-07-04T12:00:00.000Z"));
      expect(restored?.lastMessage?.editedAt).toEqual(new Date("2024-07-04T12:30:00.000Z"));
      expect(restored?.lastMessage?.reactions[0].createdAt).toBeInstanceOf(Date);
      expect(restored?.lastMessage?.reactions[0].createdAt).toEqual(
        new Date("2024-07-04T12:05:00.000Z")
      );
    });

    it("tolerates chats persisted without lastActivity, lastMessage, or editedAt", async () => {
      useChatStore.getState().setChats([
        plainChat("sparse", {
          lastActivity: undefined,
          lastMessage: makeMessage({ editedAt: undefined, reactions: [] }),
        }),
        plainChat("bare", { lastActivity: undefined }),
      ]);

      await coldStart(snapshot());

      const state = useChatStore.getState();
      expect(state.getChatById("sparse")?.lastActivity).toBeUndefined();
      expect(state.getChatById("sparse")?.lastMessage?.editedAt).toBeUndefined();
      expect(state.getChatById("bare")?.lastMessage).toBeUndefined();
      expect(state.getSortedChats()).toHaveLength(2);
    });

    it("sorts correctly across a rehydrate when the newest chat has a message", async () => {
      const withMessage = makeChat("with-message", {
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        lastMessage: makeMessage({ timestamp: new Date("2026-01-01T00:00:00.000Z") }),
      });
      const plain = makeChat("plain", { updatedAt: new Date("2024-06-01T00:00:00.000Z") });
      useChatStore.getState().setChats([withMessage, plain]);

      await coldStart(snapshot());

      expect(
        useChatStore
          .getState()
          .getSortedChats()
          .map((c) => c.id)
      ).toEqual(["with-message", "plain"]);
    });

    it("keeps state intact when storage has no snapshot", async () => {
      add(makeChat("kept"));
      storageCache.delete(STORAGE_KEY);

      await persistApi().rehydrate();

      expect(
        useChatStore
          .getState()
          .getAllChats()
          .map((c) => c.id)
      ).toEqual(["kept"]);
    });

    it("keeps state intact when the storage read fails", async () => {
      add(makeChat("kept"));
      storageControl.failReads = true;

      await expect(Promise.resolve(persistApi().rehydrate())).resolves.toBeUndefined();

      const state = useChatStore.getState();
      expect(state.getAllChats().map((c) => c.id)).toEqual(["kept"]);
      expect(state.getChatById("kept")?.isPinned).toBe(false);
    });

    it("does not persist isLoading, error, or activeChatId", () => {
      add(makeChat("a"));
      useChatStore.getState().setActiveChat("a");

      const persisted = JSON.parse(snapshot());
      expect(Object.keys(persisted.state)).toEqual(["chats"]);
    });
  });
});
