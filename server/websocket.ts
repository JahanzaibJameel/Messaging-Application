/**
 * WebSocket Server
 * Handles real-time communication for chat features
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import type { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';

// Simple logger for the server
const logger = {
  info: (message: string, context?: string) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${context ? `[${context}] ` : ''}${message}`);
  },
  debug: (message: string, context?: string) => {
    console.debug(`[${new Date().toISOString()}] [DEBUG] ${context ? `[${context}] ` : ''}${message}`);
  },
  warn: (message: string, context?: string) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${context ? `[${context}] ` : ''}${message}`);
  },
  error: (message: string, error?: Error, context?: string) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${context ? `[${context}] ` : ''}${message}`, error);
  },
};

export interface Client {
  id: string;
  userId: string;
  socket: WebSocket;
  connectedAt: Date;
  lastPing: Date;
  chatSubscriptions: Set<string>;
  isAuthenticated: boolean;
  token?: string;
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read_receipt' | 'presence' | 'ping' | 'pong';
  data: any;
  timestamp: string;
  userId: string;
  chatId?: string;
}

export interface TypingMessage extends WebSocketMessage {
  type: 'typing';
  data: {
    isTyping: boolean;
    userName?: string;
  };
}

export interface MessageMessage extends WebSocketMessage {
  type: 'message';
  data: {
    id: string;
    chatId: string;
    content: any;
    senderId: string;
  };
}

export interface ReadReceiptMessage extends WebSocketMessage {
  type: 'read_receipt';
  data: {
    messageId: string;
    userId: string;
    readAt: string;
  };
}

export interface PresenceMessage extends WebSocketMessage {
  type: 'presence';
  data: {
    status: 'online' | 'offline' | 'away';
    lastSeen?: string;
  };
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private chatSubscriptions: Map<string, Set<string>> = new Map(); // chatId -> Set of clientIds
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;
  private jwtSecret: string;
  private messageRateLimit: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly RATE_LIMIT_WINDOW = 1000; // 1 second in milliseconds
  private readonly RATE_LIMIT_MAX = 20; // 20 messages per second

  constructor(server: any, jwtSecret: string) {
    this.jwtSecret = jwtSecret;
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this),
    });

    this.setupWebSocketServer();
    this.startPingInterval();
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    try {
      const token = this.extractTokenFromRequest(info.req);
      
      if (!token) {
        logger.warn('Connection rejected: No token provided', 'WebSocketManager');
        return false;
      }

      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      if (!decoded || !decoded.userId) {
        logger.warn('Connection rejected: Invalid token', 'WebSocketManager');
        return false;
      }

      // Attach decoded token to request for later use
      (info.req as any).user = decoded;
      return true;
    } catch (error) {
      logger.warn('Connection rejected: Token verification failed', 'WebSocketManager');
      return false;
    }
  }

  private extractTokenFromRequest(req: IncomingMessage): string | null {
    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from query parameters
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    return url.searchParams.get('token');
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket server error', error, 'WebSocketManager');
    });

    logger.info('WebSocket server initialized', 'WebSocketManager');
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = this.generateClientId();
    const user = (req as any).user;
    const userId = user?.userId || 'anonymous';
    const token = this.extractTokenFromRequest(req);

    const client: Client = {
      id: clientId,
      userId,
      socket: ws,
      connectedAt: new Date(),
      lastPing: new Date(),
      chatSubscriptions: new Set(),
      isAuthenticated: !!user,
      token: token || undefined,
    };

    this.clients.set(clientId, client);
    logger.info(`Client connected: ${clientId} (userId: ${userId}, authenticated: ${client.isAuthenticated})`, 'WebSocketManager');

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'message',
      data: { message: 'Connected to chat server', clientId },
      timestamp: new Date().toISOString(),
      userId: 'server',
    });

    // Setup message handlers
    ws.on('message', (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', (code: number, reason: Buffer) => {
      this.handleDisconnection(clientId, code, reason.toString());
    });

    ws.on('error', (error: Error) => {
      logger.error(`Client error: ${clientId}`, error, 'WebSocketManager');
      this.handleDisconnection(clientId, 1006, 'Client error');
    });

    // Setup ping/pong
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastPing = new Date();
      }
    });
  }

  private handleMessage(clientId: string, data: Buffer): void {
    try {
      const client = this.clients.get(clientId);
      if (!client) {
        logger.warn(`Message from unknown client: ${clientId}`, 'WebSocketManager');
        return;
      }

      // Check rate limit
      if (!this.checkRateLimit(clientId)) {
        logger.warn(`Rate limit exceeded for client: ${clientId}`, 'WebSocketManager');
        this.sendToClient(clientId, {
          type: 'message',
          data: { error: 'Rate limit exceeded. Please slow down.' },
          timestamp: new Date().toISOString(),
          userId: 'server',
        });
        return;
      }

      // Check if client is authenticated for certain message types
      const message: WebSocketMessage = JSON.parse(data.toString());
      message.timestamp = new Date().toISOString();
      message.userId = client.userId;

      // Require authentication for message sending
      if (['message', 'typing', 'read_receipt'].includes(message.type) && !client.isAuthenticated) {
        logger.warn(`Unauthenticated client attempted to send ${message.type}: ${clientId}`, 'WebSocketManager');
        this.sendToClient(clientId, {
          type: 'message',
          data: { error: 'Authentication required for this action' },
          timestamp: new Date().toISOString(),
          userId: 'server',
        });
        return;
      }

      logger.debug(`Received message from ${clientId}: ${message.type}`, 'WebSocketManager');

      switch (message.type) {
        case 'message':
          this.handleChatMessage(clientId, message as MessageMessage);
          break;
        case 'typing':
          this.handleTypingMessage(clientId, message as TypingMessage);
          break;
        case 'read_receipt':
          this.handleReadReceipt(clientId, message as ReadReceiptMessage);
          break;
        case 'presence':
          this.handlePresence(clientId, message as PresenceMessage);
          break;
        case 'ping':
          this.handlePing(clientId);
          break;
        case 'pong':
          // Handled by socket event
          break;
        default:
          logger.warn(`Unknown message type: ${message.type}`, 'WebSocketManager');
      }
    } catch (error) {
      logger.error(`Failed to parse message from ${clientId}`, error as Error, 'WebSocketManager');
    }
  }

  private handleChatMessage(clientId: string, message: MessageMessage): void {
    const { chatId, content, senderId } = message.data;
    
    // Broadcast to all clients subscribed to this chat
    this.broadcastToChat(chatId, message, clientId);
    
    logger.info(`Message broadcast to chat ${chatId}: ${message.data.id}`, 'WebSocketManager');
  }

  private handleTypingMessage(clientId: string, message: TypingMessage): void {
    const { chatId } = message;
    const client = this.clients.get(clientId);
    
    if (!client || !chatId) {
      return;
    }

    // Broadcast typing indicator to all clients in the chat except sender
    const typingMessage: TypingMessage = {
      ...message,
      userId: client.userId,
      data: {
        ...message.data,
        userName: client.userId, // In a real app, would get actual user name
      },
    };

    this.broadcastToChat(chatId, typingMessage, clientId);
    
    logger.debug(`Typing indicator broadcast to chat ${chatId} by ${client.userId}`, 'WebSocketManager');
  }

  private handleReadReceipt(clientId: string, message: ReadReceiptMessage): void {
    const { messageId, userId, readAt } = message.data;
    
    // In a real implementation, this would:
    // 1. Store the read receipt in database
    // 2. Update message status
    // 3. Notify the message sender
    
    // For now, just broadcast to the chat
    if (message.chatId) {
      this.broadcastToChat(message.chatId, message, clientId);
    }
    
    logger.info(`Read receipt processed: ${messageId} by ${userId}`, 'WebSocketManager');
  }

  private handlePresence(clientId: string, message: PresenceMessage): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    // Broadcast presence to all clients
    this.broadcastToAll({
      ...message,
      userId: client.userId,
    }, clientId);
    
    logger.info(`Presence update: ${client.userId} is ${message.data.status}`, 'WebSocketManager');
  }

  private handlePing(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = new Date();
      this.sendToClient(clientId, {
        type: 'pong',
        data: { timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
        userId: 'server',
      });
    }
  }

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const rateLimitData = this.messageRateLimit.get(clientId);
    
    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Reset or initialize rate limit
      this.messageRateLimit.set(clientId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      });
      return true;
    }
    
    if (rateLimitData.count >= this.RATE_LIMIT_MAX) {
      return false; // Rate limit exceeded
    }
    
    // Increment count
    rateLimitData.count++;
    return true;
  }

  private handleDisconnection(clientId: string, code: number, reason: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    // Remove from chat subscriptions
    for (const chatId of client.chatSubscriptions) {
      const subscribers = this.chatSubscriptions.get(chatId);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.chatSubscriptions.delete(chatId);
        }
      }
    }

    // Remove client
    this.clients.delete(clientId);
    
    // Clean up rate limit data
    this.messageRateLimit.delete(clientId);

    // Broadcast offline presence
    this.broadcastToAll({
      type: 'presence',
      data: {
        status: 'offline',
        lastSeen: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      userId: client.userId,
    });

    logger.info(`Client disconnected: ${clientId} (${reason}, code: ${code})`, 'WebSocketManager');
  }

  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      logger.error(`Failed to send message to client ${clientId}`, error as Error, 'WebSocketManager');
    }
  }

  private broadcastToChat(chatId: string, message: WebSocketMessage, excludeClientId?: string): void {
    const subscribers = this.chatSubscriptions.get(chatId);
    if (!subscribers) {
      return;
    }

    for (const clientId of subscribers) {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    }
  }

  private broadcastToAll(message: WebSocketMessage, excludeClientId?: string): void {
    for (const clientId of this.clients.keys()) {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = new Date();
      const timeout = 30000; // 30 seconds timeout

      for (const [clientId, client] of this.clients) {
        // Check for timeout
        if (now.getTime() - client.lastPing.getTime() > timeout) {
          logger.info(`Client timeout: ${clientId}`, 'WebSocketManager');
          client.socket.terminate();
          continue;
        }

        // Send ping
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.ping();
        }
      }
    }, 30000); // Every 30 seconds
  }

  // Public API methods

  subscribeToChat(clientId: string, chatId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    client.chatSubscriptions.add(chatId);

    if (!this.chatSubscriptions.has(chatId)) {
      this.chatSubscriptions.set(chatId, new Set());
    }
    this.chatSubscriptions.get(chatId)!.add(clientId);

    logger.info(`Client ${clientId} subscribed to chat ${chatId}`, 'WebSocketManager');
  }

  unsubscribeFromChat(clientId: string, chatId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    client.chatSubscriptions.delete(chatId);

    const subscribers = this.chatSubscriptions.get(chatId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.chatSubscriptions.delete(chatId);
      }
    }

    logger.info(`Client ${clientId} unsubscribed from chat ${chatId}`, 'WebSocketManager');
  }

  getConnectedClients(): Client[] {
    return Array.from(this.clients.values());
  }

  getChatSubscribers(chatId: string): Client[] {
    const subscribers = this.chatSubscriptions.get(chatId);
    if (!subscribers) {
      return [];
    }

    return Array.from(subscribers)
      .map(clientId => this.clients.get(clientId))
      .filter(Boolean) as Client[];
  }

  getStats(): {
    totalClients: number;
    totalChats: number;
    averageConnectionsPerChat: number;
  } {
    const totalClients = this.clients.size;
    const totalChats = this.chatSubscriptions.size;
    const totalSubscriptions = Array.from(this.chatSubscriptions.values())
      .reduce((sum, subscribers) => sum + subscribers.size, 0);
    const averageConnectionsPerChat = totalChats > 0 ? totalSubscriptions / totalChats : 0;

    return {
      totalClients,
      totalChats,
      averageConnectionsPerChat,
    };
  }

  destroy(): void {
    this.isDestroyed = true;

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close all connections
    for (const client of this.clients.values()) {
      client.socket.close(1001, 'Server shutting down');
    }

    this.clients.clear();
    this.chatSubscriptions.clear();

    this.wss.close(() => {
      logger.info('WebSocket server closed', 'WebSocketManager');
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
