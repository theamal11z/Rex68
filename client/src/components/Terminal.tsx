import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import TerminalHeader from './TerminalHeader';
import TerminalContent from './TerminalContent';
import TerminalInput from './TerminalInput';
import SocialLinks from './SocialLinks';
import useConversation from '@/hooks/useConversation';
import { fetchTriggerPhrases } from '@/lib/triggerPhraseUtils';

// Array of background patterns
const BACKGROUNDS = [
  "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1000&q=80')",
  "url('https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1000&q=80')",
  "url('https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=1000&q=80')",
  "url('https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?auto=format&fit=crop&w=1000&q=80')",
];

const Terminal: React.FC = () => {
  const { messages, loading, sendMessage } = useConversation();
  const [background, setBackground] = useState(BACKGROUNDS[0]);
  const [, setLocation] = useLocation();
  const [availableTriggers, setAvailableTriggers] = useState<string[]>([]);

  // Load available triggers on mount
  useEffect(() => {
    const loadTriggers = async () => {
      try {
        const triggers = await fetchTriggerPhrases();
        setAvailableTriggers(triggers.map(t => t.phrase.toLowerCase()));
      } catch (error) {
        console.error('Failed to load triggers:', error);
      }
    };
    loadTriggers();
  }, []);

  // Check for admin panel or trigger command
  const handleSendMessage = (content: string) => {
    // Check for admin trigger
    if (content.toLowerCase() === "heyopenhereiam") {
      // Navigate to admin panel
      window.location.href = "/admin";
      return;
    }
    
    // Check for trigger command format: /trigger triggerName
    if (content.startsWith('/trigger ')) {
      const triggerName = content.substring(9).trim().toLowerCase();
      if (triggerName) {
        // Check if this is a valid trigger
        if (availableTriggers.includes(triggerName)) {
          // Redirect to trigger conversation page with the trigger name as a parameter
          setLocation(`/trigger?name=${encodeURIComponent(triggerName)}`);
          return;
        } else {
          // Invalid trigger name, send as normal message with a note
          sendMessage(`${content} (Note: This trigger phrase is not recognized)`);
          return;
        }
      }
    }
    
    // Normal message
    sendMessage(content);
  };

  // Rotate backgrounds periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = BACKGROUNDS.indexOf(background);
      const nextIndex = (currentIndex + 1) % BACKGROUNDS.length;
      setBackground(BACKGROUNDS[nextIndex]);
    }, 60000); // Change every minute

    return () => clearInterval(interval);
  }, [background]);

  return (
    <motion.div
      className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl flex flex-col items-center min-h-screen"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div className="terminal-window relative w-full max-w-2xl rounded-2xl shadow-2xl border border-terminal-muted bg-terminal-dark/80 backdrop-blur-md overflow-hidden">
        <TerminalHeader />
        <div 
          className="terminal-content-wrapper flex flex-col relative"
          style={{
            backgroundImage: `${background}, linear-gradient(135deg, rgba(30,30,40,0.85) 60%, rgba(80,0,120,0.3))`,
            backgroundSize: 'cover',
            backgroundBlendMode: 'overlay',
            minHeight: '500px',
          }}
        >
          {/* Gradient overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-terminal-bg/90 to-terminal-purple/40 z-0 pointer-events-none"
            style={{ backdropFilter: 'blur(4px)' }}
          ></div>
          {/* Manual background cycle button */}
          <button
            className="absolute top-3 right-3 z-20 bg-terminal-cyan/80 hover:bg-terminal-purple/80 text-black px-2 py-1 rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-terminal-orange"
            title="Change background"
            onClick={() => {
              const currentIndex = BACKGROUNDS.indexOf(background);
              setBackground(BACKGROUNDS[(currentIndex + 1) % BACKGROUNDS.length]);
            }}
            aria-label="Change background"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a9 9 0 1012.364 0M12 2v10" /></svg>
          </button>
          <TerminalContent messages={messages} loading={loading} />
          <TerminalInput onSendMessage={handleSendMessage} disabled={loading} />
        </div>
      </div>
      <div className="mt-4 w-full flex justify-center">
        <SocialLinks />
      </div>
    </motion.div>
  );
};

export default Terminal;
