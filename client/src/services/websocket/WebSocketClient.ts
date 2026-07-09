/**
 * WebSocket Client
 * Manages WebSocket connection with automatic reconnection
 */

import { AppError } from "../../core/errors";
import { logger } from "../../core/logger";
import { useAuthStore, useUIStore } from "../../presentation/stores";

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  authToken?: string;
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

const DEFAULT_CONFIG: Partial<WebSocketConfig> = {
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
};

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageHandlers: Map<string, Set<(payload: unknown) => void>> = new Map();
  private statusHandlers: Set<(status: WebSocketStatus) => void> = new Set();
  private status: WebSocketStatus = "disconnected";

  constructor(config: Omit<WebSocketConfig, "authToken"> & { authToken?: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config } as WebSocketConfig;
  }

  // Connection Management
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setStatus("connecting");

    try {
      const url = this.config.authToken
        ? `${this.config.url}?token=${this.config.authToken}`
        : this.config.url;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.setStatus("connected");
        this.reconnectAttempts = 0;
        this.startHeartbeat();

        useUIStore.getState().showToast({
          type: "success",
          message: "Connected to server",
          duration: 2000,
        });
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.setStatus("disconnected");

        if (!event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        logger.error(
          "WebSocket error",
          error instanceof Error ? error : new Error("WebSocket error"),
          "WebSocketClient"
        );
        this.setStatus("disconnected");
      };
    } catch (error) {
      logger.error("WebSocket connection error", error as Error, "WebSocketClient");
      this.setStatus("disconnected");
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.setStatus("disconnected");
  }

  // Reconnection Logic
  private scheduleReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts ?? 10;
    if (this.reconnectAttempts >= maxAttempts) {
      logger.error("Max reconnection attempts reached", undefined, "WebSocketClient");
      useUIStore.getState().showToast({
        type: "error",
        message: "Connection lost. Please check your internet connection.",
        duration: 5000,
      });
      return;
    }

    this.setStatus("reconnecting");
    this.reconnectAttempts++;

    const reconnectInterval = this.config.reconnectInterval ?? 3000;
    const delay = Math.min(
      reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    logger.info(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
      "WebSocketClient"
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Heartbeat
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.send({ type: "ping", payload: {}, timestamp: new Date().toISOString() });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Message Handling
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      // Handle pong
      if (message.type === "pong") {
        return;
      }

      // Notify handlers
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message.payload);
          } catch (error) {
            logger.error(`Handler error for ${message.type}`, error as Error, "WebSocketClient");
          }
        });
      }
    } catch (error) {
      logger.error("Failed to parse message", error as Error, "WebSocketClient");
    }
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      logger.warn("Cannot send, not connected", "WebSocketClient");
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error("Send error", error as Error, "WebSocketClient");
      return false;
    }
  }

  // Event Handlers
  onMessage(type: string, handler: (payload: unknown) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  onStatusChange(handler: (status: WebSocketStatus) => void): () => void {
    this.statusHandlers.add(handler);
    handler(this.status); // Immediately call with current status

    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  updateAuthToken(token: string): void {
    this.config.authToken = token;
    if (this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }
}

// Singleton instance
let wsClientInstance: WebSocketClient | null = null;

export function getWebSocketClient(
  config?: Partial<Omit<WebSocketConfig, "authToken">>
): WebSocketClient {
  if (!wsClientInstance) {
    const wsUrl = process.env.EXPO_PUBLIC_WS_URL || "wss://api.chatapp.com/ws";
    const { currentUser } = useAuthStore.getState();

    wsClientInstance = new WebSocketClient({
      url: wsUrl,
      authToken: currentUser?.id,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    });
  }
  return wsClientInstance;
}

export function resetWebSocketClient(): void {
  if (wsClientInstance) {
    wsClientInstance.disconnect();
    wsClientInstance = null;
  }
}
