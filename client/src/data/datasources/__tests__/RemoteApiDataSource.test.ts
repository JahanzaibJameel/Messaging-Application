/**
 * Unit tests for RemoteApiDataSource
 * Testing remote API data source functionality
 */

import { RemoteApiDataSource } from "../RemoteApiDataSource";

describe("RemoteApiDataSource", () => {
  let dataSource: RemoteApiDataSource;

  beforeEach(() => {
    if (!global.fetch) {
      (global as any).fetch = jest.fn();
    }
    dataSource = new RemoteApiDataSource();
  });

  describe("Constructor", () => {
    it("should create instance with default config", () => {
      expect(dataSource).toBeInstanceOf(RemoteApiDataSource);
    });

    it("should initialize with default base URL", () => {
      expect(dataSource).toBeDefined();
    });
  });

  describe("User Operations", () => {
    it("should handle getUserById", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "user_123",
              name: "Test User",
              phone: "+1234567890",
              isOnline: true,
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            })
          ),
        ok: true,
      } as Response);

      const result = await dataSource.getUserById("user_123");

      expect(result).toBeDefined();
      expect(result?.id).toBe("user_123");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle getUserById not found", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify(null)),
        ok: true,
      } as Response);

      const result = await dataSource.getUserById("user_999");

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle getUsersByIds", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify([
              {
                id: "user_1",
                name: "User 1",
                phone: "+1234567890",
                isOnline: true,
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
              {
                id: "user_2",
                name: "User 2",
                phone: "+0987654321",
                isOnline: false,
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
            ])
          ),
        ok: true,
      } as Response);

      const result = await dataSource.getUsersByIds(["user_1", "user_2"]);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("user_1");
      expect(result[1].id).toBe("user_2");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle getCurrentUser", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "user_current",
              name: "Current User",
              phone: "+1122334455",
              isOnline: true,
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            })
          ),
        ok: true,
      } as Response);

      const result = await dataSource.getCurrentUser();

      expect(result).toBeDefined();
      expect(result?.id).toBe("user_current");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle updateUser", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "user_123",
              name: "Updated User",
              phone: "+1234567890",
              isOnline: false,
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T12:00:00Z",
            })
          ),
        ok: true,
      } as Response);

      const updateData = {
        name: "Updated User",
        isOnline: false,
      };

      const result = await dataSource.updateUser("user_123", updateData);

      expect(result).toBeDefined();
      expect(result?.name).toBe("Updated User");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle updateProfile", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "user_123",
              name: "Updated Profile",
              phone: "+1234567890",
              isOnline: true,
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            })
          ),
        ok: true,
      } as Response);

      const profileData = {
        name: "Updated Profile",
      };

      const result = await dataSource.updateProfile("user_123", profileData);

      expect(result).toBeDefined();
      expect(result?.name).toBe("Updated Profile");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });
  });

  describe("Chat Operations", () => {
    it("should handle getChats", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify([
              {
                id: "chat_1",
                type: "private",
                participantIds: ["user_1", "user_2"],
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
                unreadCount: 0,
                isPinned: false,
                isMuted: false,
                isArchived: false,
              },
            ])
          ),
        ok: true,
      } as Response);

      const result = await dataSource.getChats();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("chat_1");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle getChatById", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chat_123",
              type: "private",
              participantIds: ["user_1", "user_2"],
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
              unreadCount: 0,
              isPinned: false,
              isMuted: false,
              isArchived: false,
            })
          ),
        ok: true,
      } as Response);

      const result = await dataSource.getChatById("chat_123");

      expect(result).toBeDefined();
      expect(result?.id).toBe("chat_123");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle createPrivateChat", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chat_private",
              type: "private",
              participantIds: ["user_1", "user_2"],
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
              unreadCount: 0,
              isPinned: false,
              isMuted: false,
              isArchived: false,
            })
          ),
        ok: true,
      } as Response);

      const result = await dataSource.createPrivateChat("user_2");

      expect(result).toBeDefined();
      expect(result?.id).toBe("chat_private");
      expect(result?.type).toBe("private");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle createGroup", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chat_group",
              type: "group",
              participantIds: ["user_1", "user_2", "user_3"],
              name: "Test Group",
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
              unreadCount: 0,
              isPinned: false,
              isMuted: false,
              isArchived: false,
            })
          ),
        ok: true,
      } as Response);

      const result = await dataSource.createGroup("Test Group", ["user_1", "user_2", "user_3"]);

      expect(result).toBeDefined();
      expect(result?.id).toBe("chat_group");
      expect(result?.type).toBe("group");
      expect(result?.name).toBe("Test Group");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle addParticipant", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        ok: true,
      } as Response);

      await expect(dataSource.addParticipant("chat_123", "user_456")).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle removeParticipant", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        ok: true,
      } as Response);

      await expect(dataSource.removeParticipant("chat_123", "user_456")).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });
  });

  describe("Message Operations", () => {
    it("should handle getMessages", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify([
              {
                id: "msg_1",
                chatId: "chat_123",
                senderId: "user_1",
                type: "text",
                text: "Hello",
                timestamp: "2024-01-01T00:00:00Z",
                status: "sent",
                localOnly: false,
                reactions: [],
                edited: false,
              },
            ])
          ),
        ok: true,
      } as Response);

      const result = await dataSource.getMessages("chat_123");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("msg_1");
      expect(result[0].text).toBe("Hello");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle sendMessage", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "msg_new",
              chatId: "chat_123",
              senderId: "user_1",
              type: "text",
              text: "New message",
              timestamp: "2024-01-01T00:00:00Z",
              status: "sent",
              localOnly: false,
              reactions: [],
              edited: false,
            })
          ),
        ok: true,
      } as Response);

      const messageData = {
        id: "msg_new",
        chatId: "chat_123",
        senderId: "user_1",
        type: "text" as const,
        text: "New message",
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
        reactions: [],
        edited: false,
      };

      const result = await dataSource.sendMessage(messageData as any);

      expect(result).toBeDefined();
      expect(result?.id).toBe("msg_new");
      expect(result?.text).toBe("New message");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle updateMessage", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "msg_123",
              chatId: "chat_123",
              senderId: "user_1",
              type: "text",
              text: "Updated message",
              timestamp: "2024-01-01T00:00:00Z",
              status: "sent",
              localOnly: false,
              reactions: [],
              edited: true,
              editedAt: "2024-01-01T12:00:00Z",
            })
          ),
        ok: true,
      } as Response);

      const updateData = {
        text: "Updated message",
        edited: true,
        editedAt: "2024-01-01T12:00:00Z",
      };

      const result = await dataSource.updateMessage("msg_123", updateData);

      expect(result).toBeDefined();
      expect(result?.text).toBe("Updated message");
      expect(result?.edited).toBe(true);
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle deleteMessage", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        ok: true,
      } as Response);

      await expect(dataSource.deleteMessage("msg_123")).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle markMessagesAsRead", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        ok: true,
      } as Response);

      await expect(
        dataSource.markMessagesAsRead("chat_123", ["msg_1", "msg_2"])
      ).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle sendTypingIndicator", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        ok: true,
      } as Response);

      await expect(dataSource.sendTypingIndicator("chat_123", true)).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });
  });

  describe("Authentication", () => {
    it("should handle login", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              success: true,
            })
          ),
        ok: true,
      } as Response);

      await expect(dataSource.login("+1234567890")).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle verifyOtp", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              token: "test_token",
              user: {
                id: "user_123",
                name: "Test User",
                phone: "+1234567890",
                isOnline: true,
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
            })
          ),
        ok: true,
      } as Response);

      const result = await dataSource.verifyOtp("+1234567890", "123456");

      expect(result).toBeDefined();
      expect(result?.token).toBe("test_token");
      expect(result?.user.id).toBe("user_123");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle logout", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              success: true,
            })
          ),
        ok: true,
      } as Response);

      await expect(dataSource.logout()).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle refreshToken", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              token: "new_token",
            })
          ),
        ok: true,
      } as Response);

      const result = await dataSource.refreshToken();

      expect(result).toBeDefined();
      expect(result?.token).toBe("new_token");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });
  });

  describe("Profile Operations", () => {
    it("should handle updateProfile", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              success: true,
            })
          ),
        ok: true,
      } as Response);

      const profileData = {
        name: "Updated Name",
        bio: "Updated bio",
      };

      await expect(dataSource.updateProfile("user_123", profileData)).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

      await expect(dataSource.getUserById("user_123")).rejects.toThrow("Network error");
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle HTTP errors", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify({ error: "Not found" })),
        ok: false,
        status: 404,
      } as Response);

      await expect(dataSource.getUserById("user_123")).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle JSON parsing errors", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve("invalid json"),
        ok: true,
      } as Response);

      await expect(dataSource.getUserById("user_123")).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty responses", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify(null)),
        ok: true,
      } as Response);

      const result = await dataSource.getUserById("user_123");
      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle malformed data", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify({ invalid: "data" })),
        ok: true,
      } as Response);

      await expect(dataSource.getUserById("user_123")).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle syncMessages", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              messages: [],
              chats: [],
              timestamp: "2024-01-01T00:00:00Z",
            })
          ),
        ok: true,
      } as Response);

      const result = await dataSource.syncMessages();

      expect(result).toBeDefined();
      expect(result.messages).toHaveLength(0);
      expect(result.chats).toHaveLength(0);
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle batchSendMessages", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify([
              {
                id: "msg_1",
                chatId: "chat_123",
                senderId: "user_1",
                type: "text",
                text: "Hello",
                timestamp: "2024-01-01T00:00:00Z",
                status: "sent",
                localOnly: false,
                reactions: [],
                edited: false,
              },
            ])
          ),
        ok: true,
      } as Response);

      const result = await dataSource.batchSendMessages([
        {
          id: "msg_1",
          chatId: "chat_123",
          senderId: "user_1",
          type: "text",
          text: "Hello",
          timestamp: "2024-01-01T00:00:00Z",
          status: "sent",
          localOnly: false,
          reactions: [],
          edited: false,
        },
      ]);

      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });
  });

  describe("Security", () => {
    it("should handle authentication tokens", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              success: true,
            })
          ),
        ok: true,
      } as Response);

      dataSource.setAuthToken("test_token");

      await expect(dataSource.getCurrentUser()).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockRestore();
    });

    it("should handle malicious input safely", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              success: true,
            })
          ),
        ok: true,
      } as Response);

      const maliciousInputs = [
        '<script>alert("xss")</script>',
        "javascript:void(0)",
        "SELECT * FROM users",
      ];

      for (const input of maliciousInputs) {
        await expect(dataSource.getUserById(input)).resolves.not.toThrow();
      }

      expect(mockFetch).toHaveBeenCalledTimes(maliciousInputs.length);
      mockFetch.mockRestore();
    });

    it("should handle addReaction and removeReaction", async () => {
      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        ok: true,
      } as Response);

      await expect(dataSource.addReaction("msg_123", "👍")).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalled();

      await expect(dataSource.removeReaction("msg_123")).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      mockFetch.mockRestore();
    });
  });
});
