/**
 * Performance Regression Tests
 * Measures store operation throughput as a proxy for list-render performance.
 *
 * Real render-frame timing requires a physical device via tools like Flashlight
 * or the React Native Performance Monitor. These tests guard against O(n)
 * regressions in store selectors that would slow the UI thread.
 *
 * Target:
 * - getSortedChats() over 500 items: <1 ms average
 * - getMessagesByChatId() over 200 messages: <1 ms average
 */

import { performance } from "perf_hooks";
import { act, renderHook } from "@testing-library/react-native";
import { useChatStore } from "../presentation/stores/chatStore";
import { useMessageStore } from "../presentation/stores/messageStore";
import type { Chat } from "../domain/entities/Chat";
import type { Message } from "../domain/entities/Message";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const measurePerformance = (callback: () => void, iterations = 100) => {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    callback();
    const end = performance.now();
    times.push(end - start);
  }
  const avgTime = times.reduce((s, t) => s + t, 0) / times.length;
  const maxTime = Math.max(...times);
  return { avgTime, maxTime };
};

const makeChat = (index: number): Chat => {
  const now = new Date(Date.now() - index * 1000);
  return {
    id: `chat-${index}`,
    type: "private",
    participantIds: ["currentUser", `user-${index}`],
    unreadCount: index % 5,
    isPinned: index % 20 === 0,
    isMuted: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };
};

const makeMessage = (index: number, chatId = "chat-0"): Message => ({
  id: `msg-${index}`,
  chatId,
  senderId: index % 2 === 0 ? "currentUser" : "user-1",
  type: "text",
  text: `Message ${index} — some realistic content to mirror real payloads.`,
  timestamp: new Date(Date.now() - index * 60_000),
  status: "delivered",
  reactions: [],
  edited: false,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Performance Regression Tests", () => {
  describe("Chat list – getSortedChats()", () => {
    it("averages under 1 ms over 500 chats across 100 iterations", () => {
      const chats = Array.from({ length: 500 }, (_, i) => makeChat(i));

      const { result } = renderHook(() => useChatStore());
      act(() => result.current.setChats(chats));

      const { avgTime, maxTime } = measurePerformance(
        () => result.current.getSortedChats(),
        100
      );

      console.log("getSortedChats (500 items):", {
        avgTime: `${avgTime.toFixed(3)} ms`,
        maxTime: `${maxTime.toFixed(3)} ms`,
      });

      expect(avgTime).toBeLessThan(1); // <1 ms average
    });
  });

  describe("Message list – getMessagesByChatId()", () => {
    it("averages under 1 ms over 200 messages across 100 iterations", () => {
      const messages = Array.from({ length: 200 }, (_, i) => makeMessage(i));

      const { result } = renderHook(() => useMessageStore());
      act(() => {
        messages.forEach((m) => result.current.addMessage(m));
      });

      const { avgTime, maxTime } = measurePerformance(
        () => result.current.getMessagesByChatId("chat-0"),
        100
      );

      console.log("getMessagesByChatId (200 messages):", {
        avgTime: `${avgTime.toFixed(3)} ms`,
        maxTime: `${maxTime.toFixed(3)} ms`,
      });

      expect(avgTime).toBeLessThan(1); // <1 ms average
    });
  });
});
