/**
 * Domain logic tests for chat sorting and unread count calculations.
 * Tests pure functions without any external dependencies.
 */

import { sortChatsByLastMessage, calculateUnreadCount } from "../chatSorting";
import type { Chat } from "@/domain/entities/Chat";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChat(overrides: Partial<Chat> & { id: string }): Chat {
  const defaults: Chat = {
    id: overrides.id,
    type: "private",
    participantIds: [],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
  };

  // Remove id from overrides to avoid duplicate
  const { id: _id, ...rest } = overrides;
  return { ...defaults, ...rest };
}

// ---------------------------------------------------------------------------
// Tests for sortChatsByLastMessage
// ---------------------------------------------------------------------------

describe("sortChatsByLastMessage", () => {
  it("sorts chats by last message timestamp in descending order", () => {
    const chats = [
      makeChat({
        id: "chat1",
        lastMessage: {
          id: "m1",
          chatId: "chat1",
          timestamp: new Date("2024-01-01T10:00:00Z"),
          senderId: "u1",
          type: "text",
          status: "sent",
          reactions: [],
          edited: false,
        },
      }),
      makeChat({
        id: "chat2",
        lastMessage: {
          id: "m2",
          chatId: "chat2",
          timestamp: new Date("2024-01-02T10:00:00Z"),
          senderId: "u2",
          type: "text",
          status: "sent",
          reactions: [],
          edited: false,
        },
      }),
      makeChat({
        id: "chat3",
        lastMessage: {
          id: "m3",
          chatId: "chat3",
          timestamp: new Date("2024-01-03T10:00:00Z"),
          senderId: "u3",
          type: "text",
          status: "sent",
          reactions: [],
          edited: false,
        },
      }),
    ];

    const sorted = sortChatsByLastMessage(chats);

    expect(sorted[0].id).toBe("chat3"); // Newest
    expect(sorted[1].id).toBe("chat2");
    expect(sorted[2].id).toBe("chat1"); // Oldest
  });

  it("handles chats without last message timestamp (puts them at the end)", () => {
    const chats = [
      makeChat({
        id: "chat1",
        lastMessage: {
          id: "m1",
          chatId: "chat1",
          timestamp: new Date("2024-01-02T10:00:00Z"),
          senderId: "u1",
          type: "text",
          status: "sent",
          reactions: [],
          edited: false,
        },
      }),
      makeChat({ id: "chat2" }), // No last message
      makeChat({
        id: "chat3",
        lastMessage: {
          id: "m3",
          chatId: "chat3",
          timestamp: new Date("2024-01-03T10:00:00Z"),
          senderId: "u3",
          type: "text",
          status: "sent",
          reactions: [],
          edited: false,
        },
      }),
    ];

    const sorted = sortChatsByLastMessage(chats);

    expect(sorted[0].id).toBe("chat3");
    expect(sorted[1].id).toBe("chat1");
    expect(sorted[2].id).toBe("chat2"); // No timestamp, at the end
  });

  it("maintains original order for chats with same timestamp", () => {
    const chats = [
      makeChat({
        id: "chat1",
        lastMessage: {
          id: "m1",
          chatId: "chat1",
          timestamp: new Date("2024-01-02T10:00:00Z"),
          senderId: "u1",
          type: "text",
          status: "sent",
          reactions: [],
          edited: false,
        },
      }),
      makeChat({
        id: "chat2",
        lastMessage: {
          id: "m2",
          chatId: "chat2",
          timestamp: new Date("2024-01-02T10:00:00Z"),
          senderId: "u2",
          type: "text",
          status: "sent",
          reactions: [],
          edited: false,
        },
      }),
      makeChat({
        id: "chat3",
        lastMessage: {
          id: "m3",
          chatId: "chat3",
          timestamp: new Date("2024-01-02T10:00:00Z"),
          senderId: "u3",
          type: "text",
          status: "sent",
          reactions: [],
          edited: false,
        },
      }),
    ];

    const sorted = sortChatsByLastMessage(chats);

    // Should maintain relative order (stable sort)
    expect(sorted.map((c) => c.id)).toEqual(["chat1", "chat2", "chat3"]);
  });

  it("returns empty array when given empty input", () => {
    const chats: Chat[] = [];

    const sorted = sortChatsByLastMessage(chats);

    expect(sorted).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const chats = [
      makeChat({
        id: "chat1",
        lastMessage: {
          id: "m1",
          chatId: "chat1",
          timestamp: new Date("2024-01-01T10:00:00Z"),
          senderId: "u1",
          type: "text",
          status: "sent",
          reactions: [],
          edited: false,
        },
      }),
      makeChat({
        id: "chat2",
        lastMessage: {
          id: "m2",
          chatId: "chat2",
          timestamp: new Date("2024-01-02T10:00:00Z"),
          senderId: "u2",
          type: "text",
          status: "sent",
          reactions: [],
          edited: false,
        },
      }),
    ];

    const original = [...chats];
    sortChatsByLastMessage(chats);

    // Original array should be unchanged
    expect(chats[0].id).toBe(original[0].id);
    expect(chats[1].id).toBe(original[1].id);
  });
});

// ---------------------------------------------------------------------------
// Tests for calculateUnreadCount
// ---------------------------------------------------------------------------

describe("calculateUnreadCount", () => {
  it("calculates total unread messages across all chats", () => {
    const chats = [
      makeChat({ id: "chat1", unreadCount: 5 }),
      makeChat({ id: "chat2", unreadCount: 3 }),
    ];

    const unreadCount = calculateUnreadCount(chats);

    expect(unreadCount).toBe(8);
  });

  it("excludes muted chats from unread count", () => {
    const chats = [
      makeChat({ id: "chat1", unreadCount: 5, isMuted: false }),
      makeChat({ id: "chat2", unreadCount: 3, isMuted: true }), // Excluded
    ];

    const unreadCount = calculateUnreadCount(chats);

    expect(unreadCount).toBe(5); // Only chat1 contributes
  });

  it("returns 0 for empty chat list", () => {
    const chats: Chat[] = [];

    const unreadCount = calculateUnreadCount(chats);

    expect(unreadCount).toBe(0);
  });

  it("returns 0 when all chats are muted", () => {
    const chats = [
      makeChat({ id: "chat1", unreadCount: 5, isMuted: true }),
      makeChat({ id: "chat2", unreadCount: 3, isMuted: true }),
    ];

    const unreadCount = calculateUnreadCount(chats);

    expect(unreadCount).toBe(0);
  });

  it("returns 0 when all chats have 0 unread", () => {
    const chats = [
      makeChat({ id: "chat1", unreadCount: 0 }),
      makeChat({ id: "chat2", unreadCount: 0 }),
    ];

    const unreadCount = calculateUnreadCount(chats);

    expect(unreadCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("Domain Logic Edge Cases", () => {
  it("sortChatsByLastMessage handles empty array", () => {
    const sorted = sortChatsByLastMessage([]);
    expect(sorted).toEqual([]);
  });

  it("calculateUnreadCount handles chats with 0 unread", () => {
    const chats = [makeChat({ id: "chat1", unreadCount: 0 })];
    const result = calculateUnreadCount(chats);
    expect(result).toBe(0);
  });

  it("sortChatsByLastMessage handles single chat", () => {
    const chats = [makeChat({ id: "chat1", unreadCount: 2 })];
    const sorted = sortChatsByLastMessage(chats);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe("chat1");
  });

  it("calculateUnreadCount handles mixed muted and unmuted chats", () => {
    const chats = [
      makeChat({ id: "chat1", unreadCount: 0, isMuted: false }),
      makeChat({ id: "chat2", unreadCount: 10, isMuted: false }),
      makeChat({ id: "chat3", unreadCount: 5, isMuted: true }),
      makeChat({ id: "chat4", unreadCount: 3, isMuted: false }),
    ];

    const result = calculateUnreadCount(chats);
    expect(result).toBe(13); // 0 + 10 + 0 (muted) + 3
  });
});
