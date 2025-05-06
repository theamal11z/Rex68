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
    <div className="terminal-header flex items-center justify-between p-1 sm:p-2">
      <div className="flex space-x-2">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-terminal-orange"></div>
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-terminal-green"></div>
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-terminal-cyan"></div>
      </div>
      <div className="text-xs sm:text-sm text-terminal-text font-mono">
        <span className="hidden sm:inline">Rex v1.0.0 •</span> {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </div>
      <div className="w-4 sm:w-6">
        {/* Placeholder to ensure the header is balanced */}
      </div>
    </div>
  );
};

export default TerminalHeader;
