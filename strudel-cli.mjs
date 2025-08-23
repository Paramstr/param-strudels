#!/usr/bin/env node
/**
 * Strudel CLI - Command line interface for controlling the Strudel IDE
 */

import { readFileSync } from 'fs';
import http from 'http';
import chalk from 'chalk';

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
            console.error(chalk.red('❌ Error:'), result.error || 'Unknown error');
            resolve(false);
          } else {
            resolve(result);
          }
        } catch (error) {
          console.error(chalk.red('❌ Invalid JSON response:'), error.message);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(chalk.red('❌ Connection failed. Is the API server running?'));
      console.error(chalk.yellow('   Run: npm run api'));
      console.error(chalk.gray('   Error:'), error.message);
      resolve(false);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function getContent() {
  console.log(chalk.blue('📄 Getting editor content...'));
  const result = await makeRequest('/editor/content');
  if (result) {
    console.log(chalk.green('✅ Content retrieved'));
    console.log(chalk.gray(`   Length: ${result.length} characters`));
    console.log('');
    console.log(chalk.magenta('📝 Current editor content:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white(result.content));
    console.log(chalk.gray('─'.repeat(50)));
  }
}

async function setContent(content) {
  // Process escape sequences like \n, \t
  const processedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r');
    
  console.log(chalk.blue('📝 Setting editor content...'));
  const result = await makeRequest('/editor/content', 'POST', { content: processedContent });
  if (result) {
    console.log(chalk.green('✅'), result.message);
    console.log(chalk.gray(`   Content length: ${processedContent.length} characters`));
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
  console.log(chalk.magenta(selection ? '▶️ Evaluating selection...' : '▶️ Evaluating all code...'));
  const result = await makeRequest('/editor/eval', 'POST', { selection });
  if (result) {
    console.log(chalk.green('✅'), chalk.bold('🎵 MUSIC PLAYING! '), result.message);
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

async function appendContent(content) {
  // Process escape sequences like \n, \t
  const processedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r');
    
  console.log('➕ Appending content to editor...');
  const result = await makeRequest('/editor/append', 'POST', { content: processedContent });
  if (result) {
    console.log('✅', result.message);
    console.log(`   Content length: ${processedContent.length} characters`);
  }
}

async function checkErrors() {
  console.log('🔍 Checking for JavaScript errors...');
  const result = await makeRequest('/errors');
  if (result) {
    if (result.errors.length === 0) {
      console.log(chalk.green('✅ No recent errors found'));
    } else {
      console.log(chalk.yellow(`⚠️ Found ${result.errors.length} recent errors:`));
      console.log(chalk.gray('─'.repeat(50)));
      result.errors.forEach((error, index) => {
        console.log(chalk.red(`${index + 1}. [${error.source}] ${error.message}`));
        console.log(chalk.gray(`   Time: ${new Date(error.timestamp).toLocaleString()}`));
        console.log('');
      });
    }
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
  errors                    Check for recent JavaScript errors
  get                      Get current editor content
  set <content>            Set editor content
  append <content>         Append content to editor
  load <file>              Load content from file
  replace <find> <replace> Replace text (supports regex)
  eval                     Evaluate current code
  help                     Show this help

Examples:
  node strudel-cli.mjs status
  node strudel-cli.mjs errors
  node strudel-cli.mjs set "bd hh sd hh"
  node strudel-cli.mjs append ".lpf(800)"
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
    
  case 'errors':
    await checkErrors();
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
    
  case 'append':
    if (args.length === 0) {
      console.error('❌ Usage: append <content>');
      process.exit(1);
    }
    await appendContent(args.join(' '));
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