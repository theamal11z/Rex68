import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { fetchTriggerPhrases, TriggerPhrase } from '@/lib/triggerPhraseUtils';
import { updateMemoryFromMessage } from '@/lib/memoryManager';
import { generateTriggerResponse } from '@/lib/triggerGemini';
import { Message, Memory, Setting } from '@/types';
import useLocalStorage from './useLocalStorage';

interface UseTriggerConversationResult {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string, triggerName: string) => Promise<void>;
  userId: string;
  setUserId: (userId: string) => void;
  availableTriggers: TriggerPhrase[];
  activeTrigger: TriggerPhrase | null;
  setActiveTrigger: (trigger: TriggerPhrase | null) => void;
}

export default function useTriggerConversation(): UseTriggerConversationResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useLocalStorage<string>('rex_user_id', '');
  const [memory, setMemory] = useState<Memory | null>(null);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [availableTriggers, setAvailableTriggers] = useState<TriggerPhrase[]>([]);
  const [activeTrigger, setActiveTrigger] = useState<TriggerPhrase | null>(null);

  // Fetch triggers on mount
  useEffect(() => {
    const fetchTriggers = async () => {
      try {
        const triggers = await fetchTriggerPhrases();
        setAvailableTriggers(triggers);
      } catch (error) {
        console.error('Failed to fetch triggers:', error);
      }
    };

    fetchTriggers();
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiRequest('GET', '/api/settings', undefined);
        const settingsData = await response.json();
        setSettings(settingsData);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Initialize or reset user ID if needed
  useEffect(() => {
    if (!userId) {
      // Generate a random user ID
      setUserId(`user_${Math.random().toString(36).substring(2, 15)}`);
    }
  }, [userId, setUserId]);

  // Reset messages when active trigger changes
  useEffect(() => {
    setMessages([]);
    
    // Add a system message about the active trigger
    if (activeTrigger) {
      const systemMessage: Message = {
        id: 0, // Will be replaced when saved
        userId,
        content: `Trigger mode activated: ${activeTrigger.phrase}`,
        isFromUser: 0,
        timestamp: new Date(),
      };
      setMessages([systemMessage]);
    }
  }, [activeTrigger, userId]);

  // Fetch memory when userId changes
  useEffect(() => {
    const fetchMemory = async () => {
      if (!userId) return;
      
      try {
        const response = await apiRequest('GET', `/api/memory/${userId}`, undefined);
        if (response.ok) {
          const memoryData = await response.json();
          setMemory(memoryData);
        }
      } catch (error) {
        console.error('Failed to fetch memory:', error);
      }
    };

    fetchMemory();
  }, [userId]);

  // Update memory with context
  const updateMemory = useCallback(async (content: string, isUserMessage: boolean = true) => {
    if (!userId) return null;
    
    try {
      // Create message object for memory update
      const messageObj: Partial<Message> = {
        userId,
        content,
        isFromUser: isUserMessage ? 1 : 0,
        timestamp: new Date()
      };
      
      // Use enhanced memory management - always use neutral tone for trigger conversations
      // as the tone should be determined by the trigger definition instead
      const updatedMemory = await updateMemoryFromMessage(
        userId,
        messageObj as Message,
        'neutral', // Default tone for trigger conversations
        memory
      );
      
      if (updatedMemory) {
        setMemory(updatedMemory);
        return updatedMemory;
      }
    } catch (error) {
      console.error('Failed to update memory:', error);
    }
    
    return null;
  }, [userId, memory]);

  // Send a message in the context of a trigger
  const sendMessage = useCallback(async (content: string, triggerName: string) => {
    if (!content.trim() || !userId) return;
    
    setLoading(true);
    
    // Get trigger if not active
    if (!activeTrigger && triggerName) {
      const matchingTrigger = availableTriggers.find(t => 
        t.phrase.toLowerCase() === triggerName.toLowerCase());
      if (matchingTrigger) {
        setActiveTrigger(matchingTrigger);
      }
    }

    // Use active trigger or find by name
    const trigger = activeTrigger || 
      availableTriggers.find(t => t.phrase.toLowerCase() === triggerName.toLowerCase());
    
    if (!trigger) {
      console.error(`Trigger "${triggerName}" not found`);
      setLoading(false);
      return;
    }
    
    // Add user message to UI
    const userMessage: Partial<Message> = {
      userId,
      content,
      isFromUser: 1,
      timestamp: new Date(),
    };
    
    // Optimistically update UI
    setMessages(prev => [...prev, userMessage as Message]);
    
    try {
      // Save user message to backend
      const userMessageResponse = await apiRequest('POST', '/api/messages', userMessage);
      const savedUserMessage = await userMessageResponse.json();
      
      // Update memory with user's message (isUserMessage=true is the default)
      await updateMemory(content);
      
      // Prepare memory context object
      const memoryContextObj = memory ? memory.context : null;
      
      // Generate response using the trigger-specific logic
      const responseText = await generateTriggerResponse(
        content,
        trigger,
        memoryContextObj,
        messages
      );
      
      // Create response message
      const responseMessage: Partial<Message> = {
        userId,
        content: responseText,
        isFromUser: 0,
        timestamp: new Date(),
      };
      
      // Save response to backend
      const responseMessageResponse = await apiRequest('POST', '/api/messages', responseMessage);
      const savedResponseMessage = await responseMessageResponse.json();
      
      // Also update memory with AI's response
      await updateMemory(responseText, false);
      
      // Update UI with the saved messages
      setMessages(prev => [
        ...prev.filter(m => m.id || m.content !== content), // Remove optimistic message
        savedUserMessage,
        savedResponseMessage
      ]);
    } catch (error) {
      console.error('Error in trigger conversation:', error);
      
      // Show an error message
      const errorMessage: Partial<Message> = {
        userId,
        content: "I'm having trouble with this trigger mode right now. Let's try again?",
        isFromUser: 0,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage as Message]);
    } finally {
      setLoading(false);
    }
  }, [userId, memory, messages, activeTrigger, availableTriggers, updateMemory]);

  return {
    messages,
    loading,
    sendMessage,
    userId,
    setUserId,
    availableTriggers,
    activeTrigger,
    setActiveTrigger
  };
}
