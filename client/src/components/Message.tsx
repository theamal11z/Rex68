import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Message as MessageType } from '@/types';

interface MessageProps {
  message: MessageType;
  isLast: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isLast }) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Typing animation for Mohsin's messages
  useEffect(() => {
    if (message.isFromUser || !isLast) {
      setDisplayText(message.content);
      return;
    }

    // Fix: Show first character immediately and start typing from index 1
    let index = 1;
    setIsTyping(true);
    setDisplayText(message.content.charAt(0) || '');

    const typingInterval = setInterval(() => {
      if (index < message.content.length) {
        setDisplayText(prev => prev + message.content.charAt(index));
        index++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 20); // Adjust speed as needed

    return () => clearInterval(typingInterval);
  }, [message, isLast]);

  // Auto-scroll when typing
  useEffect(() => {
    if (isTyping && textRef.current) {
      textRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayText, isTyping]);

  return (
    <motion.div
      className="flex flex-wrap items-start mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`mr-2 whitespace-nowrap text-sm sm:text-base ${message.isFromUser ? 'text-terminal-orange' : 'text-terminal-pink'}`}>
        {message.isFromUser ? 'user@terminal:~$' : 'mohsin@terminal:~$'}
      </div>
      <div 
        ref={textRef}
        className="text-terminal-text whitespace-pre-wrap break-words flex-1 min-w-0 text-sm sm:text-base pr-2 pl-1 sm:pl-2"
      >
        <span className="inline-block min-w-[1ch] overflow-visible">{displayText}</span>
        {isTyping && (
          <span className="cursor ml-1 inline-block w-2 h-4 bg-terminal-text animate-blink"></span>
        )}
      </div>
    </motion.div>
  );
};

export default Message;
