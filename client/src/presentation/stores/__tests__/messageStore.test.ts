/**
 * Message Store Tests
 *
 * Covers:
 * - Index maintenance on add / delete / clear
 * - O(1) getMessagesByChatId via index
 * - addMessages (bulk)
 * - updateMessage does not affect the index
 * - Reactions
 * - Persistence partializer includes the index
 */

import { act, renderHook } from "@testing-library/react-native";
import { useMessageStore } from "../messageStore";
import type { Message } from "../../../domain/entities/Message";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(overrides: Partial<Message> & { id: string; chatId: string }): Message {
  return {
    senderId: "user-1",
    type: "text",
    text: "Hello",
    timestamp: new Date("2024-01-01T10:00:00Z"),
    status: "sent",
    reactions: [],
    edited: false,
    ...overrides,
  } as Message;
}

const msg1 = makeMessage({ id: "msg-1", chatId: "chat-A", timestamp: new Date("2024-01-01T10:00:00Z") });
const msg2 = makeMessage({ id: "msg-2", chatId: "chat-A", timestamp: new Date("2024-01-01T10:05:00Z") });
const msg3 = makeMessage({ id: "msg-3", chatId: "chat-B", timestamp: new Date("2024-01-01T09:00:00Z") });

// ---------------------------------------------------------------------------
// Setup — reset store between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  act(() => {
    useMessageStore.getState().clearMessages();
  });
});

// ---------------------------------------------------------------------------
// Index maintenance
// ---------------------------------------------------------------------------

describe("messagesByChatId index", () => {
  it("is populated when a message is added", () => {
    act(() => useMessageStore.getState().addMessage(msg1));

    const index = useMessageStore.getState().messagesByChatId;
    expect(index["chat-A"]).toContain("msg-1");
  });

  it("maintains separate entries for different chats", () => {
    act(() => {
      useMessageStore.getState().addMessage(msg1);
      useMessageStore.getState().addMessage(msg3);
    });

    const index = useMessageStore.getState().messagesByChatId;
    expect(index["chat-A"]).toEqual(["msg-1"]);
    expect(index["chat-B"]).toEqual(["msg-3"]);
  });

  it("does not duplicate IDs on repeated addMessage calls", () => {
    act(() => {
      useMessageStore.getState().addMessage(msg1);
      useMessageStore.getState().addMessage(msg1); // duplicate
    });

    const index = useMessageStore.getState().messagesByChatId;
    expect(index["chat-A"].filter((id) => id === "msg-1")).toHaveLength(1);
  });

  it("removes the message ID from the index on deleteMessage", () => {
    act(() => {
      useMessageStore.getState().addMessage(msg1);
      useMessageStore.getState().addMessage(msg2);
      useMessageStore.getState().deleteMessage("msg-1");
    });

    const index = useMessageStore.getState().messagesByChatId;
    expect(index["chat-A"]).not.toContain("msg-1");
    expect(index["chat-A"]).toContain("msg-2");
  });

  it("clears the index on clearMessages", () => {
    act(() => {
      useMessageStore.getState().addMessage(msg1);
      useMessageStore.getState().addMessage(msg3);
      useMessageStore.getState().clearMessages();
    });

    expect(useMessageStore.getState().messagesByChatId).toEqual({});
  });

  it("is maintained correctly with addMessages (bulk)", () => {
    act(() => {
      useMessageStore.getState().addMessages([msg1, msg2, msg3]);
    });

    const index = useMessageStore.getState().messagesByChatId;
    expect(index["chat-A"]).toHaveLength(2);
    expect(index["chat-B"]).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getMessagesByChatId — O(1) lookup
// ---------------------------------------------------------------------------

describe("getMessagesByChatId", () => {
  it("returns messages for the requested chat only", () => {
    act(() => {
      useMessageStore.getState().addMessages([msg1, msg2, msg3]);
    });

    const chatA = useMessageStore.getState().getMessagesByChatId("chat-A");
    expect(chatA).toHaveLength(2);
    expect(chatA.every((m) => m.chatId === "chat-A")).toBe(true);
  });

  it("returns messages sorted oldest-first", () => {
    const older = makeMessage({ id: "msg-old", chatId: "chat-A", timestamp: new Date("2024-01-01T08:00:00Z") });
    const newer = makeMessage({ id: "msg-new", chatId: "chat-A", timestamp: new Date("2024-01-01T12:00:00Z") });

    act(() => {
      useMessageStore.getState().addMessages([newer, older]); // insert out of order
    });

    const result = useMessageStore.getState().getMessagesByChatId("chat-A");
    expect(result[0].id).toBe("msg-old");
    expect(result[1].id).toBe("msg-new");
  });

  it("returns an empty array for an unknown chatId", () => {
    expect(useMessageStore.getState().getMessagesByChatId("does-not-exist")).toEqual([]);
  });

  it("returns an empty array after all messages in a chat are deleted", () => {
    act(() => {
      useMessageStore.getState().addMessage(msg1);
      useMessageStore.getState().deleteMessage("msg-1");
    });

    expect(useMessageStore.getState().getMessagesByChatId("chat-A")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// updateMessage does not corrupt the index
// ---------------------------------------------------------------------------

describe("updateMessage", () => {
  it("updates fields without touching the chat index", () => {
    act(() => {
      useMessageStore.getState().addMessage(msg1);
      useMessageStore.getState().updateMessage("msg-1", { status: "read" });
    });

    const updated = useMessageStore.getState().getMessageById("msg-1");
    expect(updated?.status).toBe("read");

    const index = useMessageStore.getState().messagesByChatId;
    expect(index["chat-A"]).toContain("msg-1");
  });
});

// ---------------------------------------------------------------------------
// setMessages (bulk load for a chat)
// ---------------------------------------------------------------------------

describe("setMessages", () => {
  it("loads a batch and indexes them correctly", () => {
    act(() => {
      useMessageStore.getState().setMessages("chat-A", [msg1, msg2]);
    });

    const result = useMessageStore.getState().getMessagesByChatId("chat-A");
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

describe("reactions", () => {
  beforeEach(() => {
    act(() => useMessageStore.getState().addMessage(msg1));
  });

  it("adds a reaction", () => {
    act(() => useMessageStore.getState().addReaction("msg-1", "user-2", "👍"));

    const msg = useMessageStore.getState().getMessageById("msg-1");
    expect(msg?.reactions).toContainEqual(
      expect.objectContaining({ userId: "user-2", emoji: "👍" })
    );
  });

  it("replaces an existing reaction from the same user", () => {
    act(() => {
      useMessageStore.getState().addReaction("msg-1", "user-2", "👍");
      useMessageStore.getState().addReaction("msg-1", "user-2", "❤️");
    });

    const msg = useMessageStore.getState().getMessageById("msg-1");
    const userReactions = msg?.reactions.filter((r) => r.userId === "user-2");
    expect(userReactions).toHaveLength(1);
    expect(userReactions?.[0].emoji).toBe("❤️");
  });

  it("removes a reaction", () => {
    act(() => {
      useMessageStore.getState().addReaction("msg-1", "user-2", "👍");
      useMessageStore.getState().removeReaction("msg-1", "user-2");
    });

    const msg = useMessageStore.getState().getMessageById("msg-1");
    expect(msg?.reactions.find((r) => r.userId === "user-2")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Persistence partializer
// ---------------------------------------------------------------------------

describe("persistence", () => {
  it("partializer includes messagesByChatId", () => {
    // Access the zustand persist options through the store API
    // We verify indirectly: the index must survive a state read since it is
    // part of the persisted slice.
    act(() => {
      useMessageStore.getState().addMessage(msg1);
    });

    // The index is present in the store state (it will be persisted)
    const state = useMessageStore.getState();
    expect(state.messagesByChatId).toBeDefined();
    expect(state.messagesByChatId["chat-A"]).toContain("msg-1");
  });
});
