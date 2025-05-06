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
    <div className="bg-terminal-dark p-3 sm:p-4 border-t border-terminal-muted relative z-10">
      <div className="flex flex-wrap items-center">
        <div className="text-terminal-orange mr-2 whitespace-nowrap">user@rex:~$</div>
        <div className="flex-1 min-w-0 flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="bg-transparent border-none outline-none w-full text-terminal-text placeholder-terminal-muted"
            placeholder={disabled ? "Wait for Rex to respond..." : "Type your message..."}
          />
          {!disabled && <div className="cursor w-2 h-4 bg-terminal-text animate-blink ml-1 flex-shrink-0"></div>}
        </div>
      </div>
    </div>
  );
};

export default TerminalInput;
