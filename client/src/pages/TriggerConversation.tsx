import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import useTriggerConversation from '@/hooks/useTriggerConversation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TriggerPhrase } from '@/lib/triggerPhraseUtils';
import { ChevronLeft, Send, Sparkles, User, Bot, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper function to parse query parameters
function getQueryParams() {
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(searchParams);
  }
  return {};
}

export default function TriggerConversation() {
  const { 
    messages, 
    loading, 
    sendMessage, 
    availableTriggers,
    activeTrigger,
    setActiveTrigger 
  } = useTriggerConversation();
  const [inputValue, setInputValue] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Handle trigger name from URL query on mount
  useEffect(() => {
    const params = getQueryParams();
    if (params.name && availableTriggers.length > 0) {
      const decodedName = decodeURIComponent(params.name);
      const trigger = availableTriggers.find(t => 
        t.phrase.toLowerCase() === decodedName.toLowerCase()
      );
      
      if (trigger) {
        setSelectedTrigger(trigger.phrase);
        setActiveTrigger(trigger);
      }
    }
  }, [availableTriggers, setActiveTrigger]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle trigger change
  const handleTriggerChange = (value: string) => {
    setSelectedTrigger(value);
    const trigger = availableTriggers.find(t => t.phrase === value) || null;
    setActiveTrigger(trigger);
    // Show trigger info when changing triggers
    // setShowInfo(true);
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeTrigger) return;

    await sendMessage(inputValue, activeTrigger.phrase);
    setInputValue('');
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle back button
  const handleBack = () => {
    setLocation('/');
  };

  

  return (
    <motion.div 
      className="flex flex-col h-screen max-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Stylish header with glass effect */}
      <header className="p-4 border-b bg-white/90 dark:bg-gray-800/90 backdrop-blur-md flex justify-between items-center sticky top-0 z-10 shadow-sm relative overflow-visible">
  {/* Decorative floating SVGs */}
  <svg className="absolute -top-8 -left-8 w-32 h-32 opacity-40 animate-float-slow pointer-events-none" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="url(#grad1)" />
    <defs>
      <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffb6ff" />
        <stop offset="100%" stopColor="#b28dff" />
      </linearGradient>
    </defs>
  </svg>
  <svg className="absolute -bottom-8 right-0 w-24 h-24 opacity-30 animate-float-fast pointer-events-none" viewBox="0 0 100 100">
    <rect x="10" y="10" width="80" height="80" rx="40" fill="url(#grad2)" />
    <defs>
      <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffd6e0" />
        <stop offset="100%" stopColor="#8ec5fc" />
      </linearGradient>
    </defs>
  </svg>
  <div className="flex items-center gap-3">
    <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full hover:bg-gradient-to-br hover:from-pink-200 hover:to-purple-200 dark:hover:from-pink-800 dark:hover:to-purple-800">
      <ChevronLeft className="h-6 w-6 text-pink-600 dark:text-pink-300" />
    </Button>
    <div className="flex items-center">
      <Sparkles className="h-7 w-7 mr-2 text-pink-400 animate-spin-slow" />
      <h1 className="text-3xl font-extrabold font-[Poppins,cursive] text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 drop-shadow-lg">
        {activeTrigger ? activeTrigger.phrase : ''}
      </h1>
    </div>
  </div>
        
        
      </header>

      

      {/* Messages area with beautiful animations */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-7 max-w-3xl mx-auto pb-2">
  <AnimatePresence initial={false}>
    {messages.map((message, index) => (
      <motion.div
        key={message.id || index}
        initial={{ opacity: 0, y: 30, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring', bounce: 0.25 }}
        className="flex flex-col"
      >
        <div className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`
              relative px-5 py-3 rounded-[2rem] shadow-xl max-w-[85%] sm:max-w-[70%] 
              ${message.isFromUser
                ? 'bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 text-white animate-bounce-in-right'
                : 'bg-white/90 dark:bg-slate-800/90 text-purple-900 dark:text-pink-100 border border-pink-200 dark:border-purple-800 animate-bounce-in-left'}
              font-semibold text-lg tracking-tight backdrop-blur-lg
            `}
            style={{
              borderBottomLeftRadius: message.isFromUser ? '2rem' : '0.5rem',
              borderBottomRightRadius: message.isFromUser ? '0.5rem' : '2rem',
              boxShadow: message.isFromUser
                ? '0 4px 24px 0 rgba(236, 72, 153, 0.15), 0 1.5px 6px 0 rgba(139, 92, 246, 0.11)'
                : '0 4px 24px 0 rgba(139, 92, 246, 0.09), 0 1.5px 6px 0 rgba(236, 72, 153, 0.09)'
            }}
          >
            {/* Avatar and timestamp */}
            <div className="flex items-center gap-2 mb-1 text-xs opacity-80">
              {!message.isFromUser ? (
                <>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="/avatar.png" alt="Rex" />
                    <AvatarFallback className="bg-pink-200 text-pink-700 dark:bg-pink-800 dark:text-pink-200">
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-pink-700 dark:text-pink-200 drop-shadow-sm">
                    {activeTrigger ? activeTrigger.phrase : ''}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-bold text-indigo-700 dark:text-indigo-200 drop-shadow-sm">You</span>
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-indigo-200 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                </>
              )}
              <span className="ml-auto text-xs italic opacity-70">
                {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            <div className="whitespace-pre-wrap break-words mt-2 font-semibold tracking-tight text-base">
              {message.content}
            </div>
          </div>
        </div>
      </motion.div>
    ))}
  </AnimatePresence>
  <div ref={messagesEndRef} />
</div>
      </ScrollArea>

      {/* Beautiful input area with subtle animations */}
      <footer className="p-6 border-t bg-gradient-to-r from-pink-100/80 via-purple-100/80 to-indigo-100/80 dark:from-pink-900/70 dark:via-purple-900/70 dark:to-indigo-900/70 backdrop-blur-lg shadow-inner">
  <motion.form 
    onSubmit={handleSubmit} 
    className="flex gap-3 max-w-2xl mx-auto items-center"
    initial={{ y: 30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.2 }}
  >
    <div className="relative flex-1">
      <Input
        placeholder={activeTrigger 
          ? `Type your creative message…` 
          : "Loading trigger..."}
        value={inputValue}
        onChange={handleInputChange}
        disabled={loading || !activeTrigger}
        className="flex-1 rounded-[2rem] px-6 py-3 border-2 border-pink-200 dark:border-purple-700 bg-white/80 dark:bg-slate-900/80 font-semibold text-lg shadow-lg focus:ring-4 focus:ring-pink-200 dark:focus:ring-purple-700 transition-all"
      />
      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-pink-400 dark:text-pink-300 animate-pulse">
        <Sparkles className="h-6 w-6" />
      </span>
    </div>
    <Button 
      type="submit" 
      disabled={loading || !activeTrigger || !inputValue.trim()}
      className="rounded-full px-6 py-3 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white text-lg font-extrabold shadow-xl transition-all duration-200"
      style={{ boxShadow: '0 2px 16px 0 rgba(236, 72, 153, 0.15), 0 1.5px 6px 0 rgba(139, 92, 246, 0.11)' }}
    >
      {loading ? (
        <div className="flex items-center gap-2 animate-pulse">
          <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
          <span>Sending…</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span>Send</span>
          <Send className="h-5 w-5" />
        </div>
      )}
    </Button>
  </motion.form>
</footer>
    </motion.div>
  );
}
