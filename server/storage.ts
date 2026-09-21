import {
  type User,
  type InsertUser,
  type Chat as BaseChat,
  type Message,
  type ChatParticipant,
} from "../shared/schema";
import { randomUUID } from "crypto";

type Chat = BaseChat & {
  participantIds: string[];
  type: "private" | "group";
  status?: "sent" | "delivered" | "read";
};

type ChatMessage = Message & {
  type: "text" | "image" | "video" | "audio" | "document";
  status: "sent" | "delivered" | "read";
};

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getChat(id: string): Promise<Chat | undefined>;
  getUserChats(userId: string): Promise<Chat[]>;
  createChat(chat: Omit<Chat, "id" | "createdAt" | "updatedAt">): Promise<Chat>;
  createMessage(message: Omit<ChatMessage, "id" | "createdAt" | "updatedAt">): Promise<ChatMessage>;
  getMessages(chatId: string): Promise<ChatMessage[]>;
  addParticipant(chatId: string, userId: string): Promise<void>;
  getParticipants(chatId: string): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chats: Map<string, Chat>;
  private messages: Map<string, ChatMessage>;
  private participants: Map<string, Set<string>>;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.participants = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChat(id: string): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async createChat(chat: Omit<Chat, "id" | "createdAt" | "updatedAt">): Promise<Chat> {
    const id = randomUUID();
    const now = new Date();
    const fullChat: Chat = { ...chat, id, createdAt: now, updatedAt: now };
    this.chats.set(id, fullChat);
    return fullChat;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter((chat) => chat.participantIds.includes(userId));
  }

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    return Array.from(this.messages.values()).filter((m) => m.chatId === chatId);
  }

  async createMessage(
    message: Omit<ChatMessage, "id" | "createdAt" | "updatedAt">
  ): Promise<ChatMessage> {
    const id = randomUUID();
    const now = new Date();
    const fullMessage: ChatMessage = { ...message, id, createdAt: now, updatedAt: now };
    this.messages.set(id, fullMessage);
    return fullMessage;
  }

  async addParticipant(chatId: string, userId: string): Promise<void> {
    if (!this.participants.has(chatId)) {
      this.participants.set(chatId, new Set());
    }
    this.participants.get(chatId)!.add(userId);
  }

  async getParticipants(chatId: string): Promise<string[]> {
    return Array.from(this.participants.get(chatId) || []);
  }
}

export const storage = new MemStorage();
