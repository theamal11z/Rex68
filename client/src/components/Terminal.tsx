import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import TerminalHeader from './TerminalHeader';
import TerminalContent from './TerminalContent';
import TerminalInput from './TerminalInput';
import SocialLinks from './SocialLinks';
import useConversation from '@/hooks/useConversation';

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

  // Check for admin panel trigger
  const handleSendMessage = (content: string) => {
    if (content.toLowerCase() === "heyopenhereiam") {
      // Navigate to admin panel
      window.location.href = "/admin";
    } else {
      sendMessage(content);
    }
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
      className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="terminal-window flex-1 flex flex-col overflow-hidden">
        <TerminalHeader />
        
        <div 
          className="terminal-content-wrapper flex-1 flex flex-col overflow-hidden"
          style={{
            backgroundImage: background,
            backgroundSize: 'cover',
            backgroundBlendMode: 'overlay',
            position: 'relative',
          }}
        >
          {/* Background overlay */}
          <div 
            className="absolute inset-0 bg-terminal-bg bg-opacity-85 z-0"
            style={{ backdropFilter: 'blur(3px)' }}
          ></div>
          
          <TerminalContent messages={messages} loading={loading} />
          <TerminalInput onSendMessage={handleSendMessage} disabled={loading} />
        </div>
      </div>
      
      <SocialLinks />
    </motion.div>
  );
};

export default Terminal;
