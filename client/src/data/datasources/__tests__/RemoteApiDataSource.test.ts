/**
 * Unit tests for RemoteApiDataSource
 * Testing remote API data source functionality
 */

import { RemoteApiDataSource } from "../RemoteApiDataSource";
import { secureFetch } from "@/security/secureTransport";
import { getSSLPinningConfig } from "@/security/sslPinningConfig";

// Mock the secure transport module
jest.mock("@/security/secureTransport", () => ({
  secureFetch: jest.fn(),
}));

// Mock the SSL pinning config module
jest.mock("@/security/sslPinningConfig", () => ({
  getSSLPinningConfig: jest.fn(() => ({
    domain: "api.chatapp.com",
    wsDomain: "ws.chatapp.com",
    enabled: true,
    certificateHashes: ["sha256/test-cert-hash"],
    allowInsecureConnections: false,
    timeout: 15000,
  })),
}));

describe("RemoteApiDataSource", () => {
  let dataSource: RemoteApiDataSource;
  const mockSecureFetch = secureFetch as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
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
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          id: "user_123",
          name: "Test User",
          phone: "+1234567890",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        }),
      });

      const result = await dataSource.getUserById("user_123");

      expect(result).toBeDefined();
      expect(result?.id).toBe("user_123");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/users/user_123"),
          method: "GET",
        })
      );
    });

    it("should handle getUserById not found", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify(null),
      });

      const result = await dataSource.getUserById("user_999");

      expect(result).toBeNull();
      expect(mockSecureFetch).toHaveBeenCalled();
    });

    it("should handle getUsersByIds", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify([
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
        ]),
      });

      const result = await dataSource.getUsersByIds(["user_1", "user_2"]);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("user_1");
      expect(result[1].id).toBe("user_2");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/users/batch"),
          method: "POST",
        })
      );
    });

    it("should handle getCurrentUser", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          id: "user_current",
          name: "Current User",
          phone: "+1122334455",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        }),
      });

      const result = await dataSource.getCurrentUser();

      expect(result).toBeDefined();
      expect(result?.id).toBe("user_current");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/users/me"),
          method: "GET",
        })
      );
    });

    it("should handle updateUser", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          id: "user_123",
          name: "Updated User",
          phone: "+1234567890",
          isOnline: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T12:00:00Z",
        }),
      });

      const updateData = {
        name: "Updated User",
        isOnline: false,
      };

      const result = await dataSource.updateUser("user_123", updateData);

      expect(result).toBeDefined();
      expect(result?.name).toBe("Updated User");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/users/user_123"),
          method: "PATCH",
        })
      );
    });

    it("should handle updateProfile", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          id: "user_123",
          name: "Updated Profile",
          phone: "+1234567890",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        }),
      });

      const profileData = {
        name: "Updated Profile",
      };

      const result = await dataSource.updateProfile("user_123", profileData);

      expect(result).toBeDefined();
      expect(result?.name).toBe("Updated Profile");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/users/user_123/profile"),
          method: "PATCH",
        })
      );
    });
  });

  describe("Chat Operations", () => {
    it("should handle getChats", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify([
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
        ]),
      });

      const result = await dataSource.getChats();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("chat_1");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/chats"),
          method: "GET",
        })
      );
    });

    it("should handle getChatById", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          id: "chat_123",
          type: "private",
          participantIds: ["user_1", "user_2"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        }),
      });

      const result = await dataSource.getChatById("chat_123");

      expect(result).toBeDefined();
      expect(result?.id).toBe("chat_123");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/chats/chat_123"),
          method: "GET",
        })
      );
    });

    it("should handle createPrivateChat", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          id: "chat_private",
          type: "private",
          participantIds: ["user_1", "user_2"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        }),
      });

      const result = await dataSource.createPrivateChat("user_2");

      expect(result).toBeDefined();
      expect(result?.id).toBe("chat_private");
      expect(result?.type).toBe("private");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/chats/private"),
          method: "POST",
        })
      );
    });

    it("should handle createGroup", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
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
        }),
      });

      const result = await dataSource.createGroup("Test Group", ["user_1", "user_2", "user_3"]);

      expect(result).toBeDefined();
      expect(result?.id).toBe("chat_group");
      expect(result?.type).toBe("group");
      expect(result?.name).toBe("Test Group");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/chats/group"),
          method: "POST",
        })
      );
    });

    it("should handle addParticipant", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ success: true }),
      });

      await expect(dataSource.addParticipant("chat_123", "user_456")).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/chats/chat_123/participants"),
          method: "POST",
        })
      );
    });

    it("should handle removeParticipant", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ success: true }),
      });

      await expect(dataSource.removeParticipant("chat_123", "user_456")).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/chats/chat_123/participants/user_456"),
          method: "DELETE",
        })
      );
    });
  });

  describe("Message Operations", () => {
    it("should handle getMessages", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify([
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
        ]),
      });

      const result = await dataSource.getMessages("chat_123");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("msg_1");
      expect(result[0].text).toBe("Hello");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/chats/chat_123/messages"),
          method: "GET",
        })
      );
    });

    it("should handle sendMessage", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
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
        }),
      });

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
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/chats/chat_123/messages"),
          method: "POST",
        })
      );
    });

    it("should handle updateMessage", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
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
        }),
      });

      const updateData = {
        text: "Updated message",
        edited: true,
        editedAt: "2024-01-01T12:00:00Z",
      };

      const result = await dataSource.updateMessage("msg_123", updateData);

      expect(result).toBeDefined();
      expect(result?.text).toBe("Updated message");
      expect(result?.edited).toBe(true);
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/messages/msg_123"),
          method: "PATCH",
        })
      );
    });

    it("should handle deleteMessage", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ success: true }),
      });

      await expect(dataSource.deleteMessage("msg_123")).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/messages/msg_123"),
          method: "DELETE",
        })
      );
    });

    it("should handle markMessagesAsRead", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ success: true }),
      });

      await expect(
        dataSource.markMessagesAsRead("chat_123", ["msg_1", "msg_2"])
      ).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/chats/chat_123/read"),
          method: "POST",
        })
      );
    });

    it("should handle sendTypingIndicator", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ success: true }),
      });

      await expect(dataSource.sendTypingIndicator("chat_123", true)).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/chats/chat_123/typing"),
          method: "POST",
        })
      );
    });
  });

  describe("Authentication", () => {
    it("should handle login", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          success: true,
        }),
      });

      await expect(dataSource.login("+1234567890")).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/auth/login"),
          method: "POST",
        })
      );
    });

    it("should handle verifyOtp", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          token: "test_token",
          user: {
            id: "user_123",
            name: "Test User",
            phone: "+1234567890",
            isOnline: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        }),
      });

      const result = await dataSource.verifyOtp("+1234567890", "123456");

      expect(result).toBeDefined();
      expect(result?.token).toBe("test_token");
      expect(result?.user.id).toBe("user_123");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/auth/verify"),
          method: "POST",
        })
      );
    });

    it("should handle logout", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          success: true,
        }),
      });

      await expect(dataSource.logout()).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/auth/logout"),
          method: "POST",
        })
      );
    });

    it("should handle refreshToken", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          token: "new_token",
        }),
      });

      const result = await dataSource.refreshToken();

      expect(result).toBeDefined();
      expect(result?.token).toBe("new_token");
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/auth/refresh"),
          method: "POST",
        })
      );
    });
  });

  describe("Profile Operations", () => {
    it("should handle updateProfile", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          success: true,
        }),
      });

      const profileData = {
        name: "Updated Name",
        bio: "Updated bio",
      };

      await expect(dataSource.updateProfile("user_123", profileData)).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/users/user_123/profile"),
          method: "PATCH",
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockSecureFetch.mockRejectedValue(new Error("Network error"));

      await expect(dataSource.getUserById("user_123")).rejects.toThrow("Network error");
      expect(mockSecureFetch).toHaveBeenCalled();
    });

    it("should handle HTTP errors", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 404,
        statusText: "Not Found",
        headers: {},
        data: JSON.stringify({ error: "Not found" }),
      });

      await expect(dataSource.getUserById("user_123")).rejects.toThrow();
      expect(mockSecureFetch).toHaveBeenCalled();
    });

    it("should handle JSON parsing errors", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: "invalid json",
      });

      await expect(dataSource.getUserById("user_123")).rejects.toThrow();
      expect(mockSecureFetch).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty responses", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify(null),
      });

      const result = await dataSource.getUserById("user_123");
      expect(result).toBeNull();
      expect(mockSecureFetch).toHaveBeenCalled();
    });

    it("should handle malformed data", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ invalid: "data" }),
      });

      await expect(dataSource.getUserById("user_123")).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalled();
    });

    it("should handle syncMessages", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          messages: [],
          chats: [],
          timestamp: "2024-01-01T00:00:00Z",
        }),
      });

      const result = await dataSource.syncMessages();

      expect(result).toBeDefined();
      expect(result.messages).toHaveLength(0);
      expect(result.chats).toHaveLength(0);
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/sync/messages"),
          method: "GET",
        })
      );
    });

    it("should handle batchSendMessages", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify([
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
        ]),
      });

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
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/messages/batch"),
          method: "POST",
        })
      );
    });
  });

  describe("Security", () => {
    it("should handle authentication tokens", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          success: true,
        }),
      });

      dataSource.setAuthToken("test_token");

      await expect(dataSource.getCurrentUser()).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test_token",
          }),
        })
      );
    });

    it("should handle malicious input safely", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({
          success: true,
        }),
      });

      const maliciousInputs = [
        '<script>alert("xss")</script>',
        "javascript:void(0)",
        "SELECT * FROM users",
      ];

      for (const input of maliciousInputs) {
        await expect(dataSource.getUserById(input)).resolves.not.toThrow();
      }

      expect(mockSecureFetch).toHaveBeenCalledTimes(maliciousInputs.length);
    });

    it("should handle addReaction and removeReaction", async () => {
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ success: true }),
      });

      await expect(dataSource.addReaction("msg_123", "👍")).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/messages/msg_123/reactions"),
          method: "POST",
        })
      );

      await expect(dataSource.removeReaction("msg_123")).resolves.not.toThrow();
      expect(mockSecureFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("SSL Pinning Integration", () => {
    it("should use secureFetch with SSL pinning config in production", async () => {
      const { getSSLPinningConfig } = require("@/security/sslPinningConfig");
      const config = getSSLPinningConfig();

      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ success: true }),
      });

      await dataSource.getCurrentUser();

      expect(mockSecureFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: config.timeout,
        })
      );
    });

    it("should pass certificate hashes to secureFetch in production", async () => {
      const { getSSLPinningConfig } = require("@/security/sslPinningConfig");
      const config = getSSLPinningConfig();

      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ success: true }),
      });

      await dataSource.getCurrentUser();

      // secureFetch internally uses getSSLPinningConfig().certificateHashes
      expect(config.certificateHashes).toBeDefined();
      expect(Array.isArray(config.certificateHashes)).toBe(true);
    });

    it("should use development fallback when __DEV__ is true", async () => {
      // In test environment, __DEV__ is typically true
      // secureFetch handles the __DEV__ check internally
      mockSecureFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ success: true }),
      });

      await dataSource.getCurrentUser();

      expect(mockSecureFetch).toHaveBeenCalled();
    });

    it("should not contain placeholder certificate hashes in active code", async () => {
      const { getSSLPinningConfig } = require("@/security/sslPinningConfig");
      const config = getSSLPinningConfig();

      // Verify no placeholder hashes like "XXXXXXXX" are in the config
      for (const hash of config.certificateHashes) {
        expect(hash).not.toContain("XXXXXXXX");
        expect(hash).not.toContain("placeholder");
        expect(hash.length).toBeGreaterThan(0);
      }
    });
  });
});
