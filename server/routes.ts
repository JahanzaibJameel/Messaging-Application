import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { getJwtSecret } from "./config";

const JWT_SECRET = getJwtSecret();

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6).regex(/^\d+$/, "OTP must be 6 digits"),
});

const verifyOtpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP verification attempts. Please try again later." },
});

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

  return httpServer;
}
