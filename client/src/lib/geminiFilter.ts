import { GeminiResponse } from '@/types';
import { getApiKey } from './gemini'; // getApiKey must be exported from gemini.ts
import { apiRequest } from './queryClient';

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Helper to send a prompt to Gemini
async function sendFilterRequest(requestContent: any): Promise<string> {
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

// Filter content or memory with Gemini
export async function geminiFilterRelevantItems({
  items,
  userMessage,
  itemType = 'content',
  keep = 11,
}: {
  items: { [key: string]: any }[],
  userMessage: string,
  itemType?: string,
  keep?: number,
}): Promise<string[]> {
  const listString = items.map((item, idx) => `#${idx + 1}: ${item.content || item.text || JSON.stringify(item)}`).join("\n");
  const prompt = `Here is a list of ${itemType} items. For the user message below, select only the ${keep} most relevant items for answering it. Output a bullet list of the selected items (quote or summarize each, and reference the #number).\n\n${itemType.charAt(0).toUpperCase() + itemType.slice(1)} List:\n${listString}\n\nUser message: ${userMessage}`;
  const requestContent = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt }
        ]
      }
    ]
  };
  const filtered = await sendFilterRequest(requestContent);
  // Extract #numbers or bullet content
  const lines = filtered.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines;
}
