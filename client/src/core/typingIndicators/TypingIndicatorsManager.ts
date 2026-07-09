/**
 * Typing Indicators Manager
 * Handles real-time typing indicators for chat conversations
 */

import { useUIStore } from "../../presentation/stores";
import { AppError } from "../errors";
import { logger } from "../logger";

export interface TypingEvent {
  userId: string;
  userName?: string;
  chatId: string;
  isTyping: boolean;
  timestamp: string;
}

export interface TypingIndicator {
  userId: string;
  userName?: string;
  isTyping: boolean;
  startedAt: string;
}

export interface TypingIndicatorsConfig {
  enableTypingIndicators: boolean;
  typingTimeout: number; // How long to show "typing..." after user stops typing (ms)
  sendDelay: number; // Delay before sending typing event (ms)
  debounceDelay: number; // Debounce delay for typing events (ms)
}

const DEFAULT_CONFIG: TypingIndicatorsConfig = {
  enableTypingIndicators: true,
  typingTimeout: 3000, // 3 seconds
  sendDelay: 500, // 500ms
  debounceDelay: 300, // 300ms
};

export class TypingIndicatorsManager {
  private config: TypingIndicatorsConfig;
  private typingIndicators: Map<string, Map<string, TypingIndicator>> = new Map(); // chatId -> userId -> indicator
  private typingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // userId -> timer
  private sendTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // chatId -> timer
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // chatId -> timer
  private isDestroyed = false;
  private currentUserId: string;

  constructor(currentUserId: string, config: Partial<TypingIndicatorsConfig> = {}) {
    this.currentUserId = currentUserId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start typing indicator for current user
   */
  startTyping(chatId: string): void {
    if (!this.config.enableTypingIndicators || this.isDestroyed) {
      return;
    }

    try {
      // Clear existing send timer for this chat
      const existingTimer = this.sendTimers.get(chatId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Clear existing debounce timer
      const existingDebounceTimer = this.debounceTimers.get(chatId);
      if (existingDebounceTimer) {
        clearTimeout(existingDebounceTimer);
      }

      // Debounce typing events
      const debounceTimer = setTimeout(() => {
        this.sendTypingEvent(chatId, true);
      }, this.config.debounceDelay);

      this.debounceTimers.set(chatId, debounceTimer);

      logger.debug(`User started typing in chat ${chatId}`, "TypingIndicatorsManager");
    } catch (error) {
      logger.error("Failed to start typing indicator", error as Error, "TypingIndicatorsManager");
    }
  }

  /**
   * Stop typing indicator for current user
   */
  stopTyping(chatId: string): void {
    if (!this.config.enableTypingIndicators || this.isDestroyed) {
      return;
    }

    try {
      // Clear debounce timer
      const debounceTimer = this.debounceTimers.get(chatId);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        this.debounceTimers.delete(chatId);
      }

      // Clear send timer and send stop typing immediately
      const sendTimer = this.sendTimers.get(chatId);
      if (sendTimer) {
        clearTimeout(sendTimer);
        this.sendTimers.delete(chatId);
      }

      this.sendTypingEvent(chatId, false);

      logger.debug(`User stopped typing in chat ${chatId}`, "TypingIndicatorsManager");
    } catch (error) {
      logger.error("Failed to stop typing indicator", error as Error, "TypingIndicatorsManager");
    }
  }

  /**
   * Handle incoming typing event from WebSocket
   */
  handleTypingEvent(event: TypingEvent): void {
    if (!this.config.enableTypingIndicators || this.isDestroyed) {
      return;
    }

    // Ignore own typing events
    if (event.userId === this.currentUserId) {
      return;
    }

    try {
      const chatTypingIndicators = this.typingIndicators.get(event.chatId) || new Map();

      if (event.isTyping) {
        // User started typing
        const indicator: TypingIndicator = {
          userId: event.userId,
          userName: event.userName,
          isTyping: true,
          startedAt: event.timestamp,
        };

        chatTypingIndicators.set(event.userId, indicator);
        this.typingIndicators.set(event.chatId, chatTypingIndicators);

        // Set timeout to remove typing indicator
        const timerKey = `${event.chatId}_${event.userId}`;
        const existingTimer = this.typingTimers.get(timerKey);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
          this.removeTypingIndicator(event.chatId, event.userId);
        }, this.config.typingTimeout);

        this.typingTimers.set(timerKey, timer);

        logger.debug(
          `User ${event.userId} started typing in chat ${event.chatId}`,
          "TypingIndicatorsManager"
        );
      } else {
        // User stopped typing
        this.removeTypingIndicator(event.chatId, event.userId);
      }

      // Update UI store with current typing users
      this.updateUITypingIndicators(event.chatId);
    } catch (error) {
      logger.error("Failed to handle typing event", error as Error, "TypingIndicatorsManager");
    }
  }

  /**
   * Get typing indicators for a chat
   */
  getTypingIndicators(chatId: string): TypingIndicator[] {
    const chatIndicators = this.typingIndicators.get(chatId);
    if (!chatIndicators) {
      return [];
    }

    return Array.from(chatIndicators.values()).filter((indicator) => indicator.isTyping);
  }

  /**
   * Get typing text for display (e.g., "John is typing...", "John and Jane are typing...")
   */
  getTypingText(chatId: string): string {
    const indicators = this.getTypingIndicators(chatId);

    if (indicators.length === 0) {
      return "";
    }

    if (indicators.length === 1) {
      const userName = indicators[0].userName || "Someone";
      return `${userName} is typing...`;
    }

    if (indicators.length === 2) {
      const userNames = indicators.map((i) => i.userName || "Someone").join(" and ");
      return `${userNames} are typing...`;
    }

    // More than 2 users
    const remainingCount = indicators.length - 2;
    const firstTwo = indicators
      .slice(0, 2)
      .map((i) => i.userName || "Someone")
      .join(" and ");
    return `${firstTwo} and ${remainingCount} others are typing...`;
  }

  /**
   * Check if anyone is typing in a chat
   */
  isAnyoneTyping(chatId: string): boolean {
    return this.getTypingIndicators(chatId).length > 0;
  }

  /**
   * Send typing event via WebSocket
   */
  private sendTypingEvent(chatId: string, isTyping: boolean): void {
    try {
      const event: TypingEvent = {
        userId: this.currentUserId,
        chatId,
        isTyping,
        timestamp: new Date().toISOString(),
      };

      // Send via WebSocket (would be implemented with actual WebSocket client)
      this.sendWebSocketEvent(event);

      // Update send timer
      if (isTyping) {
        const timer = setTimeout(() => {
          this.sendTypingEvent(chatId, false);
          this.sendTimers.delete(chatId);
        }, this.config.sendDelay);

        this.sendTimers.set(chatId, timer);
      }

      logger.debug(
        `Sent typing event: ${isTyping ? "start" : "stop"} for chat ${chatId}`,
        "TypingIndicatorsManager"
      );
    } catch (error) {
      logger.error("Failed to send typing event", error as Error, "TypingIndicatorsManager");
    }
  }

  /**
   * Send WebSocket event (would be implemented with actual WebSocket client)
   */
  private sendWebSocketEvent(event: TypingEvent): void {
    // In a real implementation, this would send via WebSocket
    // For now, just log it
    logger.debug(
      `WebSocket typing event: ${event.userId} ${event.isTyping ? "typing" : "stopped typing"} in ${event.chatId}`,
      "TypingIndicatorsManager"
    );
  }

  /**
   * Remove typing indicator
   */
  private removeTypingIndicator(chatId: string, userId: string): void {
    const chatIndicators = this.typingIndicators.get(chatId);
    if (chatIndicators) {
      chatIndicators.delete(userId);

      if (chatIndicators.size === 0) {
        this.typingIndicators.delete(chatId);
      }
    }

    // Clear timer
    const timerKey = `${chatId}_${userId}`;
    const timer = this.typingTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.typingTimers.delete(timerKey);
    }

    // Update UI
    this.updateUITypingIndicators(chatId);

    logger.debug(
      `Removed typing indicator for user ${userId} in chat ${chatId}`,
      "TypingIndicatorsManager"
    );
  }

  /**
   * Update UI store with typing indicators
   */
  private updateUITypingIndicators(chatId: string): void {
    const indicators = this.getTypingIndicators(chatId);
    const typingText = this.getTypingText(chatId);

    const uiStore = useUIStore.getState();
    uiStore.setTypingIndicators(chatId, {
      users: indicators,
      text: typingText,
      isAnyoneTyping: indicators.length > 0,
    });

    logger.debug(
      `Updated UI typing indicators for chat ${chatId}: ${typingText}`,
      "TypingIndicatorsManager"
    );
  }

  /**
   * Clear all typing indicators for a chat
   */
  clearChatTypingIndicators(chatId: string): void {
    const chatIndicators = this.typingIndicators.get(chatId);
    if (chatIndicators) {
      for (const userId of chatIndicators.keys()) {
        this.removeTypingIndicator(chatId, userId);
      }
    }

    // Clear timers
    const timerKeysToRemove: string[] = [];
    for (const timerKey of this.typingTimers.keys()) {
      if (timerKey.startsWith(`${chatId}_`)) {
        timerKeysToRemove.push(timerKey);
      }
    }

    for (const timerKey of timerKeysToRemove) {
      const timer = this.typingTimers.get(timerKey);
      if (timer) {
        clearTimeout(timer);
      }
      this.typingTimers.delete(timerKey);
    }

    logger.debug(`Cleared all typing indicators for chat ${chatId}`, "TypingIndicatorsManager");
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TypingIndicatorsConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info(
      `Typing indicators config updated - enableTypingIndicators: ${this.config.enableTypingIndicators}`,
      "TypingIndicatorsManager"
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): TypingIndicatorsConfig {
    return { ...this.config };
  }

  /**
   * Destroy manager and cleanup
   */
  destroy(): void {
    this.isDestroyed = true;

    // Clear all timers
    for (const timer of this.sendTimers.values()) {
      clearTimeout(timer);
    }
    this.sendTimers.clear();

    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    for (const timer of this.typingTimers.values()) {
      clearTimeout(timer);
    }
    this.typingTimers.clear();

    // Clear all typing indicators
    this.typingIndicators.clear();

    logger.info("Typing indicators manager destroyed", "TypingIndicatorsManager");
  }
}

// Singleton instance
let typingIndicatorsManagerInstance: TypingIndicatorsManager | null = null;

export function getTypingIndicatorsManager(
  currentUserId: string,
  config?: Partial<TypingIndicatorsConfig>
): TypingIndicatorsManager {
  if (
    !typingIndicatorsManagerInstance ||
    typingIndicatorsManagerInstance["currentUserId"] !== currentUserId
  ) {
    if (typingIndicatorsManagerInstance) {
      typingIndicatorsManagerInstance.destroy();
    }
    typingIndicatorsManagerInstance = new TypingIndicatorsManager(currentUserId, config);
  }
  return typingIndicatorsManagerInstance;
}

export function resetTypingIndicatorsManager(): void {
  if (typingIndicatorsManagerInstance) {
    typingIndicatorsManagerInstance.destroy();
    typingIndicatorsManagerInstance = null;
  }
}

// Export convenience functions
export const startTyping = (chatId: string) => {
  const manager = getTypingIndicatorsManager("currentUser"); // Would get actual user ID
  manager.startTyping(chatId);
};

export const stopTyping = (chatId: string) => {
  const manager = getTypingIndicatorsManager("currentUser"); // Would get actual user ID
  manager.stopTyping(chatId);
};

export const getTypingText = (chatId: string) => {
  const manager = getTypingIndicatorsManager("currentUser"); // Would get actual user ID
  return manager.getTypingText(chatId);
};
