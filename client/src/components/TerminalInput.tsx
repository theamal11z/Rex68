import { useState, KeyboardEvent } from 'react';

interface TerminalInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

const TerminalInput: React.FC<TerminalInputProps> = ({ onSendMessage, disabled }) => {
  const [inputText, setInputText] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputText.trim() && !disabled) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="bg-terminal-dark p-2 sm:p-4 border-t border-terminal-muted sticky bottom-0 left-0 right-0 z-20">
      <div className="flex flex-wrap sm:flex-nowrap items-center">
        <div className="text-terminal-orange mr-2 text-sm sm:text-base whitespace-nowrap">user@rex:~$</div>
        <div className="flex-1 flex items-center w-full mt-1 sm:mt-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="bg-transparent border-none outline-none w-full text-terminal-text placeholder-terminal-muted text-sm sm:text-base"
            placeholder={disabled ? "Wait for Rex to respond..." : "Type your message..."}
          />
          {!disabled && <div className="cursor w-1.5 sm:w-2 h-3.5 sm:h-4 bg-terminal-text animate-blink ml-1"></div>}
        </div>
      </div>
    </div>
  );
};

export default TerminalInput;
