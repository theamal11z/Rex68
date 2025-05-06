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
    <div className="terminal-header flex items-center justify-between p-2">
      <div className="flex space-x-2">
        <div className="w-3 h-3 rounded-full bg-terminal-orange"></div>
        <div className="w-3 h-3 rounded-full bg-terminal-green"></div>
        <div className="w-3 h-3 rounded-full bg-terminal-cyan"></div>
      </div>
      <div className="text-sm text-terminal-text font-mono">
        Rex v1.0.0 • {time.toLocaleTimeString()}
      </div>
      <div className="w-6">
        {/* Placeholder to ensure the header is balanced */}
      </div>
    </div>
  );
};

export default TerminalHeader;
