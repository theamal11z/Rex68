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
      className="terminal-content p-2 sm:p-4 overflow-y-auto flex-grow"
    >
      <div className="message-container space-y-2 pb-20 relative z-10">
        {/* Welcome ASCII Art - Hidden on smallest screens */}
        <div className="text-terminal-cyan text-xs leading-tight mb-4 font-mono whitespace-pre hidden sm:block">
{`  ██████╗░███████╗██╗░░██╗
  ██╔══██╗██╔════╝╚██╗██╔╝
  ██████╔╝█████╗░░░╚███╔╝░
  ██╔══██╗██╔══╝░░░██╔██╗░
  ██║░░██║███████╗██╔╝╚██╗
  ╚═╝░░╚═╝╚══════╝╚═╝░░╚═╝`}
        </div>
        
        {/* Smaller logo for mobile */}
        <div className="text-terminal-cyan text-lg font-bold mb-2 sm:hidden">
          REX
        </div>
        
        {/* System message */}
        <div className="text-terminal-muted text-sm italic mb-4">
          # A window into Mohsin's thoughts and reflections
        </div>
        
        {/* Initial welcome message */}
        <div className="flex items-start mb-6">
          <div className="text-terminal-pink mr-2">rex@mohsin:~$</div>
          <motion.div 
            className="text-terminal-green font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Welcome to Rex. I'm Mohsin's inner voice. How can I connect with you today?
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
            <div className="text-terminal-pink mr-2">rex@mohsin:~$</div>
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
