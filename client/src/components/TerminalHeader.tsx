import { useEffect, useState } from 'react';

const TerminalHeader: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="terminal-header flex items-center justify-between px-4 py-2 bg-terminal-dark/70 backdrop-blur-md rounded-t-2xl shadow-md border-b border-terminal-muted">
      <div className="flex space-x-2">
        <div className="w-3 h-3 rounded-full bg-terminal-orange hover:scale-110 hover:bg-orange-400 transition-transform duration-150 cursor-pointer shadow"></div>
        <div className="w-3 h-3 rounded-full bg-terminal-green hover:scale-110 hover:bg-green-400 transition-transform duration-150 cursor-pointer shadow"></div>
        <div className="w-3 h-3 rounded-full bg-terminal-cyan hover:scale-110 hover:bg-cyan-400 transition-transform duration-150 cursor-pointer shadow"></div>
      </div>
      <div className="text-base text-terminal-cyan font-mono font-semibold drop-shadow">
        Mohsin's Terminal • <span className="text-terminal-text font-normal">{time.toLocaleTimeString()}</span>
      </div>
      <div className="w-6">
        {/* Placeholder to ensure the header is balanced */}
      </div>
    </div>
  );
};

export default TerminalHeader;
