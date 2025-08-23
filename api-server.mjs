#!/usr/bin/env node
/**
 * Strudel Editor API Server
 * Provides HTTP endpoints for external tools to control the Strudel IDE
 */

import express from 'express';
import cors from 'cors';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Store connected clients (browser windows)
const clients = new Set();

// Store pending requests waiting for responses
const pendingRequests = new Map();

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: clients.size,
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
      'GET /api/editor/content': 'Get editor content',
      'POST /api/editor/content': 'Set editor content',
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