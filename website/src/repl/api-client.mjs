/**
 * Strudel API Client
 * Connects to the API server for external control
 */

let ws = null;
let reconnectTimeout = null;
const RECONNECT_DELAY = 3000;

// Command descriptions for better UX
const COMMAND_DESCRIPTIONS = {
  'set-content': 'Setting new pattern',
  'replace': 'Replacing pattern elements',
  'evaluate': 'Running the music',
  'get-content': 'Reading current pattern',
  'insert': 'Adding new elements',
  'set-cursor': 'Moving cursor position',
  'set-selection': 'Selecting code section'
};

// Dispatch custom events to the UI
function dispatchAPIEvent(type, data) {
  const event = new CustomEvent('strudel-api-event', {
    detail: { type, ...data }
  });
  window.dispatchEvent(event);
}

function connectWebSocket() {
  const wsUrl = `ws://localhost:3001`;
  
  try {
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('🔗 Connected to Strudel API server');
      // Clear any pending reconnect
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      // Dispatch connection event to UI
      dispatchAPIEvent('connection', { connected: true });
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleAPIMessage(message);
      } catch (e) {
        console.error('❌ Invalid API message:', e);
      }
    };
    
    ws.onclose = () => {
      console.log('📡 API server connection closed');
      
      // Dispatch disconnection event to UI
      dispatchAPIEvent('connection', { connected: false });
      
      // Attempt to reconnect after delay
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          console.log('🔄 Attempting to reconnect to API server...');
          connectWebSocket();
        }, RECONNECT_DELAY);
      }
    };
    
    ws.onerror = (error) => {
      console.log('⚠️ API server not available (this is normal if not running)');
    };
    
  } catch (e) {
    console.log('⚠️ Could not connect to API server (this is normal if not running)');
  }
}

function handleAPIMessage(message) {
  const editor = window.strudelMirror;
  if (!editor) {
    console.warn('❌ Editor not available');
    return;
  }
  
  console.log('📨 API Command:', message.type);
  
  // Dispatch command event to UI with description
  const description = COMMAND_DESCRIPTIONS[message.type] || `Executing ${message.type}`;
  dispatchAPIEvent('command', { description });
  
  switch (message.type) {
    case 'get-content':
      // Send current editor content back to API
      let content = '';
      try {
        // Use the correct StrudelMirror property
        content = editor.code || editor.editor?.state?.doc?.toString() || 'No content available';
      } catch (e) {
        content = `Error reading content: ${e.message}`;
        console.error('Error getting editor content:', e);
      }
      sendToAPI({ type: 'content-response', id: message.id, content });
      break;
      
    case 'set-content':
      // Set editor content
      if (message.content !== undefined) {
        editor.setCode(message.content);
      }
      break;
      
    case 'replace':
      // Replace text using regex
      try {
        const currentCode = editor.getCode();
        const regex = new RegExp(message.find, message.flags || 'g');
        const newCode = currentCode.replace(regex, message.replace || '');
        editor.setCode(newCode);
      } catch (e) {
        console.error('❌ Replace error:', e);
      }
      break;
      
    case 'evaluate':
      // Trigger evaluation
      if (message.selection) {
        // Evaluate selection (if supported)
        editor.evaluate();
      } else {
        // Evaluate all
        editor.evaluate();
      }
      break;
      
    default:
      console.warn('❌ Unknown API command:', message.type);
  }
}

function sendToAPI(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Initialize when browser is ready
if (typeof window !== 'undefined') {
  // Wait a bit for the REPL to initialize
  setTimeout(() => {
    connectWebSocket();
  }, 1000);
  
  // Also expose API client globally for debugging
  window.strudelAPI = {
    connect: connectWebSocket,
    send: sendToAPI,
    getEditor: () => window.strudelMirror
  };
}