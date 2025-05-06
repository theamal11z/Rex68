import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertMemorySchema, insertSettingSchema, insertContentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Endpoint to get Gemini API key
  app.get("/api/gemini-key", async (req: Request, res: Response) => {
    try {
      const setting = await storage.getSettingByKey("api_key");
      if (setting) {
        res.json({ key: setting.value });
      } else {
        res.status(404).json({ message: "API key not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve API key" });
    }
  });

  // Endpoint to get conversation history
  app.get("/api/messages/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve messages" });
    }
  });
  
  // Endpoint to get all user IDs with conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const userIds = await storage.getAllUserIds();
      res.json(userIds);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve user IDs" });
    }
  });
  
  // Endpoint to delete a conversation by user ID
  app.delete("/api/conversations/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const success = await storage.deleteConversation(userId);
      
      if (success) {
        res.json({ success: true, message: "Conversation deleted successfully" });
      } else {
        res.status(404).json({ message: "Conversation not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });
  
  // Endpoint to generate an AI summary of a conversation
  app.get("/api/conversations/:userId/summary", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getMessages(userId);
      
      if (messages.length === 0) {
        return res.status(404).json({ message: "No messages found for this user" });
      }
      
      // Get the API key for Gemini
      const settingResponse = await storage.getSettingByKey("api_key");
      const apiKey = settingResponse?.value || process.env.GEMINI_API_KEY || "";
      
      if (!apiKey) {
        return res.status(500).json({ message: "API key not found" });
      }
      
      // Prepare conversation for summarization
      const conversationText = messages.map(msg => {
        const role = msg.isFromUser ? "User" : "Rex";
        return `${role}: ${msg.content}`;
      }).join("\n");
      
      // Send to Gemini API for summarization
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: `Summarize the following conversation in 3-4 sentences, highlighting key topics, emotions, and any important points:\n\n${conversationText}`
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate summary: ${response.statusText}`);
      }
      
      const data = await response.json();
      const summary = data.candidates[0].content.parts[0].text;
      
      res.json({ summary });
    } catch (error) {
      console.error("Summary generation error:", error);
      res.status(500).json({ message: "Failed to generate conversation summary" });
    }
  });

  // Endpoint to save a message
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save message" });
      }
    }
  });

  // Endpoint to get user memory/context
  app.get("/api/memory/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const memory = await storage.getMemory(userId);
      
      if (memory) {
        res.json(memory);
      } else {
        res.status(404).json({ message: "Memory not found for this user" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve memory" });
    }
  });

  // Endpoint to create or update memory
  app.post("/api/memory", async (req: Request, res: Response) => {
    try {
      const { userId, context } = req.body;
      
      // Check if memory exists for this user
      const existingMemory = await storage.getMemory(userId);
      
      if (existingMemory) {
        // Update existing memory
        const updatedMemory = await storage.updateMemory(userId, context);
        res.json(updatedMemory);
      } else {
        // Create new memory
        const memoryData = insertMemorySchema.parse({ userId, context });
        const newMemory = await storage.createMemory(memoryData);
        res.status(201).json(newMemory);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid memory data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save memory" });
      }
    }
  });

  // Endpoint to get all behavioral settings
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve settings" });
    }
  });

  // Endpoint to update a setting
  app.patch("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      const updatedSetting = await storage.updateSetting(key, value);
      
      if (updatedSetting) {
        res.json(updatedSetting);
      } else {
        res.status(404).json({ message: "Setting not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });
  
  // Endpoint to delete a setting
  app.delete("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const success = await storage.deleteSetting(key);
      
      if (success) {
        res.json({ success: true, message: "Setting deleted successfully" });
      } else {
        res.status(404).json({ message: "Setting not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // Endpoint to create a new setting
  app.post("/api/settings", async (req: Request, res: Response) => {
    try {
      const settingData = insertSettingSchema.parse(req.body);
      const setting = await storage.createSetting(settingData);
      res.status(201).json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create setting" });
      }
    }
  });

  // Endpoint to get all content entries
  app.get("/api/contents", async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      
      if (type) {
        const contents = await storage.getContentsByType(type as string);
        res.json(contents);
      } else {
        const contents = await storage.getAllContents();
        res.json(contents);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve contents" });
    }
  });

  // Endpoint to create a new content entry
  app.post("/api/contents", async (req: Request, res: Response) => {
    try {
      const contentData = insertContentSchema.parse(req.body);
      const content = await storage.createContent(contentData);
      res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid content data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create content" });
      }
    }
  });
  
  // Endpoint to delete a content entry
  app.delete("/api/contents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid content ID" });
      }
      
      const success = await storage.deleteContent(id);
      if (success) {
        res.json({ success: true, message: "Content deleted successfully" });
      } else {
        res.status(404).json({ message: "Content not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // Validate admin credentials
  app.post("/api/auth/admin", (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (email === "theamal@rex.com" && password === "maothiskian11") {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  return httpServer;
}
