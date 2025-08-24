import { useState, useEffect, useRef } from 'react';
import cx from '@src/cx.mjs';

export function APIStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageQueue, setMessageQueue] = useState([]);
  const [flashActive, setFlashActive] = useState(false);
  const scrollRef = useRef(null);
  const timeoutRef = useRef(null);

  const processNextMessage = () => {
    setMessageQueue(prev => {
      if (prev.length > 0) {
        const [nextMsg, ...remaining] = prev;
        setCurrentMessage(nextMsg.text);
        setFlashActive(true);
        
        // Flash effect
        setTimeout(() => setFlashActive(false), 400);
        
        // Auto-clear after message duration
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setCurrentMessage('');
          if (remaining.length > 0) {
            setTimeout(processNextMessage, 200);
          }
        }, Math.min(nextMsg.text.length * 80 + 2000, 4000));
        
        return remaining;
      }
      return prev;
    });
  };

  useEffect(() => {
    const handleAPIStatus = (event) => {
      if (event.detail.type === 'connection') {
        setIsConnected(event.detail.connected);
        const statusText = event.detail.connected ? 'AI LINK ESTABLISHED' : 'AI LINK TERMINATED';
        setMessageQueue(prev => [...prev, { text: statusText, id: Date.now() }]);
      } else if (event.detail.type === 'command') {
        const cmdText = `> ${event.detail.description.toUpperCase()}`;
        setMessageQueue(prev => [...prev, { text: cmdText, id: Date.now() }]);
      }
    };

    window.addEventListener('strudel-api-event', handleAPIStatus);
    return () => {
      window.removeEventListener('strudel-api-event', handleAPIStatus);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Process queue when messages are added
  useEffect(() => {
    if (messageQueue.length > 0 && !currentMessage) {
      processNextMessage();
    }
  }, [messageQueue, currentMessage]);

  return (
    <div className="flex items-center justify-center space-x-3 py-2">
      {/* Fixed-width status container to prevent shifting */}
      <div className="flex-shrink-0">
        <div className={cx(
          'font-mono text-xs border px-3 py-1 rounded transition-all duration-300',
          isConnected 
            ? 'border-green-400/50 text-green-300 bg-green-950/20 shadow-green-400/30 animate-soft-glow' 
            : 'border-gray-500 text-gray-400 bg-gray-950/20',
        )}>
          <div className="flex items-center space-x-2">
            <span className={cx(
              'block w-2 h-2 rounded-full',
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
            )}></span>
            <span className="font-medium">
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Message terminal - always visible */}
      <div className={cx(
        'font-mono text-xs border bg-black/80 backdrop-blur-sm',
        'px-3 py-1 rounded min-w-[200px] max-w-[300px] relative overflow-hidden',
        'shadow-md transition-all duration-200',
        currentMessage || messageQueue.length > 0
          ? 'border-orange-400/60 shadow-orange-400/20'
          : 'border-gray-600/40 shadow-gray-600/10',
        flashActive && 'animate-flash-border'
      )}>
        {/* Message content */}
        <div className="flex items-center space-x-2 h-5">
          <span className={cx(
            'transition-colors duration-200',
            currentMessage || messageQueue.length > 0 ? 'text-orange-400' : 'text-gray-500'
          )}>›</span>
          <div 
            ref={scrollRef}
            className="whitespace-nowrap overflow-hidden flex-1"
          >
            <span className={cx(
              'transition-colors duration-200',
              currentMessage || messageQueue.length > 0 ? 'text-orange-100' : 'text-gray-500'
            )}>
              {currentMessage || 'ready'}
            </span>
          </div>
          {messageQueue.length > 0 && (
            <span className="text-orange-400/70 text-xs flex-shrink-0">
              +{messageQueue.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}