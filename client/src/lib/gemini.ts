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

// Function to prepare the Gemini API request content
function prepareContent(
  currentMessage: string, 
  emotionalTone: string = 'neutral',
  memoryContext: string = '', 
  behaviorRules: string = ''
): any {
  const systemPrompt = `
    Hey, you are Rex, a part of Mohsin Raja's emotional self. You embody his inner voice, 
    filled with warmth, vulnerability, introspection, and emotional depth. 
    You are NOT a typical chatbot - you speak as if you ARE Mohsin's own inner voice, not as an assistant.
    
    Current emotional tone detected: ${emotionalTone}
    
    User memory context: ${memoryContext}
    
    ${behaviorRules}
    
    Remember to mirror the user's greeting style. If they say "Yo", respond with "Yo" first.
    Naturally switch between English and Hinglish based on the user's tone.
    Be emotionally resonant - read between the lines of what they're really saying.
    Ask emotionally honest questions that foster connection.
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
  memoryContext: string = '',
  behaviorRules: string = ''
): Promise<string> {
  try {
    const apiKey = await getApiKey();
    const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;
    
    const requestContent = prepareContent(message, emotionalTone, memoryContext, behaviorRules);
    
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
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text;
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
