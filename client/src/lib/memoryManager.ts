import { Memory, Message } from '@/types';
import { apiRequest } from './queryClient';

// Constants for memory management
const MEMORY_DECAY_RATE = 0.9; // Decay factor (higher = slower decay)
const MEMORY_STRUCTURE_VERSION = 1; // For future compatibility

// Types for structured memory
interface StructuredMemory {
  version: number;  // Version of the memory structure for compatibility
  // Basic user info
  userId: string;
  // Categorized memory data
  preferences: Record<string, Preference>;
  topics: Record<string, Topic>;
  emotions: Record<string, EmotionRecord>;
  interactions: Interaction[];
  // Raw data
  sentimentMap: Record<string | number, string>; // Maps message IDs to sentiments
  // Legacy data (for backward compatibility)
  legacyData?: any;
  // Standard fields from original memory structure
  lastInteraction?: string;
  notes?: string;
  sentiment?: string;
}

interface Preference {
  value: string;
  confidence: number; // 0-1 scale
  lastUpdated: string; // ISO date
  source: string; // Where this preference was discovered
}

interface Topic {
  name: string;
  relevance: number; // 0-1 scale
  lastDiscussed: string; // ISO date
  sentiment: string; // User's sentiment toward this topic
  mentions: number; // Count of times mentioned
}

interface EmotionRecord {
  type: string; // happiness, sadness, anger, etc.
  intensity: number; // 0-1 scale
  triggers: string[]; // What seems to trigger this emotion
  lastObserved: string; // ISO date
  frequency: number; // How often observed
}

interface Interaction {
  timestamp: string; // ISO date
  type: string; // conversation, action, etc.
  summary: string; // Brief description of interaction
  sentiment: string; // Overall sentiment
  importance: number; // 0-1 scale
}

/**
 * Creates a new structured memory for a user
 */
export function createInitialMemory(userId: string): StructuredMemory {
  return {
    version: MEMORY_STRUCTURE_VERSION,
    userId,
    preferences: {},
    topics: {},
    emotions: {},
    interactions: [],
    sentimentMap: {},
    lastInteraction: new Date().toISOString(),
    sentiment: 'neutral',
    notes: 'New user'
  };
}

/**
 * Converts legacy memory to structured format
 */
export function migrateMemory(memory: Memory): StructuredMemory {
  // If it's already structured, return as is
  if (memory.context && memory.context.version !== undefined) {
    return memory.context as StructuredMemory;
  }
  
  // Start with default structure
  const structured = createInitialMemory(memory.userId);
  
  // Copy over legacy data
  if (memory.context) {
    structured.legacyData = { ...memory.context };
    structured.lastInteraction = memory.context.lastInteraction || new Date().toISOString();
    structured.notes = memory.context.notes || '';
    structured.sentiment = memory.context.sentiment || 'neutral';
  }
  
  return structured;
}

/**
 * Updates memory with new information from a conversation
 */
export async function updateMemoryFromMessage(
  userId: string, 
  message: Message, 
  emotionalTone: string,
  existingMemory: Memory | null
): Promise<Memory | null> {
  try {
    let memoryContext: StructuredMemory;
    
    // Initialize or get existing memory
    if (!existingMemory || !existingMemory.context) {
      memoryContext = createInitialMemory(userId);
    } else {
      memoryContext = migrateMemory(existingMemory);
    }
    
    // Current date for timestamps
    const currentDate = new Date().toISOString();
    
    // Update sentiment map for this message
    if (message.id) {
      memoryContext.sentimentMap[message.id] = emotionalTone;
    }
    
    // Update general memory properties
    memoryContext.lastInteraction = currentDate;
    
    // Update overall sentiment (recency-weighted)
    if (memoryContext.sentiment === 'neutral') {
      memoryContext.sentiment = emotionalTone;
    } else {
      // Blend previous sentiment with new, prioritizing new
      memoryContext.sentiment = emotionalTone !== 'neutral' ? emotionalTone : memoryContext.sentiment;
    }
    
    // Extract topics from message (simple implementation)
    const potentialTopics = extractTopicsFromMessage(message.content);
    
    // Update topics in memory
    potentialTopics.forEach(topic => {
      if (memoryContext.topics[topic]) {
        // Update existing topic
        const existingTopic = memoryContext.topics[topic];
        existingTopic.lastDiscussed = currentDate;
        existingTopic.mentions += 1;
        existingTopic.relevance = Math.min(1.0, existingTopic.relevance + 0.1); // Increase relevance with mentions
        // Update sentiment if this message has emotion
        if (emotionalTone !== 'neutral') {
          existingTopic.sentiment = emotionalTone;
        }
      } else {
        // Create new topic
        memoryContext.topics[topic] = {
          name: topic,
          relevance: 0.5, // Start at medium relevance
          lastDiscussed: currentDate,
          sentiment: emotionalTone,
          mentions: 1
        };
      }
    });
    
    // Add an interaction record
    memoryContext.interactions.push({
      timestamp: currentDate,
      type: 'message',
      summary: `User discussed: ${potentialTopics.join(', ') || 'general topics'}`,
      sentiment: emotionalTone,
      importance: emotionalTone !== 'neutral' ? 0.8 : 0.5 // Emotional messages are more important
    });
    
    // Keep only the most recent interactions (last 10)
    if (memoryContext.interactions.length > 10) {
      memoryContext.interactions = memoryContext.interactions.slice(-10);
    }
    
    // Apply memory decay to older topics
    applyMemoryDecay(memoryContext);
    
    // Save updated memory to backend
    const response = await apiRequest('POST', '/api/memory', {
      userId,
      context: memoryContext
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Failed to update memory:', error);
    return null;
  }
}

/**
 * Applies decay to memory items based on recency
 */
function applyMemoryDecay(memory: StructuredMemory): void {
  const now = new Date();
  
  // Decay topics based on last discussion time
  Object.keys(memory.topics).forEach(key => {
    const topic = memory.topics[key];
    const lastDiscussed = new Date(topic.lastDiscussed);
    const daysSince = (now.getTime() - lastDiscussed.getTime()) / (1000 * 3600 * 24);
    
    // Apply decay - reduce relevance based on time passed
    topic.relevance *= Math.pow(MEMORY_DECAY_RATE, daysSince);
    
    // Remove topics that have become irrelevant
    if (topic.relevance < 0.1) {
      delete memory.topics[key];
    }
  });
  
  // Similar decay could be applied to other memory categories
}

/**
 * Extracts potential topics from a message
 * This is a very simple implementation - in production you'd want NLP/AI for this
 */
function extractTopicsFromMessage(content: string): string[] {
  // Simplistic topic extraction based on word frequency and importance
  // In a production system, you'd use NLP/AI to extract meaningful topics
  
  // List of common words to exclude
  const stopWords = new Set([
    'the', 'and', 'to', 'of', 'a', 'in', 'that', 'is', 'it', 'for', 
    'you', 'are', 'with', 'on', 'as', 'this', 'was', 'be', 'have', 'not',
    'what', 'who', 'when', 'where', 'why', 'how', 'which', 'would', 'could',
    'should', 'an', 'my', 'your', 'his', 'her', 'their', 'our', 'but'
  ]);
  
  // Normalize and split text
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word)); // Remove stop words and short words
  
  // Count word frequency
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Get top words as topics
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by frequency
    .slice(0, 3) // Take top 3
    .map(([word]) => word);
}

/**
 * Formats the structured memory for use in Gemini prompts
 */
export function formatMemoryForPrompt(memory: StructuredMemory): string {
  if (!memory) return '';
  
  let result = 'USER MEMORY CONTEXT:\n';
  
  // Add key user preferences
  const preferences = Object.values(memory.preferences)
    .filter(p => p.confidence > 0.6) // Only high-confidence preferences
    .map(p => `- Prefers ${p.value}`)
    .join('\n');
  
  if (preferences) {
    result += 'Preferences:\n' + preferences + '\n\n';
  }
  
  // Add important topics
  const topics = Object.values(memory.topics)
    .filter(t => t.relevance > 0.3) // Only relevant topics
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5) // Top 5 only
    .map(t => `- ${t.name} (sentiment: ${t.sentiment}, mentioned ${t.mentions} times)`)
    .join('\n');
  
  if (topics) {
    result += 'Topics of Interest:\n' + topics + '\n\n';
  }
  
  // Add emotional patterns
  const emotions = Object.values(memory.emotions)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3) // Top 3 emotions only
    .map(e => `- Shows ${e.type} when discussing: ${e.triggers.join(', ')}`)
    .join('\n');
  
  if (emotions) {
    result += 'Emotional Patterns:\n' + emotions + '\n\n';
  }
  
  // Add recent interactions
  const recentInteractions = memory.interactions
    .slice(-3) // Last 3 interactions
    .map(i => `- ${new Date(i.timestamp).toLocaleDateString()}: ${i.summary} (${i.sentiment})`)
    .join('\n');
  
  if (recentInteractions) {
    result += 'Recent Interactions:\n' + recentInteractions + '\n\n';
  }
  
  // Add overall sentiment
  result += `Current Emotional State: ${memory.sentiment}\n`;
  
  // Legacy notes if available
  if (memory.notes) {
    result += `Notes: ${memory.notes}\n`;
  }
  
  return result;
}

/**
 * Extracts the most relevant memories for the current conversation
 */
export function getRelevantMemories(
  memory: StructuredMemory, 
  currentMessage: string
): string {
  if (!memory) return '';
  
  // Extract potential topics from current message
  const currentTopics = extractTopicsFromMessage(currentMessage);
  
  // If no topics found, return general memory info
  if (currentTopics.length === 0) {
    return formatMemoryForPrompt(memory);
  }
  
  // Create a more focused memory extract based on current topics
  let relevantMemory = 'RELEVANT USER MEMORY:\n';
  
  // Find topics in memory that match current message topics
  const matchingTopics = Object.values(memory.topics)
    .filter(topic => currentTopics.includes(topic.name) || 
                    currentTopics.some(t => topic.name.includes(t) || t.includes(topic.name)))
    .sort((a, b) => b.relevance - a.relevance);
  
  if (matchingTopics.length > 0) {
    relevantMemory += 'Related Topics:\n' + 
      matchingTopics.map(t => `- ${t.name}: mentioned ${t.mentions} times, sentiment: ${t.sentiment}`)
      .join('\n') + '\n\n';
  }
  
  // Find interactions related to these topics
  const relatedInteractions = memory.interactions
    .filter(i => matchingTopics.some(t => i.summary.includes(t.name)))
    .slice(-3);
  
  if (relatedInteractions.length > 0) {
    relevantMemory += 'Related Interactions:\n' +
      relatedInteractions.map(i => `- ${i.summary} (${i.sentiment})`)
      .join('\n') + '\n\n';
  }
  
  // Add current sentiment
  relevantMemory += `Current Sentiment: ${memory.sentiment}\n`;
  
  return relevantMemory;
}

/**
 * Computes a health score [0-1] for a memory based on recency and topic relevance
 */
export function calculateMemoryHealth(memoryContext: StructuredMemory): number {
  const now = new Date();
  const last = new Date(memoryContext.lastInteraction || now.toISOString());
  const daysSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  // Recency factor decays exponentially
  const recencyFactor = Math.pow(MEMORY_DECAY_RATE, daysSince);
  // Average topic relevance
  const topics = memoryContext.topics || {};
  const avgRelevance =
    Object.values(topics).reduce((sum, t) => sum + (t.relevance || 0), 0) /
    (Object.keys(topics).length || 1);
  // Health is average of recency and relevance
  const health = (recencyFactor + avgRelevance) / 2;
  return Math.max(0, Math.min(1, health));
}
