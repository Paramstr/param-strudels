#!/usr/bin/env node
/**
 * Strudel Editor API Server
 * Provides HTTP endpoints for external tools to control the Strudel IDE
 */

import express from 'express';
import cors from 'cors';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer } from 'http';
import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import ora from 'ora';

// 🎨 Beautiful Logger System
const logger = {
  // Server startup and system messages
  system: (message) => {
    console.log(boxen(
      gradient.rainbow(message),
      { 
        title: chalk.bold.magenta('🎵 STRUDEL SYSTEM'),
        titleAlignment: 'center',
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: 'double',
        borderColor: 'magenta'
      }
    ));
  },

  // Connection events (browsers connecting/disconnecting)
  connection: (message, type = 'connected') => {
    const color = type === 'connected' ? 'green' : 'yellow';
    const emoji = type === 'connected' ? '🔗' : '🔌';
    console.log(boxen(
      chalk[color].bold(message),
      {
        title: chalk.bold[color](`${emoji} CONNECTION`),
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        borderStyle: 'round',
        borderColor: color,
        margin: { left: 2 }
      }
    ));
  },

  // API requests and responses
  api: (method, endpoint, details = '') => {
    const methodColors = {
      'GET': 'blue',
      'POST': 'green',
      'PUT': 'orange',
      'DELETE': 'red'
    };
    const color = methodColors[method] || 'white';
    const message = `${chalk.bold[color](method)} ${chalk.cyan(endpoint)}${details ? '\n' + chalk.gray(details) : ''}`;
    
    console.log(boxen(
      message,
      {
        title: chalk.bold.blue('🚀 API REQUEST'),
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'single',
        borderColor: color,
        margin: { left: 1 }
      }
    ));
  },

  // AI music updates and code changes
  music: (message, type = 'update') => {
    const colors = {
      'update': ['#ff9a9e', '#fecfef', '#fecfef'],
      'eval': ['#a8edea', '#fed6e3'],
      'content': ['#ffd89b', '#19547b']
    };
    const gradientColors = colors[type] || colors.update;
    
    console.log(boxen(
      gradient(gradientColors)(message),
      {
        title: chalk.bold.magenta('🎼 AI MUSIC'),
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'bold',
        borderColor: 'magenta',
        margin: { top: 0, bottom: 1, left: 1 }
      }
    ));
  },

  // WebSocket messages
  websocket: (message, direction = 'received') => {
    const color = direction === 'received' ? 'cyan' : 'blue';
    const arrow = direction === 'received' ? '⬇️' : '⬆️';
    
    console.log(
      chalk[color](`${arrow} WS ${direction.toUpperCase()}: `) +
      chalk.white(message) +
      chalk.gray(` [${new Date().toLocaleTimeString()}]`)
    );
  },

  // Error messages
  error: (message, details = '') => {
    console.log(boxen(
      chalk.red.bold(message) + (details ? '\n' + chalk.gray(details) : ''),
      {
        title: chalk.bold.red('❌ ERROR'),
        padding: 1,
        borderStyle: 'double',
        borderColor: 'red',
        margin: { top: 1, bottom: 1 }
      }
    ));
  },

  // Success messages
  success: (message) => {
    console.log(boxen(
      chalk.green.bold(message),
      {
        title: chalk.bold.green('✅ SUCCESS'),
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: 'green',
        margin: { left: 1 }
      }
    ));
  },

  // Warning messages
  warning: (message) => {
    console.log(
      chalk.bgYellow.black.bold(' ⚠️  WARNING ') + ' ' +
      chalk.yellow(message)
    );
  },

  // Info messages (simple, no box)
  info: (message) => {
    console.log(
      chalk.blue('ℹ️  ') + chalk.white(message) + 
      chalk.gray(` [${new Date().toLocaleTimeString()}]`)
    );
  }
};

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Store connected clients (browser windows)
const clients = new Set();

// Store pending requests waiting for responses
const pendingRequests = new Map();

// Store recent errors for retrieval
const recentErrors = [];

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('📡 Browser connected to API server');
  clients.add(ws);
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('📡 Browser disconnected from API server');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 Received from browser:', message.type);
      
      // Handle responses from browser
      if (message.type === 'content-response') {
        console.log('📄 Editor content received:', message.content.substring(0, 100) + '...');
        
        // If there's a pending request waiting for this response, resolve it
        if (message.id && pendingRequests.has(message.id)) {
          const { resolve } = pendingRequests.get(message.id);
          resolve(message.content);
          pendingRequests.delete(message.id);
        }
      }
      
      // Handle error reports from browser
      if (message.type === 'error-report') {
        const errorInfo = {
          message: message.error,
          timestamp: new Date().toISOString(),
          source: message.source || 'unknown'
        };
        recentErrors.push(errorInfo);
        
        // Keep only last 10 errors
        if (recentErrors.length > 10) {
          recentErrors.shift();
        }
        
        console.log('❌ JavaScript error reported:', message.error);
      }
    } catch (e) {
      console.error('❌ Invalid message from browser:', e);
    }
  });
});

// Broadcast message to all connected browsers
function broadcast(message) {
  if (clients.size === 0) {
    console.log('⚠️ No browsers connected');
    return false;
  }
  
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
  return true;
}

// API Routes

// Get current editor content
app.get('/api/editor/content', async (req, res) => {
  if (clients.size === 0) {
    return res.status(503).json({ error: 'No browsers connected' });
  }
  
  const requestId = Date.now() + Math.random();
  
  // Create a promise that resolves when browser responds
  const contentPromise = new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Timeout waiting for browser response'));
      }
    }, 5000);
  });
  
  // Send request to browser
  broadcast({ type: 'get-content', id: requestId });
  
  try {
    const content = await contentPromise;
    res.json({ content, length: content.length });
  } catch (error) {
    res.status(408).json({ error: 'Timeout waiting for browser response' });
  }
});

// Set entire editor content
app.post('/api/editor/content', (req, res) => {
  const { content } = req.body;
  if (!content && content !== '') {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const sent = broadcast({ type: 'set-content', content });
  if (sent) {
    res.json({ message: 'Content updated', length: content.length });
  } else {
    res.status(503).json({ error: 'No browsers connected' });
  }
});

// Append content to editor
app.post('/api/editor/append', (req, res) => {
  const { content } = req.body;
  if (!content && content !== '') {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const sent = broadcast({ type: 'append-content', content });
  if (sent) {
    res.json({ message: 'Content appended', length: content.length });
  } else {
    res.status(503).json({ error: 'No browsers connected' });
  }
});

// Replace text by pattern/range
app.post('/api/editor/replace', (req, res) => {
  const { find, replace, flags = 'g' } = req.body;
  if (!find) {
    return res.status(400).json({ error: 'Find pattern is required' });
  }
  
  const sent = broadcast({ type: 'replace', find, replace: replace || '', flags });
  if (sent) {
    res.json({ message: 'Text replacement sent', find, replace, flags });
  } else {
    res.status(503).json({ error: 'No browsers connected' });
  }
});

// Evaluate current selection/all
app.post('/api/editor/eval', (req, res) => {
  const { selection = false } = req.body;
  const sent = broadcast({ type: 'evaluate', selection });
  if (sent) {
    res.json({ message: 'Code evaluation triggered', selection });
  } else {
    res.status(503).json({ error: 'No browsers connected' });
  }
});

// Get recent errors
app.get('/api/errors', (req, res) => {
  res.json({ 
    errors: recentErrors,
    count: recentErrors.length 
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: clients.size,
    errors: recentErrors.length,
    message: 'Strudel API Server is running'
  });
});

// Root endpoint with API info
app.get('/', (req, res) => {
  res.json({
    name: 'Strudel API Server',
    version: '1.0.0',
    endpoints: {
      'GET /api/health': 'Check server status',
      'GET /api/errors': 'Get recent JavaScript errors',
      'GET /api/editor/content': 'Get editor content',
      'POST /api/editor/content': 'Set editor content',
      'POST /api/editor/append': 'Append content to editor',
      'POST /api/editor/replace': 'Replace text patterns',
      'POST /api/editor/eval': 'Evaluate code'
    },
    websocket: `ws://localhost:${process.env.STRUDEL_API_PORT || 3001}`
  });
});

const PORT = process.env.STRUDEL_API_PORT || 3001;

server.listen(PORT, () => {
  console.log(`🎵 Strudel API Server running on http://localhost:${PORT}`);
  console.log(`🔗 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`📡 Waiting for browser connections...`);
  console.log(`💡 Try: curl http://localhost:${PORT}/api/health`);
});