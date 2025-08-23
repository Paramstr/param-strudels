#!/usr/bin/env node
/**
 * Strudel CLI - Command line interface for controlling the Strudel IDE
 */

import { readFileSync } from 'fs';
import http from 'http';

const API_HOST = 'localhost';
const API_PORT = 3001;

async function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `/api${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          
          if (res.statusCode !== 200) {
            console.error('❌ Error:', result.error || 'Unknown error');
            resolve(false);
          } else {
            resolve(result);
          }
        } catch (error) {
          console.error('❌ Invalid JSON response:', error.message);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Connection failed. Is the API server running?');
      console.error('   Run: npm run api');
      console.error('   Error:', error.message);
      resolve(false);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function getContent() {
  console.log('📄 Getting editor content...');
  const result = await makeRequest('/editor/content');
  if (result) {
    console.log('✅ Content retrieved');
    console.log(`   Length: ${result.length} characters`);
    console.log('');
    console.log('📝 Current editor content:');
    console.log('─'.repeat(50));
    console.log(result.content);
    console.log('─'.repeat(50));
  }
}

async function setContent(content) {
  // Process escape sequences like \n, \t
  const processedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r');
    
  console.log('📝 Setting editor content...');
  const result = await makeRequest('/editor/content', 'POST', { content: processedContent });
  if (result) {
    console.log('✅', result.message);
    console.log(`   Content length: ${processedContent.length} characters`);
  }
}

async function replaceText(find, replace) {
  console.log(`🔄 Replacing "${find}" with "${replace}"...`);
  const result = await makeRequest('/editor/replace', 'POST', { find, replace });
  if (result) {
    console.log('✅', result.message);
  }
}

async function evaluate(selection = false) {
  console.log(selection ? '▶️ Evaluating selection...' : '▶️ Evaluating all code...');
  const result = await makeRequest('/editor/eval', 'POST', { selection });
  if (result) {
    console.log('✅', result.message);
  }
}

async function status() {
  console.log('🔍 Checking API server status...');
  const result = await makeRequest('/health');
  if (result) {
    console.log('✅ Server Status:', result.status);
    console.log(`   Connected browsers: ${result.clients}`);
    console.log(`   Message: ${result.message}`);
  }
}

async function loadFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    console.log(`📂 Loading file: ${filePath}`);
    await setContent(content);
  } catch (e) {
    console.error('❌ Could not read file:', e.message);
  }
}

function showHelp() {
  console.log(`
🎵 Strudel CLI - Control your Strudel IDE from the command line

Usage:
  node strudel-cli.mjs <command> [args]

Commands:
  status                    Check API server and browser connection
  get                      Get current editor content
  set <content>            Set editor content
  load <file>              Load content from file
  replace <find> <replace> Replace text (supports regex)
  eval                     Evaluate current code
  help                     Show this help

Examples:
  node strudel-cli.mjs status
  node strudel-cli.mjs set "bd hh sd hh"
  node strudel-cli.mjs replace "bd" "808"
  node strudel-cli.mjs load my-pattern.js
  node strudel-cli.mjs eval

Note: Make sure the API server is running (npm run api) and
      you have a browser with Strudel open at localhost:4321
`);
}

// Main CLI handler
const [,, command, ...args] = process.argv;

switch (command) {
  case 'status':
    await status();
    break;
    
  case 'get':
    await getContent();
    break;
    
  case 'set':
    if (args.length === 0) {
      console.error('❌ Usage: set <content>');
      process.exit(1);
    }
    await setContent(args.join(' '));
    break;
    
  case 'load':
    if (args.length === 0) {
      console.error('❌ Usage: load <file>');
      process.exit(1);
    }
    await loadFile(args[0]);
    break;
    
  case 'replace':
    if (args.length < 2) {
      console.error('❌ Usage: replace <find> <replace>');
      process.exit(1);
    }
    await replaceText(args[0], args[1]);
    break;
    
  case 'eval':
    await evaluate();
    break;
    
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
    
  default:
    console.error('❌ Unknown command:', command);
    showHelp();
    process.exit(1);
}