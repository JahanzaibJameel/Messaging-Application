/**
 * Form validation schemas using Zod
 * @module utils/validation
 */

import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be at most 15 digits")
  .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format");

export const otpSchema = z
  .string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d+$/, "OTP must contain only numbers");

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(255, "Group name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  participantIds: z.array(z.string()).min(1, "Select at least one participant"),
});

export const messageSchema = z.object({
  text: z.string().min(1, "Message cannot be empty").max(4096, "Message is too long").optional(),
  attachment: z
    .object({
      type: z.enum(["image", "video", "audio", "document"]),
      uri: z.string().url(),
      fileName: z.string().optional(),
    })
    .optional(),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;
export type OTPFormData = z.infer<typeof otpSchema>;
export type CreateGroupFormData = z.infer<typeof createGroupSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
