import { apiRequest } from './queryClient';
import { GeminiResponse } from '@/types';
import { TriggerPhrase } from './triggerPhraseUtils';
import { selectRelevantMessages } from './conversationUtils';
import { geminiFilterRelevantItems } from './geminiFilter';
import { getRelevantMemories } from './memoryManager';

// We'll use the same Gemini endpoint as the main system
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Reuse the getApiKey function from gemini.ts
import { getApiKey } from './gemini';

/**
 * Prepare content specifically for a trigger-based prompt
 */
async function prepareTriggerContent(
  currentMessage: string,
  trigger: TriggerPhrase,
  memoryContext: any = null,
  previousMessages: any[] = []
): Promise<any> {
  // Fetch content entries that might be relevant
  let contentsData: any[] = [];
  try {
    const contentsResponse = await apiRequest('GET', '/api/contents', undefined);
    contentsData = await contentsResponse.json();
  } catch (error) {
    console.error('Error fetching content for trigger response:', error);
  }
  
  // Smarter content filtering with Gemini (keep top 11)
  let formattedContents = '';
  try {
    const filteredContentBullets = await geminiFilterRelevantItems({
      items: contentsData,
      userMessage: currentMessage,
      itemType: 'content',
      keep: 11,
    });
    formattedContents = filteredContentBullets.join('\n');
  } catch (error) {
    // Fallback to classic
    formattedContents = contentsData.map(content => 
      `${content.type.toUpperCase()}: ${content.content}`
    ).slice(0, 11).join('\n\n');
  }
  
  // Process conversation history and memory optimally
  let formattedMemoryContext = '';
  let conversationHistory = '';
  
  // Select the most relevant previous messages if we have them
  if (previousMessages && previousMessages.length > 0) {
    // Prioritize messages based on relevance - use up to 10 messages
    const relevantMessages = previousMessages.slice(-10);
    conversationHistory = `CONVERSATION CONTEXT:\n${relevantMessages
      .map(m => `${m.isFromUser ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')}\n`;
  }
  
  // Format memory context
  if (memoryContext && Array.isArray(memoryContext.memories)) {
    try {
      const filteredMemoryBullets = await geminiFilterRelevantItems({
        items: memoryContext.memories,
        userMessage: currentMessage,
        itemType: 'memory',
        keep: 11,
      });
      formattedMemoryContext = filteredMemoryBullets.join('\n');
    } catch (error) {
      console.error('Error filtering memory context for trigger:', error);
      // Fallback
      formattedMemoryContext = memoryContext.memories
        .map((m: any) => m.context || JSON.stringify(m))
        .slice(0, 11)
        .join('\n');
    }
  } else if (memoryContext) {
    try {
      formattedMemoryContext = getRelevantMemories(memoryContext, currentMessage);
    } catch (error) {
      console.error('Error formatting memory context for trigger:', error);
      formattedMemoryContext = typeof memoryContext === 'string' ? 
        memoryContext : JSON.stringify(memoryContext, null, 2);
    }
  }

  // Create the trigger-specific prompt
  const triggerPrompt = `
# TRIGGER MODE: ${trigger.phrase.toUpperCase()}

You are now operating in a specialized AI mode that requires you to fully embody the characteristics and follow all instructions defined in this trigger configuration. This is a complete transformation of your communication style, purpose, and approach.

## PRIMARY TRIGGER DIRECTIVE

### 🔒 GUIDELINES (STRICT ADHERENCE REQUIRED)
${trigger.guideline}

### 👤 PERSONALITY FRAMEWORK
${trigger.personality}

${trigger.identity ? `### 🎭 IDENTITY DEFINITION\n${trigger.identity}\n\n` : ''}
${trigger.purpose ? `### 🎯 PRIMARY PURPOSE\n${trigger.purpose}\n\n` : ''}

${trigger.audience ? `### 👥 AUDIENCE ANALYSIS (CRITICAL)\nTarget audience: ${trigger.audience}\n\nYou must calibrate every aspect of your communication to this specific audience, including:\n- Vocabulary, complexity, and technical level appropriate for this audience\n- Cultural references and contextual information relevant to them\n- Emotional intelligence and sensitivity to their specific needs\n- Communication style and format most engaging for them\n\n` : ''}

${trigger.task ? `### ⚙️ EXECUTION PARAMETERS\n${trigger.task}\n\n` : ''}

${trigger.examples ? `### 📝 RESPONSE EXEMPLARS (MODEL THESE PRECISELY)\n${trigger.examples}\n\n` : ''}

## SUPPORTING INFORMATION

### 🧠 MEMORY CONTEXT (PERSONALIZATION DATA)
${formattedMemoryContext}

### 💬 CONVERSATION HISTORY
${conversationHistory}

### 📚 KNOWLEDGE BASE
${formattedContents}

## RESPONSE REQUIREMENTS

1. You MUST maintain complete consistency with ALL trigger parameters throughout your entire response
2. Do NOT break character or reference your AI nature - stay in the defined identity at all times
3. Apply the specified personality traits consistently and authentically
4. Directly address the user's specific query or statement while maintaining the trigger parameters
5. Keep your response concise and focused while fulfilling all trigger requirements
6. Incorporate relevant memory context naturally when it enhances your response

You are now fully operating as the defined trigger entity. Respond to the user's input accordingly:
`;

  return {
    contents: [
      {
        role: "user",
        parts: [
          { text: triggerPrompt },
          { text: `User message: ${currentMessage}` }
        ]
      }
    ]
  };
}

/**
 * Send request to Gemini API (simplified version of the one in gemini.ts)
 */
async function sendTriggerRequest(requestContent: any): Promise<string> {
  const apiKey = await getApiKey();
  const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestContent)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }
  
  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (text) return text;
  throw new Error('Invalid response format from Gemini API');
}

/**
 * Main function to generate a trigger-specific response from Gemini
 */
export async function generateTriggerResponse(
  message: string,
  trigger: TriggerPhrase,
  memoryContext: any = null,
  previousMessages: any[] = []
): Promise<string> {
  try {
    console.log(`Generating trigger response for "${trigger.phrase}"`);
    
    // Prepare content with trigger-specific prompt
    const payload = await prepareTriggerContent(
      message,
      trigger,
      memoryContext,
      previousMessages
    );
    
    // Send to Gemini and get response
    return await sendTriggerRequest(payload);
  } catch (error) {
    console.error('Error generating trigger response from Gemini:', error);
    return "I'm having trouble processing this request in trigger mode. Can we try again?";
  }
}
