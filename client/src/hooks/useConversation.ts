import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { generateGeminiResponse, analyzeEmotionalTone } from '@/lib/gemini';
import { updateMemoryFromMessage } from '@/lib/memoryManager';
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

  // Update memory with context - enhanced version
  const updateMemory = useCallback(async (content: string, emotionalTone: string) => {
    if (!userId) return null;
    
    try {
      console.log(`Updating memory for user ${userId} with emotional tone: ${emotionalTone}`);
      
      // Create message object for memory update
      const messageObj: Partial<Message> = {
        userId,
        content,
        isFromUser: 1,
        timestamp: new Date()
      };
      
      // Use enhanced memory management
      const updatedMemory = await updateMemoryFromMessage(
        userId,
        messageObj as Message,
        emotionalTone,
        memory
      );
      
      if (updatedMemory) {
        console.log('Memory updated successfully with structured data');
        setMemory(updatedMemory);
        return updatedMemory;
      } else {
        console.warn('Memory update returned null');
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
      
      // Memory is now updated earlier in the flow with emotional tone included
      
      // Analyze emotional tone
      const emotionalTone = await analyzeEmotionalTone(content);
      
      // Prepare memory context string
      const memoryContextString = memory ? JSON.stringify(memory.context) : '';
      
      // Get behavior rules
      const behaviorRules = getBehaviorRules();
      
      // Update memory with user's message and emotional tone
      await updateMemory(content, emotionalTone);
      
      // Prepare memory context object
      const memoryContextObj = memory ? memory.context : null;
      
      // Generate response from Gemini with enhanced context management
      const responseText = await generateGeminiResponse(
        content, 
        emotionalTone,
        memoryContextObj,
        behaviorRules,
        messages // Pass previous messages for context
      );
      
      // Create Mohsin's response
      const mohsinMessage: Partial<Message> = {
        userId,
        content: responseText,
        isFromUser: 0,
        timestamp: new Date(),
      };
      
      // Save Mohsin's response to backend
      const mohsinMessageResponse = await apiRequest('POST', '/api/messages', mohsinMessage);
      const savedMohsinMessage = await mohsinMessageResponse.json();
      
      // Update UI with the saved messages
      setMessages(prev => [
        ...prev.filter(m => m.id || m.content !== content), // Remove optimistic message
        savedUserMessage,
        savedMohsinMessage
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
