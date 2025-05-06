import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Message from './Message';
import { Message as MessageType } from '@/types';

interface TerminalContentProps {
  messages: MessageType[];
  loading: boolean;
}

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
        <div className="text-terminal-cyan text-xs leading-tight mb-4 font-mono whitespace-pre">
{`  ██████╗░███████╗██╗░░██╗
  ██╔══██╗██╔════╝╚██╗██╔╝
  ██████╔╝█████╗░░░╚███╔╝░
  ██╔══██╗██╔══╝░░░██╔██╗░
  ██║░░██║███████╗██╔╝╚██╗
  ╚═╝░░╚═╝╚══════╝╚═╝░░╚═╝`}
        </div>
        
        {/* System message */}
        <div className="text-terminal-muted text-sm italic mb-4">
          # A window into Mohsin's thoughts and reflections
        </div>
        
        {/* Initial welcome message */}
        <div className="flex items-start mb-6">
          <div className="text-terminal-pink mr-2">mohsin@terminal:~$</div>
          <motion.div 
            className="text-terminal-green font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Welcome to my terminal. I'm Mohsin. How can we connect today?
          </motion.div>
        </div>
        
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
