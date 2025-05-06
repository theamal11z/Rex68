import { 
  users, type User, type InsertUser,
  messages, type Message, type InsertMessage,
  settings, type Setting, type InsertSetting,
  contents, type Content, type InsertContent,
  memories, type Memory, type InsertMemory 
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
  
  // Setting operations
  getAllSettings(): Promise<Setting[]>;
  getSettingByKey(key: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(key: string, value: string): Promise<Setting | undefined>;
  
  // Content operations
  getAllContents(): Promise<Content[]>;
  getContentsByType(type: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  
  // Memory operations
  getMemory(userId: string): Promise<Memory | undefined>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(userId: string, context: object): Promise<Memory | undefined>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Message[];
  private settings: Map<string, Setting>;
  private contents: Content[];
  private memories: Map<string, Memory>;
  private userIdCounter: number;
  private messageIdCounter: number;
  private settingIdCounter: number;
  private contentIdCounter: number;
  private memoryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.messages = [];
    this.settings = new Map();
    this.contents = [];
    this.memories = new Map();
    this.userIdCounter = 1;
    this.messageIdCounter = 1;
    this.settingIdCounter = 1;
    this.contentIdCounter = 1;
    this.memoryIdCounter = 1;
    
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
}

// Create a storage instance
export const storage = new MemStorage();
