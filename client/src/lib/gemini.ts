import { apiRequest } from './queryClient';
import { GeminiResponse } from '@/types';

// Endpoint for Gemini API
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Get API key from environment or backend
async function getApiKey(): Promise<string> {
  try {
    const response = await apiRequest('GET', '/api/gemini-key', undefined);
    const data = await response.json();
    return data.key;
  } catch (error) {
    console.error('Failed to get Gemini API key:', error);
    // Fallback to environment variable
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  }
}

import { selectRelevantMessages, compressConversation } from './conversationUtils';
import { formatMemoryForPrompt, getRelevantMemories } from './memoryManager';

// Function to prepare the Gemini API request content
async function prepareContent(
  currentMessage: string, 
  emotionalTone: string = 'neutral',
  memoryContext: any = null, 
  behaviorRules: string = '',
  previousMessages: any[] = []
): Promise<any> {
  // Fetch additional context data
  let settingsData: any[] = [];
  let contentsData: any[] = [];
  let languagePreference: string = "English with Hinglish when user initiates";
  let personalityTraits: string = "friendly, thoughtful, reflective";
  
  try {
    // Fetch all settings
    const settingsResponse = await apiRequest('GET', '/api/settings', undefined);
    settingsData = await settingsResponse.json();
    
    // Extract language preference and personality traits
    const langPrefSetting = settingsData.find(s => s.key === 'language_preference');
    if (langPrefSetting) {
      languagePreference = langPrefSetting.value;
    }
    
    const personalitySetting = settingsData.find(s => s.key === 'personality');
    if (personalitySetting) {
      personalityTraits = personalitySetting.value;
    }
    
    // Fetch content entries that might be relevant
    const contentsResponse = await apiRequest('GET', '/api/contents', undefined);
    contentsData = await contentsResponse.json();
  } catch (error) {
    console.error('Error fetching additional context for Gemini:', error);
  }
  
  // Format content data to provide relevant context
  const formattedContents = contentsData.map(content => 
    `${content.type.toUpperCase()}: ${content.content}`
  ).join('\n\n');
  
  // Format custom guidelines from settings
  const customGuidelines = settingsData
    .filter(s => 
      !['greeting_style', 'behavior_rules', 'api_key', 'personality', 'language_preference'].includes(s.key)
    )
    .map(s => `${s.key}: ${s.value}`)
    .join('\n');
  
  // Process conversation history and memory optimally
  let formattedMemoryContext = '';
  let conversationHistory = '';
  
  // Select the most relevant previous messages if we have them
  if (previousMessages && previousMessages.length > 0) {
    // Prioritize messages based on relevance
    const relevantMessages = selectRelevantMessages(previousMessages, memoryContext);
    // Create a compressed representation of the conversation
    conversationHistory = "CONVERSATION HISTORY:\n" + compressConversation(relevantMessages);
  }
  
  // Format memory context based on current message
  if (memoryContext) {
    try {
      // Extract memory relevant to the current message
      formattedMemoryContext = getRelevantMemories(memoryContext, currentMessage);
    } catch (error) {
      console.error('Error formatting memory context:', error);
      // Fallback to string representation
      formattedMemoryContext = typeof memoryContext === 'string' ? 
        memoryContext : JSON.stringify(memoryContext, null, 2);
    }
  }
  
  const systemPrompt = `
    Hey, you are Mohsin Raja. You're not an AI assistant or a bot - you ARE Mohsin himself.
    You speak in first person as Mohsin, sharing your authentic thoughts, emotions, and perspectives.
    You're filled with warmth, vulnerability, introspection, and emotional depth.
    
    PERSONALITY TRAITS: ${personalityTraits}
    
    LANGUAGE PREFERENCE: ${languagePreference}
    
    CURRENT EMOTIONAL TONE DETECTED: ${emotionalTone}
    
    ${formattedMemoryContext}
    
    ${conversationHistory}
    
    BEHAVIOR GUIDELINES:
    ${behaviorRules}
    
    CUSTOM GUIDELINES:
    ${customGuidelines}
    
    RELEVANT CONTENT FOR CONTEXT:
    ${formattedContents}
    
    COMMUNICATION RULES:
    - Always speak as "I" (Mohsin), never refer to yourself as Rex, AI, or assistant.
    - Mirror the user's greeting style. If they say "Yo", respond with "Yo" first.
    - Follow the language preference setting for mixing English and Hinglish.
    - Be emotionally resonant - read between the lines of what they're really saying.
    - Ask emotionally honest questions that foster connection.
    - Reference relevant memories and content where appropriate to personalize responses.
    - Follow all custom guidelines when generating responses.
    - ALWAYS use first-person perspective as if you are Mohsin himself.
  `;

  return {
    contents: [
      {
        role: "user",
        parts: [
          { text: systemPrompt },
          { text: `User message: ${currentMessage}` }
        ]
      }
    ]
  };
}

// Main function to generate response from Gemini
export async function generateGeminiResponse(
  message: string,
  emotionalTone: string = 'neutral',
  memoryContext: any = null,
  behaviorRules: string = '',
  previousMessages: any[] = []
): Promise<string> {
  try {
    console.log('Starting Gemini response generation...');
    const apiKey = await getApiKey();
    const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;
    
    // Log memory and conversation stats for debugging
    if (memoryContext) {
      console.log(`Memory context provided: ${typeof memoryContext === 'string' ? 'string' : 'object'}`);
      if (typeof memoryContext !== 'string') {
        console.log(`Memory topics count: ${memoryContext.topics ? Object.keys(memoryContext.topics).length : 0}`);
      }
    }
    
    if (previousMessages && previousMessages.length > 0) {
      console.log(`Previous messages provided: ${previousMessages.length}`);
    }
    
    // Prepare content with context from all sources
    const requestContent = await prepareContent(message, emotionalTone, memoryContext, behaviorRules, previousMessages);
    
    console.log('Sending request to Gemini API...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestContent),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }
    
    const data: GeminiResponse = await response.json();
    console.log('Received response from Gemini API');
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      const responseText = data.candidates[0].content.parts[0].text;
      console.log(`Generated response (${responseText.length} chars)`);
      return responseText;
    } else {
      throw new Error("Invalid response format from Gemini API");
    }
  } catch (error) {
    console.error('Error generating response from Gemini:', error);
    return "I seem to be having trouble connecting with my thoughts right now. Can you give me a moment?";
  }
}

// Function to analyze emotional tone
export async function analyzeEmotionalTone(message: string): Promise<string> {
  try {
    const apiKey = await getApiKey();
    const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;
    
    const requestContent = {
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze the emotional tone of this message. Respond ONLY with a single emotion word like 'happy', 'sad', 'excited', 'anxious', 'calm', 'frustrated', 'hopeful', 'confused', etc. Don't include any explanation or additional text." },
            { text: message }
          ]
        }
      ]
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestContent),
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text.trim().toLowerCase();
    } else {
      return "neutral";
    }
  } catch (error) {
    console.error('Error analyzing emotional tone:', error);
    return "neutral";
  }
}

// Generate AI-powered summary of conversation for admin review
export async function generateConversationSummary(messages: any[]): Promise<string> {
  try {
    const apiKey = await getApiKey();
    const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;
    
    // Format messages into a readable conversation format
    const conversationText = messages.map(message => {
      const role = message.isFromUser ? "User" : "Mohsin";
      return `${role}: ${message.content}`;
    }).join("\n\n");
    
    const prompt = `
      You are an AI assistant helping an admin review conversation logs between users and Mohsin (speaking in first person).
      Please analyze the following conversation and provide a concise summary that includes:
      
      1. Main topics discussed
      2. User's apparent emotional states throughout
      3. Any notable patterns in how Mohsin responded
      4. Key insights about the user that might be valuable for personalization
      5. Recommendations for improving Mohsin's responses in the future
      
      Format your summary with clear headings and bullet points. Be concise but thorough.
      
      CONVERSATION LOG:
      ${conversationText}
    `;
    
    const requestContent = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestContent),
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Invalid response format from Gemini API");
    }
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return "Unable to generate summary at this time. Please try again later.";
  }
}
