import React, { useState, useEffect } from 'react';

const THE_AMAL_ASCII = `
  ████████╗██╗  ██╗███████╗     █████╗ ███╗   ███╗ █████╗ ██╗
  ╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗████╗ ████║██╔══██╗██║
     ██║   ███████║█████╗      ███████║██╔████╔██║███████║██║
     ██║   ██╔══██║██╔══╝      ██╔══██║██║╚██╔╝██║██╔══██║██║
     ██║   ██║  ██║███████╗    ██║  ██║██║ ╚═╝ ██║██║  ██║███████╗
     ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝

                the-amal
`;

interface InitialLoadingScreenProps {
  onLoaded: () => void;
}

const InitialLoadingScreen: React.FC<InitialLoadingScreenProps> = ({ onLoaded }) => {
  const [dots, setDots] = useState('');
  const loadingMessage = "INITIALIZING REX INTERFACE";
  const [typedMessage, setTypedMessage] = useState('');
  const [showAscii, setShowAscii] = useState(false);

  // Simulate typing for loading message
  useEffect(() => {
    if (typedMessage.length < loadingMessage.length) {
      const timeoutId = setTimeout(() => {
        setTypedMessage(loadingMessage.substring(0, typedMessage.length + 1));
      }, 75);
      return () => clearTimeout(timeoutId);
    } else {
      // Once message is typed, show ASCII art
      setShowAscii(true);
    }
  }, [typedMessage, loadingMessage]);

  // Animate dots for a classic loading feel
  useEffect(() => {
    if (!showAscii) return; // Start dots after message
    const intervalId = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(intervalId);
  }, [showAscii]);

  // Simulate loading completion
  useEffect(() => {
    if (showAscii) { // Start countdown once ASCII is visible
      const timer = setTimeout(() => {
        onLoaded();
      }, 3000); // Display loading screen for 3 seconds after ASCII art appears
      return () => clearTimeout(timer);
    }
  }, [showAscii, onLoaded]);

  return (
    <div className="fixed inset-0 bg-black text-terminal-green font-mono flex flex-col items-center justify-center z-50">
      {showAscii && (
        <pre 
          className="text-terminal-cyan font-mono select-none whitespace-pre break-words text-[0.65rem] sm:text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl min-w-max max-w-full text-center mb-8 animate-fadeIn"
          style={{ lineHeight: 1.1 }}
        >
          {THE_AMAL_ASCII}
        </pre>
      )}
      <div className="text-lg sm:text-xl md:text-2xl tracking-wider">
        <span>{typedMessage}</span>
        {showAscii && <span className="animate-pulse">{dots}</span>}
        {!showAscii && <span className="inline-block w-2 h-6 bg-terminal-green ml-1 animate-blink"></span>}
      </div>
      {showAscii && (
        <div className="mt-12 text-xs text-terminal-muted animate-pulse">
          <p>System Check: OK</p>
          <p>Engaging Neural Correlates...</p>
        </div>
      )}
    </div>
  );
};

export default InitialLoadingScreen;
