import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Message schema for storing conversations
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // This can be a username or identifier
  content: text("content").notNull(),
  isFromUser: integer("is_from_user").notNull(), // 1 for user, 0 for Rex
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  content: true,
  isFromUser: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Settings schema for storing Rex's behavioral guidelines
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertSettingSchema = createInsertSchema(settings);

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Content schema for storing microblog posts and other content
export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'microblog', 'reflection', etc.
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Trigger phrase schema for admin-defined modes
export const triggerPhrases = pgTable("trigger_phrases", {
  id: serial("id").primaryKey(),
  phrase: text("phrase").notNull().unique(),
  guidelines: text("guidelines").notNull(),
  personality: text("personality").notNull(),
  examples: text("examples").default(''),
  active: integer("active").default(1), // 1 for active, 0 for inactive
  identity: text("identity").default(''), // Who am I?
  purpose: text("purpose").default(''), // What is my purpose?
  audience: text("audience").default(''), // Who am I talking to?
  task: text("task").default(''), // What is my task?
});

export const insertTriggerPhraseSchema = createInsertSchema(triggerPhrases).pick({
  phrase: true,
  guidelines: true,
  personality: true,
  examples: true,
  active: true,
  identity: true,
  purpose: true,
  audience: true,
  task: true,
});

export type InsertTriggerPhrase = z.infer<typeof insertTriggerPhraseSchema>;
export type TriggerPhrase = typeof triggerPhrases.$inferSelect;

export const insertContentSchema = createInsertSchema(contents).pick({
  type: true,
  content: true,
});

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contents.$inferSelect;

// Memory schema for storing user context
export const memories = pgTable("memories", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  context: jsonb("context").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertMemorySchema = createInsertSchema(memories).pick({
  userId: true,
  context: true,
});

export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memories.$inferSelect;
