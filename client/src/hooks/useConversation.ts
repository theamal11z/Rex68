import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { generateGeminiResponse, analyzeEmotionalTone } from '@/lib/gemini';
import { Message, Memory, Setting } from '@/types';
import useLocalStorage from './useLocalStorage';

interface UseConversationResult {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string) => Promise<void>;
  userId: string;
  setUserId: (userId: string) => void;
}

export default function useConversation(): UseConversationResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useLocalStorage<string>('rex_user_id', '');
  const [memory, setMemory] = useState<Memory | null>(null);
  const [settings, setSettings] = useState<Setting[]>([]);

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

  // Fetch messages when userId changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const response = await apiRequest('GET', `/api/messages/${userId}`, undefined);
        const messagesData = await response.json();
        setMessages(messagesData);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId]);

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

  // Get behavior rules from settings
  const getBehaviorRules = useCallback(() => {
    const behaviorSetting = settings.find(s => s.key === 'behavior_rules');
    return behaviorSetting ? behaviorSetting.value : '';
  }, [settings]);

  // Update memory with context
  const updateMemory = useCallback(async (content: string) => {
    if (!userId) return;
    
    // Create or update memory context
    const context = memory?.context || {};
    
    // Attempt to analyze message for relevant context
    // This is a simplified version - in a real app, you'd want more sophisticated context extraction
    const currentDate = new Date().toISOString();
    
    // Update context with the latest message
    const updatedContext = {
      ...context,
      lastMessage: content,
      lastInteractionDate: currentDate,
      interactionCount: (context.interactionCount || 0) + 1,
    };
    
    try {
      const response = await apiRequest('POST', '/api/memory', {
        userId,
        context: updatedContext
      });
      
      if (response.ok) {
        const updatedMemory = await response.json();
        setMemory(updatedMemory);
        return updatedMemory;
      }
    } catch (error) {
      console.error('Failed to update memory:', error);
    }
    
    return null;
  }, [userId, memory]);

  // Send a message and get a response
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !userId) return;
    
    setLoading(true);
    
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
      
      // Update memory with user's message
      await updateMemory(content);
      
      // Analyze emotional tone
      const emotionalTone = await analyzeEmotionalTone(content);
      
      // Prepare memory context string
      const memoryContextString = memory ? JSON.stringify(memory.context) : '';
      
      // Get behavior rules
      const behaviorRules = getBehaviorRules();
      
      // Generate response from Gemini
      const responseText = await generateGeminiResponse(
        content, 
        emotionalTone,
        memoryContextString,
        behaviorRules
      );
      
      // Create Rex's response
      const rexMessage: Partial<Message> = {
        userId,
        content: responseText,
        isFromUser: 0,
        timestamp: new Date(),
      };
      
      // Save Rex's response to backend
      const rexMessageResponse = await apiRequest('POST', '/api/messages', rexMessage);
      const savedRexMessage = await rexMessageResponse.json();
      
      // Update UI with the saved messages
      setMessages(prev => [
        ...prev.filter(m => m.id || m.content !== content), // Remove optimistic message
        savedUserMessage,
        savedRexMessage
      ]);
    } catch (error) {
      console.error('Error in conversation:', error);
      
      // Show an error message
      const errorMessage: Partial<Message> = {
        userId,
        content: "I'm having trouble connecting to my thoughts right now. Can we try again?",
        isFromUser: 0,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage as Message]);
    } finally {
      setLoading(false);
    }
  }, [userId, updateMemory, memory, getBehaviorRules]);

  return {
    messages,
    loading,
    sendMessage,
    userId,
    setUserId
  };
}
