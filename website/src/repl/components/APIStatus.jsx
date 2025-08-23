import { useState, useEffect } from 'react';
import cx from '@src/cx.mjs';

export function APIStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [commands, setCommands] = useState([]);
  const [showFeed, setShowFeed] = useState(false);

  useEffect(() => {
    // Listen for API connection status changes
    const handleAPIStatus = (event) => {
      if (event.detail.type === 'connection') {
        setIsConnected(event.detail.connected);
      } else if (event.detail.type === 'command') {
        const newCommand = {
          id: Date.now(),
          description: event.detail.description,
          timestamp: new Date().toLocaleTimeString(),
        };
        
        setCommands(prev => [newCommand, ...prev.slice(0, 4)]); // Keep last 5 commands
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setCommands(prev => prev.filter(cmd => cmd.id !== newCommand.id));
        }, 5000);
      }
    };

    window.addEventListener('strudel-api-event', handleAPIStatus);
    return () => window.removeEventListener('strudel-api-event', handleAPIStatus);
  }, []);

  return (
    <div className="flex items-center space-x-3">
      {/* API Connection Status */}
      <div 
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => setShowFeed(!showFeed)}
        title="Click to toggle command feed"
      >
        <div className={cx(
          'w-2 h-2 rounded-full',
          isConnected 
            ? 'bg-green-400 animate-pulse' 
            : 'bg-gray-400'
        )}></div>
        <span className={cx(
          'text-xs font-mono',
          isConnected ? 'text-green-400' : 'text-gray-400'
        )}>
          AI {isConnected ? 'CONNECTED' : 'OFFLINE'}
        </span>
      </div>

      {/* Live Command Feed */}
      {commands.length > 0 && (
        <div className="flex flex-col space-y-1">
          {commands.map((command, index) => (
            <div
              key={command.id}
              className={cx(
                'px-3 py-1 rounded text-xs font-mono border',
                'bg-blue-900 border-blue-400 text-blue-100',
                'animate-fade-in-slide shadow-lg',
                index === 0 && 'animate-pulse'
              )}
              style={{
                animationDelay: `${index * 100}ms`,
                opacity: 1 - (index * 0.2), // Fade older commands
              }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-blue-300">🤖</span>
                <span className="font-bold text-blue-200">Claude:</span>
                <span>{command.description}</span>
                <span className="text-blue-300 text-xs">{command.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Add CSS animations to the existing Repl.css file
const styles = `
@keyframes fade-in-slide {
  from {
    opacity: 0;
    transform: translateY(-10px) translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(0);
  }
}

.animate-fade-in-slide {
  animation: fade-in-slide 0.3s ease-out;
}
`;