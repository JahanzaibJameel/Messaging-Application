import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== "production" ? "dev-secret-change-in-production" : "");

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6).regex(/^\d+$/, "OTP must be 6 digits"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // POST /api/auth/verify-otp
  // Accepts any 6-digit OTP (dev-mode). Returns signed JWT with user info.
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const result = verifyOtpSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Invalid request", details: result.error.issues });
        return;
      }

      const { phone } = result.data;

      // In a real system, verify OTP against a database.
      // For this slice, any 6-digit OTP is accepted.
      const userId = randomUUID();

      const token = jwt.sign({ userId, phone }, JWT_SECRET, { expiresIn: "7d" });

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
