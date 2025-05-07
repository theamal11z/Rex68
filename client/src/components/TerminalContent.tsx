import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Message from './Message';
import { Message as MessageType } from '@/types';

interface TerminalContentProps {
  messages: MessageType[];
  loading: boolean;
}

const THE_AMAL_ASCII = `
  ████████╗██╗  ██╗███████╗     █████╗ ███╗   ███╗ █████╗ ██╗
  ╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗████╗ ████║██╔══██╗██║
     ██║   ███████║█████╗      ███████║██╔████╔██║███████║██║
     ██║   ██╔══██║██╔══╝      ██╔══██║██║╚██╔╝██║██╔══██║██║
     ██║   ██║  ██║███████╗    ██║  ██║██║ ╚═╝ ██║██║  ██║███████╗
     ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝

                the-amal
`;

const TerminalContent: React.FC<TerminalContentProps> = ({ messages, loading }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom on new messages
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={contentRef} 
      className="terminal-content p-3 sm:p-4 overflow-y-auto"
      style={{ height: '70vh', minHeight: '200px' }}
    >
      <div className="message-container space-y-2 pb-4 relative z-10">
        {/* Welcome ASCII Art */}
        <motion.div
          className="mb-4 overflow-x-auto max-w-full ml-1 sm:ml-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          aria-label="ASCII Art"
        >
          <pre
            className="text-terminal-cyan font-mono select-none whitespace-pre break-words text-[0.65rem] sm:text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl min-w-max max-w-full"
            style={{ lineHeight: 1.1 }}
          >
            {THE_AMAL_ASCII}
          </pre>
        </motion.div>
        {/* System message */}
        <motion.div 
          className="text-terminal-muted text-sm italic mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          # A window into Mohsin's thoughts and reflections
        </motion.div>
        {/* Initial welcome message */}
        <motion.div 
          className="flex items-start mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="text-terminal-pink mr-2">mohsin@terminal:~$</div>
          <motion.div 
            className="text-terminal-green font-mono text-base sm:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.2 }}
          >
            Welcome to my terminal. I'm Mohsin. How can we connect today?
          </motion.div>
        </motion.div>
        
        {/* Conversation messages */}
        {messages.map((message, index) => (
          <Message 
            key={message.id || `temp-${index}`} 
            message={message} 
            isLast={index === messages.length - 1 && !message.isFromUser}
          />
        ))}
        
        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start mt-4">
            <div className="text-terminal-pink mr-2">mohsin@terminal:~$</div>
            <div className="text-terminal-text">
              <span className="typing-dots">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalContent;
