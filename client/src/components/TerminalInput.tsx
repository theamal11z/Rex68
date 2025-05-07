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
    <div className="bg-terminal-dark/80 p-2 sm:p-3 border-t border-terminal-muted relative z-10 rounded-b-2xl">
      <form className="flex flex-wrap items-center gap-2" onSubmit={e => { e.preventDefault(); if (inputText.trim() && !disabled) { onSendMessage(inputText); setInputText(''); } }}>
        <div className="text-terminal-orange mr-2 whitespace-nowrap font-mono">user@rex:~$</div>
        <div className="flex-1 min-w-0 flex items-center bg-terminal-bg/70 rounded-lg px-2 py-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="bg-transparent border-none outline-none w-full text-terminal-text placeholder-terminal-muted text-base"
            placeholder={disabled ? "Wait for Rex to respond..." : "Type your message..."}
            aria-label="Type your message"
            autoComplete="off"
          />
          {!disabled && <span className="cursor w-2 h-5 bg-terminal-text animate-blink ml-1 flex-shrink-0 rounded-sm"></span>}
        </div>
        <button
          type="submit"
          disabled={disabled || !inputText.trim()}
          className="ml-2 px-3 py-1 rounded-lg bg-terminal-cyan/90 hover:bg-terminal-purple/90 text-black font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow focus:outline-none focus:ring-2 focus:ring-terminal-orange flex items-center"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </button>
      </form>
    </div>
  );
};

export default TerminalInput;
