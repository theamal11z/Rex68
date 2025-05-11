// triggerPhraseUtils.ts
// Utility functions for trigger phrase detection and mode switching
import { apiRequest } from './queryClient';

export interface TriggerPhrase {
  id: number;
  phrase: string;
  guideline: string;
  personality: string;
  identity?: string;
  purpose?: string;
  audience?: string;
  task?: string;
  examples?: string;
  category?: string;     // Optional field for categorizing triggers
  priority?: number;     // Optional priority level for trigger activation
  created_at?: string;   // Creation timestamp
  updated_at?: string;   // Last update timestamp
  active?: boolean;      // Whether trigger is active
  metadata?: string;     // Any additional JSON metadata
}

// Fetch all trigger phrases from the backend
export async function fetchTriggerPhrases(): Promise<TriggerPhrase[]> {
  const response = await apiRequest('GET', '/api/trigger-phrases');
  return await response.json();
}

// Detects if a message contains any trigger phrase (case-insensitive, word boundary)
export function detectTriggerPhrase(message: string, triggerPhrases: TriggerPhrase[]): TriggerPhrase | null {
  for (const trigger of triggerPhrases) {
    const regex = new RegExp(`\\b${escapeRegExp(trigger.phrase)}\\b`, 'i');
    if (regex.test(message)) {
      return trigger;
    }
  }
  return null;
}

// Escapes regex special characters in phrases
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Given a detected trigger, returns mode switching info
export function getModeSwitchInfo(trigger: TriggerPhrase) {
  return {
    guideline: trigger.guideline,
    personality: trigger.personality,
    identity: trigger.identity,
    purpose: trigger.purpose,
    audience: trigger.audience,
    task: trigger.task,
    examples: trigger.examples,
  };
}
