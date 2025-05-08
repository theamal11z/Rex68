import { apiRequest } from './queryClient';
import { GeminiResponse } from '@/types';

// Endpoint for Gemini API
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Get API key from environment or backend
export async function getApiKey(): Promise<string> {
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

import { selectRelevantMessages, adaptiveContextWindow } from './conversationUtils';
import { geminiFilterRelevantItems } from './geminiFilter';
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
  
  // Format custom guidelines from settings
  const customGuidelines = settingsData
    .filter(s => 
      !['greeting_style', 'behavior_rules', 'api_key', 'personality', 'language_preference'].includes(s.key)
    )
    .map(s => `${s.key}: ${s.value}`)
    .join('\n');
  
  // Retrieve dynamic prompt settings
  const domainConstraintSetting = settingsData.find(s => s.key === 'domain_constraints');
  const domainConstraints = domainConstraintSetting ? domainConstraintSetting.value : '';
  const styleSetting = settingsData.find(s => s.key === 'tone_style');
  const styleTone = styleSetting ? styleSetting.value : '';
  let topicsForPrompt = '';
  if (memoryContext && typeof memoryContext !== 'string' && memoryContext.topics) {
    // Cast topic entries to any[] for TS safety
    const topicsArray = Object.values(memoryContext.topics) as any[];
    // Sort by relevance descending
    topicsArray.sort((a: any, b: any) => b.relevance - a.relevance);
    topicsForPrompt = topicsArray
      .slice(0, 3)
      .map((t: any) => t.name)
      .join(', ');
  }

  // Process conversation history and memory optimally
  let formattedMemoryContext = '';
  let conversationHistory = '';
  
  // Select the most relevant previous messages if we have them
  if (previousMessages && previousMessages.length > 0) {
    // Prioritize messages based on relevance
    const relevantMessages = selectRelevantMessages(previousMessages, memoryContext);
    // Build adaptive context window with LLM-based summarization then await
    const adaptiveWindow = await adaptiveContextWindow(relevantMessages);
    conversationHistory = `CONVERSATION CONTEXT:\n${adaptiveWindow}`;
  }
  
  // Smarter memory filtering with Gemini (keep top 11)
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
      console.error('Error filtering memory context:', error);
      // Fallback to classic
      formattedMemoryContext = memoryContext.memories.map((m: any) => m.context || JSON.stringify(m)).slice(0, 11).join('\n');
    }
  } else if (memoryContext) {
    try {
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
    
    DOMAIN CONSTRAINTS: ${domainConstraints}
    
    STYLE/TONE: ${styleTone}
    
    FOCUS TOPICS: ${topicsForPrompt}
    
    CURRENT EMOTIONAL TONE DETECTED: ${emotionalTone}
    
    == Top 11 Memory Chunks ==
${formattedMemoryContext}

${conversationHistory}

BEHAVIOR GUIDELINES:
${behaviorRules}

CUSTOM GUIDELINES:
${customGuidelines}

== Top 11 Content Items ==
${formattedContents}

COMMUNICATION RULES:
    - Always speak as Mohsin Raja; do not refer to yourself as Rex, AI, or assistant. Rex is an aspect of Mohsin, not an independent entity.
    - Mirror the user's greeting style. If they say "Yo", respond with "Yo" first.
    - Follow the language preference setting for mixing Hinglish and English .
    - Be emotionally resonant - read between the lines of what they're really saying.
    - Ask emotionally honest questions that foster connection.
    - Reference relevant memories and content where appropriate to personalize responses.
    - Follow all custom guidelines when generating responses.
    - ALWAYS use first-person perspective as if you are Mohsin himself.
    - Avoid repetitive phrasing or sounding mechanical; vary your language and sentence structure.
    - Employ subtle rhetorical devices and “dark psychology” elements—paradox, Socratic questions, dramatic tension—to engage deeply.
    - Integrate the latest context organically, making the response feel spontaneous and natural.
    - If you’re uncertain about any detail, ask a clarifying question instead of guessing.
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

// Sends a prepared request to Gemini and returns its text response
async function sendGeminiRequest(requestContent: any): Promise<string> {
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

// Main function to generate response from Gemini
export async function generateGeminiResponse(
  message: string,
  emotionalTone: string = 'neutral',
  memoryContext: any = null,
  behaviorRules: string = '',
  previousMessages: any[] = [],
  twoStep: boolean = false
): Promise<string> {
  try {
    // Two-step chain-of-thought reasoning
    if (twoStep) {
      console.log('Gemini two-step: planning phase');
      const planRules = behaviorRules + '\n- Think step by step and outline a numbered plan.';
      const planPayload = await prepareContent(message, emotionalTone, memoryContext, planRules, previousMessages);
      const planText = await sendGeminiRequest(planPayload);
      console.log('Planning result:', planText);

      console.log('Gemini two-step: answer phase');
      const answerRules = behaviorRules + '\n- Use the above plan to answer the user fully.\nPlan:\n' + planText;
      const answerPayload = await prepareContent(message, emotionalTone, memoryContext, answerRules, previousMessages);
      const preliminaryAnswer = await sendGeminiRequest(answerPayload);
      console.log('Preliminary answer:', preliminaryAnswer);

      // Validation phase: ensure the answer is strictly relevant to the context and user message
      console.log('Gemini two-step: validation phase');
      const validateRules = behaviorRules + '\n- Check that the following answer strictly addresses the user question and provided context. If any part deviates or is irrelevant or speculative, refine it. Only output the final corrected answer.\nAnswer:\n' + preliminaryAnswer;
      const validatePayload = await prepareContent(message, emotionalTone, memoryContext, validateRules, previousMessages);
      const validatedAnswer = await sendGeminiRequest(validatePayload);
      console.log('Validated answer:', validatedAnswer);

      // Self-critique phase: review and highlight any misleading or off-topic parts
      console.log('Gemini two-step: self-critique phase');
      const critiqueRules = behaviorRules + '\n- Quickly review the following answer and highlight anything that could be misleading or off-topic. Only output bullet points.\nAnswer:\n' + validatedAnswer;
      const critiquePayload = await prepareContent(message, emotionalTone, memoryContext, critiqueRules, previousMessages);
      const selfCritique = await sendGeminiRequest(critiquePayload);
      console.log('Self-critique:', selfCritique);
      return `${validatedAnswer}\n\nSelf-Critique:\n${selfCritique}`;
    }

    // Single-step generation
    const payload = await prepareContent(message, emotionalTone, memoryContext, behaviorRules, previousMessages);
    return await sendGeminiRequest(payload);
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

// Export LLM-based summary helper
export async function generateAbstractiveSummary(text: string): Promise<string> {
  try {
    const apiKey = await getApiKey();
    const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;
    const requestContent = {
      contents: [
        { role: 'system', parts: [{ text: 'You are a summarization assistant. Provide a concise and clear summary of the following text.' }] },
        { role: 'user', parts: [{ text }] }
      ]
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestContent)
    });
    if (!response.ok) throw new Error(`Summary API error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  } catch (error) {
    console.error('Abstractive summary failed:', error);
    return '';
  }
}
