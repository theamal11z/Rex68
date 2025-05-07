import { Message } from '@/types';

// Maximum number of tokens to include in context window
const MAX_CONTEXT_TOKENS = 4096; // Adjust based on Gemini's actual limits

// Weights for different message types
const WEIGHT_CONFIG = {
  // Recent messages get higher weight
  recency: {
    // Last 3 messages get full weight
    veryRecent: { count: 3, factor: 1.0 },
    // Next 5 messages get medium weight
    recent: { count: 5, factor: 0.8 },
    // All other messages get lower weight
    older: { factor: 0.5 }
  },
  // User messages slightly more important than system
  role: {
    user: 1.2,
    system: 1.0
  },
  // Messages with high emotional content get boosted
  emotion: {
    neutral: 1.0,
    emotional: 1.3 // Applied if sentiment is detected in memory
  }
};

// Simple token estimation (actual implementation would be more precise)
function estimateTokens(text: string): number {
  // Average English token is ~4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Selects the most relevant messages from conversation history
 * based on recency, importance, and token limits
 */
export function selectRelevantMessages(messages: Message[], memoryContext: any = null): Message[] {
  if (!messages || messages.length === 0) return [];
  
  // Calculate "importance score" for each message
  const scoredMessages = messages.map((message, index) => {
    // Base score starts with recency factor
    let score = 1.0;
    
    // Adjust score based on position in conversation
    const positionFromEnd = messages.length - 1 - index;
    if (positionFromEnd < WEIGHT_CONFIG.recency.veryRecent.count) {
      score *= WEIGHT_CONFIG.recency.veryRecent.factor;
    } else if (positionFromEnd < WEIGHT_CONFIG.recency.veryRecent.count + WEIGHT_CONFIG.recency.recent.count) {
      score *= WEIGHT_CONFIG.recency.recent.factor;
    } else {
      score *= WEIGHT_CONFIG.recency.older.factor;
    }
    
    // Adjust for message role (user vs system)
    score *= message.isFromUser ? WEIGHT_CONFIG.role.user : WEIGHT_CONFIG.role.system;
    
    // Check if this message contains emotional content (from memory)
    if (memoryContext && memoryContext.sentimentMap && memoryContext.sentimentMap[message.id]) {
      const sentiment = memoryContext.sentimentMap[message.id];
      if (sentiment !== 'neutral') {
        score *= WEIGHT_CONFIG.emotion.emotional;
      }
    }
    
    return {
      message,
      score,
      tokens: estimateTokens(message.content)
    };
  });
  
  // Sort by score (highest first)
  scoredMessages.sort((a, b) => b.score - a.score);
  
  // Always include the most recent message
  const mostRecentMessage = messages[messages.length - 1];
  const selectedMessages = [mostRecentMessage];
  let tokenCount = estimateTokens(mostRecentMessage.content);
  
  // Add more messages until we hit token limit
  for (const { message, tokens } of scoredMessages) {
    // Skip if it's the most recent (already added)
    if (message.id === mostRecentMessage.id) continue;
    
    // Check if adding this message would exceed token limit
    if (tokenCount + tokens > MAX_CONTEXT_TOKENS) break;
    
    selectedMessages.push(message);
    tokenCount += tokens;
  }
  
  // Sort by original order (chronological)
  selectedMessages.sort((a, b) => {
    const aIndex = messages.findIndex(m => m.id === a.id);
    const bIndex = messages.findIndex(m => m.id === b.id);
    return aIndex - bIndex;
  });
  
  return selectedMessages;
}

/**
 * Summarizes a conversation to be stored in memory or used as context
 */
export function summarizeConversation(messages: Message[]): string {
  if (!messages || messages.length < 3) {
    // Not enough messages to warrant summarization
    return '';
  }
  
  // Extract key topics using a simple approach
  // For a production app, you'd want to use a more sophisticated approach with embeddings
  const allContent = messages.map(m => m.content).join(' ');
  const words = allContent.toLowerCase().split(/\W+/);
  
  // Remove common words (very simple approach)
  const commonWords = ['the', 'and', 'to', 'of', 'a', 'in', 'that', 'is', 'it', 'for', 'you', 'are'];
  const filteredWords = words.filter(word => 
    word.length > 3 && !commonWords.includes(word)
  );
  
  // Count occurrences
  const wordCounts: Record<string, number> = {};
  filteredWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Get top 5 words
  const topWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  // Simple summary template
  const messageCount = messages.length;
  const userMessages = messages.filter(m => m.isFromUser === 1).length;
  const summary = `This conversation has ${messageCount} messages (${userMessages} from user). `;
  
  if (topWords.length > 0) {
    return summary + `Main topics appear to be: ${topWords.join(', ')}.`;
  }
  
  return summary;
}

/**
 * Creates a compressed representation of a conversation
 * Useful for generating a complete but compact context
 */
export function compressConversation(messages: Message[]): string {
  if (!messages || messages.length === 0) return '';
  
  // For very short conversations, no compression needed
  if (messages.length < 3) {
    return messages.map(formatMessageForCompression).join('\n');
  }
  
  // For longer conversations, divide into sections
  // Beginning (first 1-2 messages for context)
  const beginning = messages.slice(0, Math.min(2, messages.length - 3));
  
  // Middle (summarized)
  const middle = messages.slice(Math.min(2, messages.length - 3), messages.length - 3);
  
  // Recent (last 3 messages in full detail)
  const recent = messages.slice(Math.max(0, messages.length - 3));
  
  // Build the compressed representation
  let result = '';
  
  // Add beginning messages
  if (beginning.length > 0) {
    result += '== Conversation Start ==\n';
    result += beginning.map(formatMessageForCompression).join('\n');
    result += '\n';
  }
  
  // Add middle summary if there are middle messages
  if (middle.length > 0) {
    result += '== Summary of Previous Messages ==\n';
    result += summarizeConversation(middle);
    result += `\n(${middle.length} messages omitted)\n`;
  }
  
  // Add recent messages in full
  if (recent.length > 0) {
    result += '== Recent Messages ==\n';
    result += recent.map(formatMessageForCompression).join('\n');
  }
  
  return result;
}

/**
 * Formats a message for inclusion in compressed output
 */
function formatMessageForCompression(message: Message): string {
  const sender = message.isFromUser ? 'User' : 'Rex';
  // Truncate very long messages
  const content = message.content.length > 100 
    ? message.content.substring(0, 100) + '...' 
    : message.content;
  
  return `${sender}: ${content}`;
}
