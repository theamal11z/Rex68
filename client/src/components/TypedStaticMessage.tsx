import { useState, useEffect } from 'react';

interface TypedStaticMessageProps {
  text: string;
  typingSpeed?: number;
  className?: string;
  cursorClassName?: string;
  onFinishedTyping?: () => void;
}

const TypedStaticMessage: React.FC<TypedStaticMessageProps> = ({
  text,
  typingSpeed = 50, // Default typing speed in ms
  className = '',
  cursorClassName = 'cursor ml-1 inline-block w-2 h-4 bg-terminal-text animate-blink',
  onFinishedTyping
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!text) return;

    setDisplayText(''); // Reset if text changes (though not expected for static)
    setIsTyping(true);
    let index = 0;

    const typingInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(prev => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        if (onFinishedTyping) {
          onFinishedTyping();
        }
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [text, typingSpeed, onFinishedTyping]);

  return (
    <span className={className}>
      {displayText}
      {isTyping && <span className={cursorClassName}></span>}
    </span>
  );
};

export default TypedStaticMessage;
