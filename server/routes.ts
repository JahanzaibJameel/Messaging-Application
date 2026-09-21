import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { getJwtSecret, verifyJwtToken } from "./config";
import { storage } from "./storage";

const JWT_SECRET = getJwtSecret();

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6).regex(/^\d+$/, "OTP must be 6 digits"),
});

const createChatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  participantIds: z.array(z.string()).min(1),
  type: z.enum(["private", "group"]).optional().default("private"),
});

const sendMessageSchema = z.object({
  chatId: z.string(),
  content: z.string().min(1),
  type: z.enum(["text", "image", "video", "audio", "document"]).optional().default("text"),
});

const verifyOtpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP verification attempts. Please try again later." },
});

function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyJwtToken(token);

  if (!decoded) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  (req as unknown as Record<string, unknown>).user = decoded;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.post("/api/auth/verify-otp", verifyOtpLimiter, async (req, res) => {
    try {
      const result = verifyOtpSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Invalid request", details: result.error.issues });
        return;
      }

      const { phone } = result.data;
      const userId = randomUUID();

      const token = jwt.sign({ userId, phone }, JWT_SECRET, {
        expiresIn: "7d",
        algorithm: "HS256",
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: userId,
            name: `User-${phone.slice(-4)}`,
            phone,
            isOnline: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = (req as unknown as Record<string, unknown>).user as { userId: string };
      const storedUser = await storage.getUser(user.userId);
      if (!storedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ success: true, data: storedUser });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/chats", authenticateToken, async (req, res) => {
    try {
      const result = createChatSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Invalid request", details: result.error.issues });
        return;
      }

      const { name, participantIds, type } = result.data;
      const userId = (req as unknown as Record<string, unknown>).user as { userId: string };

      const chat = await storage.createChat({
        name: name ?? null,
        type,
        participantIds:
          type === "group"
            ? [userId.userId, ...participantIds]
            : [userId.userId, participantIds[0]],
      });

      res.json({ success: true, data: chat });
    } catch (error) {
      console.error("Create chat error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/chats", authenticateToken, async (req, res) => {
    try {
      const userId = (req as unknown as Record<string, unknown>).user as { userId: string };
      const chats = await storage.getUserChats(userId.userId);
      res.json({ success: true, data: chats });
    } catch (error) {
      console.error("Get chats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/chats/:chatId/messages", authenticateToken, async (req, res) => {
    try {
      const chatId = req.params.chatId as string;
      const messages = await storage.getMessages(chatId);
      res.json({ success: true, data: messages });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/chats/:chatId/messages", authenticateToken, async (req, res) => {
    try {
      const result = sendMessageSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Invalid request", details: result.error.issues });
        return;
      }

      const { chatId, content, type } = result.data;
      const userId = (req as unknown as Record<string, unknown>).user as { userId: string };

      const message = await storage.createMessage({
        chatId,
        senderId: userId.userId,
        content,
        type,
        status: "sent",
      });

      res.json({ success: true, data: message });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/chats/:chatId/participants", authenticateToken, async (req, res) => {
    try {
      const chatId = req.params.chatId as string;
      const participants = await storage.getParticipants(chatId);
      res.json({ success: true, data: participants });
    } catch (error) {
      console.error("Get participants error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/chats/:chatId/participants", authenticateToken, async (req, res) => {
    try {
      const chatId = req.params.chatId as string;
      const { userId } = req.body;
      await storage.addParticipant(chatId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Add participant error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
