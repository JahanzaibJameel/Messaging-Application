/**
 * Remote API Data Source
 * Handles all remote API communication
 */

import type { ChatModel, MessageModel, UserModel } from "../models/MessageModel";
import { MockAuthDataSource } from "./MockAuthDataSource";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.chatapp.com";

const isMockAuthEnabled =
  typeof __DEV__ !== "undefined" &&
  __DEV__ === true &&
  process.env.EXPO_PUBLIC_USE_MOCK_AUTH === "true";

const mockAuthDataSource = isMockAuthEnabled ? new MockAuthDataSource() : null;

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export class RemoteApiDataSource {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      // Network-level failure (fetch rejected) — preserve the original message
      // so callers can distinguish connectivity issues from API errors.
      throw new Error((error as Error)?.message || "Network error occurred");
    }

    let parsed: unknown = null;
    try {
      const responseText = await response.text();
      if (responseText) {
        parsed = JSON.parse(responseText);
      }
    } catch (e) {
      throw new Error("Invalid JSON response");
    }

    if (!response.ok) {
      const errorData = parsed as { error?: string; message?: string } | null;
      throw new Error(
        errorData?.error || errorData?.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const wrapped = parsed as { data?: T; success?: boolean } | null;
    if (wrapped && typeof wrapped === "object" && "data" in wrapped) {
      return (wrapped as ApiResponse<T>).data;
    }
    return parsed as T;
  }

  // Auth Operations
  async login(phone: string): Promise<{ success: boolean }> {
    if (mockAuthDataSource) {
      return mockAuthDataSource.login(phone);
    }

    const response = await this.request<{ success: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    return { success: response.success };
  }

  async verifyOtp(phone: string, otp: string): Promise<{ token: string; user: UserModel }> {
    if (mockAuthDataSource) {
      return mockAuthDataSource.verifyOtp(phone, otp);
    }

    return this.request<{ token: string; user: UserModel }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });
  }

  async logout(): Promise<void> {
    await this.request("/auth/logout", {
      method: "POST",
    });
    this.authToken = null;
  }

  async refreshToken(): Promise<{ token: string }> {
    return this.request<{ token: string }>("/auth/refresh", {
      method: "POST",
    });
  }

  // User Operations
  async getCurrentUser(): Promise<UserModel> {
    return this.request("/users/me");
  }

  async getUserById(userId: string): Promise<UserModel> {
    return this.request(`/users/${userId}`);
  }

  async getUsersByIds(userIds: string[]): Promise<UserModel[]> {
    return this.request("/users/batch", {
      method: "POST",
      body: JSON.stringify({ userIds }),
    });
  }

  async updateUser(userId: string, updates: Partial<UserModel>): Promise<UserModel> {
    return this.request(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async updateProfile(userId: string, profile: Partial<UserModel>): Promise<UserModel> {
    return this.request(`/users/${userId}/profile`, {
      method: "PATCH",
      body: JSON.stringify(profile),
    });
  }

  // Chat Operations
  async getChats(): Promise<ChatModel[]> {
    return this.request("/chats");
  }

  async getChatById(chatId: string): Promise<ChatModel> {
    return this.request(`/chats/${chatId}`);
  }

  async createPrivateChat(participantId: string): Promise<ChatModel> {
    return this.request("/chats/private", {
      method: "POST",
      body: JSON.stringify({ participantId }),
    });
  }

  async createGroup(name: string, participantIds: string[]): Promise<ChatModel> {
    return this.request("/chats/group", {
      method: "POST",
      body: JSON.stringify({ name, participantIds }),
    });
  }

  async updateChat(chatId: string, updates: Partial<ChatModel>): Promise<ChatModel> {
    return this.request(`/chats/${chatId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteChat(chatId: string): Promise<void> {
    await this.request(`/chats/${chatId}`, {
      method: "DELETE",
    });
  }

  // Group Operations
  async addParticipant(chatId: string, userId: string): Promise<void> {
    await this.request(`/chats/${chatId}/participants`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async removeParticipant(chatId: string, userId: string): Promise<void> {
    await this.request(`/chats/${chatId}/participants/${userId}`, {
      method: "DELETE",
    });
  }

  async makeAdmin(chatId: string, userId: string): Promise<void> {
    await this.request(`/chats/${chatId}/admins`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async removeAdmin(chatId: string, userId: string): Promise<void> {
    await this.request(`/chats/${chatId}/admins/${userId}`, {
      method: "DELETE",
    });
  }

  // Message Operations
  async getMessages(
    chatId: string,
    options?: { limit?: number; before?: string }
  ): Promise<MessageModel[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.before) params.append("before", options.before);

    return this.request(`/chats/${chatId}/messages?${params.toString()}`);
  }

  async sendMessage(message: MessageModel): Promise<MessageModel> {
    return this.request(`/chats/${message.chatId}/messages`, {
      method: "POST",
      body: JSON.stringify(message),
    });
  }

  async updateMessage(messageId: string, updates: Partial<MessageModel>): Promise<MessageModel> {
    return this.request(`/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.request(`/messages/${messageId}`, {
      method: "DELETE",
    });
  }

  async markMessagesAsRead(chatId: string, messageIds: string[]): Promise<void> {
    await this.request(`/chats/${chatId}/read`, {
      method: "POST",
      body: JSON.stringify({ messageIds }),
    });
  }

  // Sync Operations
  async syncMessages(lastSyncTimestamp?: string): Promise<{
    messages: MessageModel[];
    chats: ChatModel[];
    timestamp: string;
  }> {
    const params = lastSyncTimestamp ? `?since=${encodeURIComponent(lastSyncTimestamp)}` : "";
    return this.request(`/sync/messages${params}`);
  }

  async batchSendMessages(messages: MessageModel[]): Promise<MessageModel[]> {
    return this.request("/messages/batch", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
  }

  // Typing Indicators
  async sendTypingIndicator(chatId: string, isTyping: boolean): Promise<void> {
    await this.request(`/chats/${chatId}/typing`, {
      method: "POST",
      body: JSON.stringify({ isTyping }),
    });
  }

  // Reactions
  async addReaction(messageId: string, emoji: string): Promise<void> {
    await this.request(`/messages/${messageId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    });
  }

  async removeReaction(messageId: string): Promise<void> {
    await this.request(`/messages/${messageId}/reactions`, {
      method: "DELETE",
    });
  }
}

// Singleton instance
export const remoteApiDataSource = new RemoteApiDataSource();
