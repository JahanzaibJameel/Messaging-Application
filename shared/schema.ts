// @ts-expect-error drizzle-orm not installed for frontend-only build
import { sql } from "drizzle-orm";
// @ts-expect-error drizzle-orm not installed for frontend-only build
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
// @ts-expect-error drizzle-zod not installed for frontend-only build
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
