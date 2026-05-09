/**
 * Chat Service - Real-time messaging with WebSocket
 * Simple implementation for MVP networking
 */

import { addWebSocketBreadcrumb, captureException } from '../../monitoring/sentry';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  chatId: string;
}

export interface ChatService {
  connect: () => void;
  disconnect: () => void;
  sendMessage: (chatId: string, message: string) => void;
  onMessage: (callback: (message: ChatMessage) => void) => void;
  isConnected: () => boolean;
}

// Simple WebSocket implementation for MVP
export class SimpleChatService implements ChatService {
  private ws: WebSocket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second

  constructor(private serverUrl: string) {}

  connect(): void {
    try {
      addWebSocketBreadcrumb('connect_attempt', { serverUrl: this.serverUrl });
      this.ws = new WebSocket(this.serverUrl);
      
      this.ws.onopen = () => {
        addWebSocketBreadcrumb('connected', { reconnectAttempts: this.reconnectAttempts });
        this.reconnectAttempts = 0;
        
        // Request initial messages
        this.sendMessage('system', JSON.stringify({
          type: 'request_history',
          chatId: 'all'
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            const message: ChatMessage = {
              id: data.id,
              text: data.text,
              senderId: data.senderId,
              timestamp: new Date(data.timestamp),
              chatId: data.chatId,
            };
            
            addWebSocketBreadcrumb('message_received', {
              messageId: message.id,
              chatId: message.chatId,
              senderId: message.senderId,
              messageLength: message.text.length,
            });
            
            this.messageCallbacks.forEach(callback => callback(message));
          } else if (data.type === 'history') {
            addWebSocketBreadcrumb('history_received', { messageCount: data.messages?.length || 0 });
            // Handle initial message history
            data.messages.forEach((msg: any) => {
              const message: ChatMessage = {
                id: msg.id,
                text: msg.text,
                senderId: msg.senderId,
                timestamp: new Date(msg.timestamp),
                chatId: msg.chatId,
              };
              this.messageCallbacks.forEach(callback => callback(message));
            });
          }
        } catch (error) {
          addWebSocketBreadcrumb('message_parse_error', { error: String(error) });
          captureException(error as Error, {
            action: 'parse_websocket_message',
            screen: 'websocket_service',
            additionalData: { eventData: event.data?.substring(0, 100) },
          });
        }
      };

      this.ws.onclose = () => {
        addWebSocketBreadcrumb('disconnected', { reconnectAttempts: this.reconnectAttempts });
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        addWebSocketBreadcrumb('error', { error: String(error) });
        captureException(new Error('WebSocket connection error'), {
          action: 'websocket_error',
          screen: 'websocket_service',
          additionalData: { serverUrl: this.serverUrl },
        });
      };

    } catch (error) {
      addWebSocketBreadcrumb('connect_failed', { error: String(error) });
      captureException(error as Error, {
        action: 'websocket_connect',
        screen: 'websocket_service',
        additionalData: { serverUrl: this.serverUrl },
      });
    }
  }

  disconnect(): void {
    addWebSocketBreadcrumb('disconnect');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageCallbacks = [];
  }

  sendMessage(chatId: string, message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'message',
        chatId,
        text: message,
        timestamp: new Date().toISOString(),
        senderId: 'me'
      };
      
      try {
        this.ws.send(JSON.stringify(payload));
        addWebSocketBreadcrumb('message_sent', {
          chatId,
          messageLength: message.length,
        });
      } catch (error) {
        addWebSocketBreadcrumb('message_send_failed', { error: String(error) });
        captureException(error as Error, {
          action: 'send_websocket_message',
          screen: 'websocket_service',
          additionalData: { chatId, messageLength: message.length },
        });
      }
    } else {
      addWebSocketBreadcrumb('message_not_sent', { 
        reason: 'not_connected',
        chatId,
        messageLength: message.length,
      });
    }
  }

  onMessage(callback: (message: ChatMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      addWebSocketBreadcrumb('reconnect_attempt', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        delay: this.reconnectDelay * this.reconnectAttempts,
      });
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      addWebSocketBreadcrumb('reconnect_failed', {
        maxAttemptsReached: true,
        totalAttempts: this.reconnectAttempts,
      });
    }
  }
}

// Factory function for creating chat service
export const createChatService = (serverUrl: string = 'ws://localhost:8080'): ChatService => {
  return new SimpleChatService(serverUrl);
};
