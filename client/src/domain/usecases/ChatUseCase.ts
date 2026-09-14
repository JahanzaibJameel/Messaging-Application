import type { Chat, GroupChat, Message } from "../entities";
import type { ChatRepository } from "../repositories";

export class ChatUseCase {
  constructor(private chatRepository: ChatRepository) {}

  async getAllChats(): Promise<Chat[]> {
    return this.chatRepository.getAll();
  }

  async getChatById(chatId: string): Promise<Chat | null> {
    return this.chatRepository.getById(chatId);
  }

  async createGroup(name: string, participantIds: string[], createdBy: string): Promise<GroupChat> {
    return this.chatRepository.createGroup(name, participantIds, createdBy);
  }

  async pinChat(chatId: string): Promise<void> {
    await this.chatRepository.pin(chatId);
  }

  async unpinChat(chatId: string): Promise<void> {
    await this.chatRepository.unpin(chatId);
  }

  async muteChat(chatId: string): Promise<void> {
    await this.chatRepository.mute(chatId);
  }

  async unmuteChat(chatId: string): Promise<void> {
    await this.chatRepository.unmute(chatId);
  }

  async archiveChat(chatId: string): Promise<void> {
    await this.chatRepository.archive(chatId);
  }

  async unarchiveChat(chatId: string): Promise<void> {
    await this.chatRepository.unarchive(chatId);
  }

  async markAsRead(chatId: string): Promise<void> {
    await this.chatRepository.markAsRead(chatId);
  }

  async sendMessage(message: Message): Promise<void> {
    await this.chatRepository.saveMessage(message);
  }

  async getMessages(chatId: string): Promise<Message[]> {
    return this.chatRepository.getMessages(chatId);
  }
}
