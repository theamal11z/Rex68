import { GeminiResponse } from '@/types';
import { getApiKey } from './gemini';

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function sendGuidelineRequest(requestContent: any): Promise<string> {
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

export async function arrangeGuidelinesWithGemini({ guidelines, userMessage }: { guidelines: string[], userMessage: string }): Promise<string[]> {
  const prompt = `Here is a list of guidelines and rules for responding. Please organize them by priority and relevance for the following user message. Output a checklist or ordered list.\n\nGuidelines:\n${guidelines.join("\n")}\n\nUser message: ${userMessage}`;
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
  const checklist = await sendGuidelineRequest(requestContent);
  return checklist.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

export async function enforceGuidelinesWithGemini({ checklist, draftResponse }: { checklist: string[], draftResponse: string }): Promise<{ compliant: boolean, corrections: string, improved: string }> {
  const prompt = `Here is a draft response and the organized guideline checklist. Check if the response follows all guidelines. If not, list which guidelines are violated and suggest corrections. Then, regenerate a new response that fully follows the checklist.\n\nChecklist:\n${checklist.join("\n")}\n\nDraft response:\n${draftResponse}`;
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
  const output = await sendGuidelineRequest(requestContent);
  // Try to parse for improved response and corrections
  // (You may want to parse this more robustly in production)
  const improvedMatch = output.match(/Regenerated Response:(.*)$/s);
  const improved = improvedMatch ? improvedMatch[1].trim() : output.trim();
  const corrections = output.replace(improvedMatch ? improvedMatch[0] : '', '').trim();
  const compliant = !corrections.toLowerCase().includes('violate');
  return { compliant, corrections, improved };
}
