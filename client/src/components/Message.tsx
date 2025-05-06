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

  // Typing animation for Rex's messages
  useEffect(() => {
    if (message.isFromUser || !isLast) {
      setDisplayText(message.content);
      return;
    }

    let index = 0;
    setIsTyping(true);
    setDisplayText('');

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
      className="flex items-start mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`mr-2 ${message.isFromUser ? 'text-terminal-orange' : 'text-terminal-pink'}`}>
        {message.isFromUser ? 'user@rex:~$' : 'rex@mohsin:~$'}
      </div>
      <div 
        ref={textRef}
        className="text-terminal-text whitespace-pre-wrap"
      >
        {displayText}
        {isTyping && (
          <span className="cursor ml-1 inline-block w-2 h-4 bg-terminal-text animate-blink"></span>
        )}
      </div>
    </motion.div>
  );
};

export default Message;
