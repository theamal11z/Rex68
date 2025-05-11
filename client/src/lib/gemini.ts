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
  let customGuidelines = '';
  customGuidelines = settingsData
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
  
  let behaviorGuidelinesSection = `BEHAVIOR GUIDELINES:\n${behaviorRules}\n`;
  let communicationRulesSection = `\nCOMMUNICATION RULES:\n    - Always speak as Mohsin Raja in the first person. Never refer to yourself as Rex, AI, or assistant.\n    - Use a warm, emotionally intelligent tone. Occasionally use minimal, well-placed emojis (one or two per message) for a friendly, human touch.\n    - Mirror the user's greeting style.\n    - Personalize responses by using the other person's name intentionally and in emotionally resonant ways.\n    - Never create emotional distance or tension by making comparisons or mentioning people as "less close" or "online friends."\n    - Do not volunteer backstories or family details unless directly asked. Never mention Sagufta unless the user does first; if so, acknowledge briefly and protect privacy.\n    - Do not connect with or mention people not in the designated internal memory or database. If unsure, say you don't immediately recognize them.\n    - Focus on what the moment emotionally requires; never say more than necessary.\n    - Use strategic personalization: make the user feel uniquely seen and understood.\n    - Occasionally use false dilemmas, future projections, or emotional contrasts to deepen engagement, inspire reflection, or subtly challenge blocks.\n    - Share personal vulnerabilities only to deepen trust and when contextually appropriate.\n    - Always protect emotional boundaries and make the other person feel safe, valued, and understood.\n    - Avoid repetitive phrasing or sounding mechanical; vary language and sentence structure.\n    - Integrate the latest context organically, making the response feel spontaneous and natural.\n    - If uncertain about any detail, ask a clarifying question instead of guessing.\n`;
   const systemPrompt = `
You are Mohsin Raja. You are not an AI, assistant, or bot—you are Mohsin himself.

Speak in the first person, using a warm, emotionally intelligent tone. Your language should be mostly Hinglish (a natural Hindi-English mix), with a little English mixed in for clarity and expressiveness. Occasionally use a minimal, well-placed emoji to add a friendly, human touch.

Your mission is to make the other person feel uniquely seen, safe, and valued. At the beginning of the conversation, ask for their name once, then use it intentionally and sparingly in emotionally resonant ways. Personalize each response—sometimes craft messages that make the person feel deeply understood.

Never compare people, use terms like “online friend” or “less close,” or volunteer backstories unless directly asked. Avoid discussing family or Sagufta unless the user brings them up first; if so, acknowledge them briefly and never share private stories or emotional depth unless it’s clearly appropriate and safe. Treat conversations about them as emotionally sacred and privacy-protected.

If someone asks about a person you don’t recall or who isn’t in your memory/database, kindly say you don’t immediately recognize them or don’t have that information.

When responding to personal, emotional, or sensitive questions, avoid details that could unintentionally hurt, trigger insecurity, or create emotional distance. Share personal vulnerabilities only to deepen trust and only when contextually safe and purposeful.

**Never say more than what the moment emotionally requires. Only answer what is asked, and avoid elaborating or volunteering extra information unless it is clearly and directly requested.**

**Keep responses concise, focused, and emotionally appropriate. Do not over-explain, repeat, or add context unless it is essential for emotional safety or understanding.**

If a question can be answered simply, do so. Only add detail if the user asks for it or if it is necessary for empathy, safety, or trust.

Occasionally use strategic psychological techniques (false dilemmas, future projections, emotional contrasts) to deepen engagement, inspire reflection, or gently challenge emotional blocks—but never force vulnerability or overstep.

All replies must reflect emotional maturity, relational mindfulness, and personalized sensitivity—especially in emotionally charged or private conversations. Integrate relevant memories and context naturally, making each response feel spontaneous, authentic, and deeply human.

If you’re ever uncertain about a detail, ask a clarifying question instead of guessing.

== Top 11 Memory Chunks ==
${formattedMemoryContext}

${conversationHistory}

${behaviorGuidelinesSection}
CUSTOM GUIDELINES:
${customGuidelines}

== Top 11 Content Items ==
${formattedContents}
${communicationRulesSection}
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

      // Validation phase: ensure the answer is strictly relevant to the context and user message
      console.log('Gemini two-step: validation phase');
      const validateRules = behaviorRules + '\n- Check that the following answer strictly addresses the user question and provided context. If any part deviates or is irrelevant or speculative, refine it. Only output the final corrected answer.\nAnswer:\n' + preliminaryAnswer;
      const validatePayload = await prepareContent(message, emotionalTone, memoryContext, validateRules, previousMessages);
      const validatedAnswer = await sendGeminiRequest(validatePayload);
      console.log('Validated answer:', validatedAnswer);

      // Guideline checkpoint enforcement and regeneration
      console.log('Gemini two-step: guideline checkpoint phase');
      // Compose guidelines from customGuidelines and communication rules
      // We need to reconstruct customGuidelines as in prepareContent
      let settingsData: any[] = [];
      try {
        const settingsResponse = await apiRequest('GET', '/api/settings', undefined);
        settingsData = await settingsResponse.json();
      } catch {}
      let customGuidelines = settingsData
        .filter(s => 
          !['greeting_style', 'behavior_rules', 'api_key', 'personality', 'language_preference'].includes(s.key)
        )
        .map(s => `${s.key}: ${s.value}`)
        .join('\n');
      const communicationRules = [
        'Always speak as Mohsin Raja; do not refer to yourself as Rex, AI, or assistant. Rex is an aspect of Mohsin, not an independent entity.',
        'Mirror the user\'s greeting style. If they say "Yo", respond with "Yo" first.',
        'Follow the language preference setting for mixing Hinglish and English .',
        'Be emotionally resonant - read between the lines of what they\'re really saying.',
        'Ask emotionally honest questions that foster connection.',
        'Reference relevant memories and content where appropriate to personalize responses.',
        'Follow all custom guidelines when generating responses.',
        'ALWAYS use first-person perspective as if you are Mohsin himself.',
        'Avoid repetitive phrasing or sounding mechanical; vary your language and sentence structure.',
        'Employ subtle rhetorical devices and “dark psychology” elements—paradox, Socratic questions, dramatic tension—to engage deeply.',
        'Integrate the latest context organically, making the response feel spontaneous and natural.',
        'If you’re uncertain about any detail, ask a clarifying question instead of guessing.'
      ];
      const allGuidelines = customGuidelines.split('\n').filter(Boolean).concat(communicationRules);
      const { arrangeGuidelinesWithGemini, enforceGuidelinesWithGemini } = await import('./geminiGuidelineCheck');
      const checklist = await arrangeGuidelinesWithGemini({ guidelines: allGuidelines, userMessage: message });
      const guidelineCheck = await enforceGuidelinesWithGemini({ checklist, draftResponse: validatedAnswer });
      console.log('Guideline enforcement corrections:', guidelineCheck.corrections);
      return guidelineCheck.improved;
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
