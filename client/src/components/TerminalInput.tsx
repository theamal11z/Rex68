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
    <div className="bg-terminal-dark p-4 border-t border-terminal-muted">
      <div className="flex items-center">
        <div className="text-terminal-orange mr-2">user@rex:~$</div>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="bg-transparent border-none outline-none flex-1 text-terminal-text placeholder-terminal-muted"
          placeholder={disabled ? "Wait for Rex to respond..." : "Type your message..."}
        />
        {!disabled && <div className="cursor w-2 h-4 bg-terminal-text animate-blink"></div>}
      </div>
    </div>
  );
};

export default TerminalInput;
