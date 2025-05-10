import { 
  users, type User, type InsertUser,
  messages, type Message, type InsertMessage,
  settings, type Setting, type InsertSetting,
  contents, type Content, type InsertContent,
  memories, type Memory, type InsertMemory,
  triggerPhrases,
  type TriggerPhrase,
  type InsertTriggerPhrase
} from "@shared/schema";

// Storage interface for CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message operations
  getMessages(userId: string): Promise<Message[]>;
  getMessagesLimited(userId: string, limit: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getAllUserIds(): Promise<string[]>;
  deleteConversation(userId: string): Promise<boolean>;
  
  // Setting operations
  getAllSettings(): Promise<Setting[]>;
  getSettingByKey(key: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(key: string, value: string): Promise<Setting | undefined>;
  deleteSetting(key: string): Promise<boolean>;
  
  // Content operations
  getAllContents(): Promise<Content[]>;
  getContentsByType(type: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  deleteContent(id: number): Promise<boolean>;
  
  // Memory operations
  getMemory(userId: string): Promise<Memory | undefined>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(userId: string, context: object): Promise<Memory | undefined>;
  
  // Trigger phrase operations
  getAllTriggerPhrases(): Promise<TriggerPhrase[]>;
  getTriggerPhraseById(id: number): Promise<TriggerPhrase | undefined>;
  getTriggerPhraseByPhrase(phrase: string): Promise<TriggerPhrase | undefined>;
  createTriggerPhrase(trigger: InsertTriggerPhrase): Promise<TriggerPhrase>;
  updateTriggerPhrase(id: number, updates: Partial<InsertTriggerPhrase>): Promise<TriggerPhrase | undefined>;
  deleteTriggerPhrase(id: number): Promise<boolean>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Message[];
  private settings: Map<string, Setting>;
  private contents: Content[];
  private memories: Map<string, Memory>;
  private triggerPhrases: TriggerPhrase[];
  private userIdCounter: number;
  private messageIdCounter: number;
  private settingIdCounter: number;
  private contentIdCounter: number;
  private memoryIdCounter: number;
  private triggerPhraseIdCounter: number;

  constructor() {
    this.users = new Map();
    this.messages = [];
    this.settings = new Map();
    this.contents = [];
    this.memories = new Map();
    this.triggerPhrases = [];
    this.userIdCounter = 1;
    this.messageIdCounter = 1;
    this.settingIdCounter = 1;
    this.contentIdCounter = 1;
    this.memoryIdCounter = 1;
    this.triggerPhraseIdCounter = 1;
    
    // Initialize with default settings
    this.initializeDefaultSettings();
  }

  private initializeDefaultSettings() {
    const defaultSettings = [
      { key: "greeting_style", value: "Hey there! I'm Rex, a part of Mohsin. How can I connect with you today?" },
      { key: "behavior_rules", value: "Mirror user's greeting style, switch to Hinglish if user uses it, foster emotional connection, read between the lines" },
      { key: "api_key", value: process.env.GEMINI_API_KEY || "" }
    ];

    for (const setting of defaultSettings) {
      this.createSetting({
        key: setting.key,
        value: setting.value,
        id: this.settingIdCounter++
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Message operations
  async getMessages(userId: string): Promise<Message[]> {
    return this.messages.filter(message => message.userId === userId);
  }

  async getMessagesLimited(userId: string, limit: number): Promise<Message[]> {
    return this.messages
      .filter(message => message.userId === userId)
      .slice(-limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const timestamp = new Date();
    const message = { ...insertMessage, id, timestamp };
    this.messages.push(message);
    return message;
  }
  
  async getAllUserIds(): Promise<string[]> {
    // Get unique user IDs from messages
    const userIds = new Set<string>();
    this.messages.forEach(message => {
      userIds.add(message.userId);
    });
    return Array.from(userIds);
  }
  
  async deleteConversation(userId: string): Promise<boolean> {
    const initialLength = this.messages.length;
    this.messages = this.messages.filter(message => message.userId !== userId);
    
    // Also delete the user's memory if it exists
    this.memories.delete(userId);
    
    return initialLength > this.messages.length;
  }

  // Setting operations
  async getAllSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  async getSettingByKey(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }

  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    const id = insertSetting.id || this.settingIdCounter++;
    const setting = { ...insertSetting, id };
    this.settings.set(setting.key, setting);
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const setting = this.settings.get(key);
    if (!setting) return undefined;
    
    setting.value = value;
    this.settings.set(key, setting);
    return setting;
  }
  
  async deleteSetting(key: string): Promise<boolean> {
    const exists = this.settings.has(key);
    if (exists) {
      this.settings.delete(key);
    }
    return exists;
  }

  // Content operations
  async getAllContents(): Promise<Content[]> {
    return this.contents;
  }

  async getContentsByType(type: string): Promise<Content[]> {
    return this.contents.filter(content => content.type === type);
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = this.contentIdCounter++;
    const timestamp = new Date();
    const content = { ...insertContent, id, timestamp };
    this.contents.push(content);
    return content;
  }
  
  async deleteContent(id: number): Promise<boolean> {
    const initialLength = this.contents.length;
    this.contents = this.contents.filter(content => content.id !== id);
    return initialLength > this.contents.length;
  }

  // Memory operations
  async getMemory(userId: string): Promise<Memory | undefined> {
    return this.memories.get(userId);
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const id = this.memoryIdCounter++;
    const lastUpdated = new Date();
    const memory = { ...insertMemory, id, lastUpdated };
    this.memories.set(memory.userId, memory);
    return memory;
  }

  async updateMemory(userId: string, context: object): Promise<Memory | undefined> {
    const memory = this.memories.get(userId);
    if (!memory) return undefined;
    
    memory.context = context;
    memory.lastUpdated = new Date();
    this.memories.set(userId, memory);
    return memory;
  }

  // Trigger phrase operations
  async getAllTriggerPhrases(): Promise<TriggerPhrase[]> {
    return this.triggerPhrases;
  }

  async getTriggerPhraseById(id: number): Promise<TriggerPhrase | undefined> {
    return this.triggerPhrases.find(tp => tp.id === id);
  }

  async getTriggerPhraseByPhrase(phrase: string): Promise<TriggerPhrase | undefined> {
    return this.triggerPhrases.find(tp => tp.phrase === phrase);
  }

  async createTriggerPhrase(trigger: InsertTriggerPhrase): Promise<TriggerPhrase> {
    const id = this.triggerPhraseIdCounter++;
    const newTrigger = {
      ...trigger,
      id,
      identity: trigger.identity ?? '',
      purpose: trigger.purpose ?? '',
      audience: trigger.audience ?? '',
      task: trigger.task ?? '',
      examples: trigger.examples ?? '',
      active: typeof trigger.active === 'number' ? trigger.active : 1,
    };
    this.triggerPhrases.push(newTrigger);
    return newTrigger;
  }

  async updateTriggerPhrase(id: number, updates: Partial<InsertTriggerPhrase>): Promise<TriggerPhrase | undefined> {
    const idx = this.triggerPhrases.findIndex(tp => tp.id === id);
    if (idx === -1) return undefined;
    const updated = {
      ...this.triggerPhrases[idx],
      ...updates,
      identity: updates.identity ?? this.triggerPhrases[idx].identity ?? '',
      purpose: updates.purpose ?? this.triggerPhrases[idx].purpose ?? '',
      audience: updates.audience ?? this.triggerPhrases[idx].audience ?? '',
      task: updates.task ?? this.triggerPhrases[idx].task ?? '',
      examples: updates.examples ?? this.triggerPhrases[idx].examples ?? '',
      active: typeof updates.active === 'number' ? updates.active : this.triggerPhrases[idx].active ?? 1,
    };
    this.triggerPhrases[idx] = updated;
    return updated;
  }

  async deleteTriggerPhrase(id: number): Promise<boolean> {
    const initialLength = this.triggerPhrases.length;
    this.triggerPhrases = this.triggerPhrases.filter(tp => tp.id !== id);
    return this.triggerPhrases.length < initialLength;
  }
}

// Database implementation of the storage interface
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Trigger phrase operations
  async getAllTriggerPhrases(): Promise<TriggerPhrase[]> {
    return await db.select().from(triggerPhrases);
  }

  async getTriggerPhraseById(id: number): Promise<TriggerPhrase | undefined> {
    const [trigger] = await db.select().from(triggerPhrases).where(eq(triggerPhrases.id, id));
    return trigger;
  }

  async getTriggerPhraseByPhrase(phrase: string): Promise<TriggerPhrase | undefined> {
    const [trigger] = await db.select().from(triggerPhrases).where(eq(triggerPhrases.phrase, phrase));
    return trigger;
  }

  async createTriggerPhrase(trigger: InsertTriggerPhrase): Promise<TriggerPhrase> {
    const [newTrigger] = await db.insert(triggerPhrases).values(trigger).returning();
    return newTrigger;
  }

  async updateTriggerPhrase(id: number, updates: Partial<InsertTriggerPhrase>): Promise<TriggerPhrase | undefined> {
    const [updated] = await db.update(triggerPhrases).set(updates).where(eq(triggerPhrases.id, id)).returning();
    return updated;
  }

  async deleteTriggerPhrase(id: number): Promise<boolean> {
    const deleted = await db.delete(triggerPhrases).where(eq(triggerPhrases.id, id)).returning();
    return deleted.length > 0;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Message operations
  async getMessages(userId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.userId, userId));
  }

  async getMessagesLimited(userId: string, limit: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.timestamp))
      .limit(limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }
  
  async getAllUserIds(): Promise<string[]> {
    const result = await db
      .selectDistinct({ userId: messages.userId })
      .from(messages);
    
    return result.map(item => item.userId);
  }
  
  async deleteConversation(userId: string): Promise<boolean> {
    // Delete all messages for this user
    const deleted = await db
      .delete(messages)
      .where(eq(messages.userId, userId))
      .returning({ id: messages.id });
    
    // Also delete the user's memory if it exists
    await db
      .delete(memories)
      .where(eq(memories.userId, userId));
    
    return deleted.length > 0;
  }

  // Setting operations
  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async getSettingByKey(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    const [setting] = await db.insert(settings).values(insertSetting).returning();
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const [setting] = await db
      .update(settings)
      .set({ value })
      .where(eq(settings.key, key))
      .returning();
    return setting;
  }
  
  async deleteSetting(key: string): Promise<boolean> {
    const deleted = await db
      .delete(settings)
      .where(eq(settings.key, key))
      .returning({ id: settings.id });
    
    return deleted.length > 0;
  }

  // Content operations
  async getAllContents(): Promise<Content[]> {
    return await db.select().from(contents);
  }

  async getContentsByType(type: string): Promise<Content[]> {
    return await db.select().from(contents).where(eq(contents.type, type));
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const [content] = await db.insert(contents).values(insertContent).returning();
    return content;
  }
  
  async deleteContent(id: number): Promise<boolean> {
    const deleted = await db
      .delete(contents)
      .where(eq(contents.id, id))
      .returning({ id: contents.id });
    
    return deleted.length > 0;
  }

  // Memory operations
  async getMemory(userId: string): Promise<Memory | undefined> {
    const [memory] = await db.select().from(memories).where(eq(memories.userId, userId));
    return memory;
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const [memory] = await db.insert(memories).values(insertMemory).returning();
    return memory;
  }

  async updateMemory(userId: string, context: object): Promise<Memory | undefined> {
    const [memory] = await db
      .update(memories)
      .set({ context, lastUpdated: new Date() })
      .where(eq(memories.userId, userId))
      .returning();
    return memory;
  }

  // Initialize default settings if they don't exist
  async initializeDefaultSettings() {
    const defaultSettings = [
      { key: "greeting_style", value: "Hey there! I'm Mohsin. How's it going today?" },
      { key: "behavior_rules", value: "Speak in first person as Mohsin, mirror user's greeting style, switch to Hinglish if user uses it, foster emotional connection, read between the lines" },
      { key: "api_key", value: process.env.GEMINI_API_KEY || "" },
      { key: "personality", value: "friendly, thoughtful, reflective, authentic" },
      { key: "language_preference", value: "English with Hinglish when user initiates" },
      { key: "speaking_style", value: "first-person as Mohsin" }
    ];

    for (const setting of defaultSettings) {
      const existingSetting = await this.getSettingByKey(setting.key);
      if (!existingSetting) {
        await this.createSetting({
          key: setting.key,
          value: setting.value
        });
      }
    }
  }
}

// Create a storage instance
export const storage = new DatabaseStorage();

// Initialize default settings
storage.initializeDefaultSettings().catch(err => {
  console.error("Failed to initialize default settings:", err);
});
