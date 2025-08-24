#!/usr/bin/env node
/**
 * Strudel CLI - Command line interface for controlling the Strudel IDE
 */

import { readFileSync } from 'fs';
import http from 'http';
import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import ora from 'ora';

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
    const contentBox = boxen(
      chalk.cyan(result.content) + '\n\n' + 
      chalk.gray(`Length: ${result.length} characters`),
      {
        title: chalk.bold.hex('#ff6b35')('📝 CURRENT STRUDEL CODE'),
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'round',
        borderColor: '#ff8c42'
      }
    );
    console.log('\n' + contentBox + '\n');
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
    const preview = processedContent.length > 100 ? 
      processedContent.substring(0, 100) + '...' : 
      processedContent;
    
    const successBox = boxen(
      chalk.green('✅ Code updated successfully!') + '\n\n' +
      chalk.white('New pattern:') + '\n' +
      chalk.cyan(preview) + '\n\n' +
      chalk.gray(`Total length: ${processedContent.length} characters`),
      {
        title: chalk.bold.hex('#ff6b35')('🎵 MUSIC CODE SET'),
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'double',
        borderColor: '#ff8c42'
      }
    );
    console.log('\n' + successBox + '\n');
  }
}

async function replaceText(find, replace) {
  console.log(chalk.yellow(`🔄 Replacing "${find}" with "${replace}"...`));
  const result = await makeRequest('/editor/replace', 'POST', { find, replace });
  if (result) {
    const replaceBox = boxen(
      chalk.red(`Find: "${find}"`) + '\n' +
      chalk.green(`Replace: "${replace}"`) + '\n\n' +
      chalk.green('✅ Pattern replacement complete!'),
      {
        title: chalk.bold.yellow('🔄 TEXT REPLACEMENT'),
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'single',
        borderColor: 'yellow'
      }
    );
    console.log('\n' + replaceBox + '\n');
  }
}

async function evaluate(selection = false) {
  console.log(chalk.magenta(selection ? '▶️ Evaluating selection...' : '▶️ Evaluating all code...'));
  const result = await makeRequest('/editor/eval', 'POST', { selection });
  if (result) {
    const successMessage = `${chalk.green('✅ SUCCESS!')} ${result.message}`;
    
    console.log('\n' + boxen(
      gradient(['#ff6b35', '#ff8c42'])('🎵 MUSIC IS PLAYING! 🎵\n') + 
      chalk.hex('#ff8c42')('The AI has triggered code evaluation'),
      {
        title: chalk.bold.hex('#ff6b35')('🚀 CODE EXECUTED'),
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'bold',
        borderColor: '#ff6b35'
      }
    ) + '\n');
  }
}

async function status() {
  console.log(chalk.cyan('🔍 Checking API server status...'));
  const result = await makeRequest('/health');
  if (result) {
    const statusMessage = `${chalk.green('✅ Server Status:')} ${chalk.bold.green(result.status.toUpperCase())}\n${chalk.blue('🌐 Connected browsers:')} ${chalk.bold.yellow(result.clients)}\n${chalk.magenta('💬 Message:')} ${result.message}`;
    
    console.log('\n' + boxen(statusMessage, {
      title: chalk.bold.hex('#ff6b35')('🎵 STRUDEL API STATUS'),
      titleAlignment: 'center',
      padding: 1,
      borderStyle: 'double',
      borderColor: '#ff8c42'
    }) + '\n');
  }
}

async function appendContent(content) {
  // Process escape sequences like \n, \t
  const processedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r');
    
  console.log(chalk.blue('➕ Appending content to editor...'));
  const result = await makeRequest('/editor/append', 'POST', { content: processedContent });
  if (result) {
    const appendBox = boxen(
      chalk.green('✅ Content appended successfully!') + '\n\n' +
      chalk.white('Added:') + '\n' +
      chalk.cyan(processedContent) + '\n\n' +
      chalk.gray(`Length: ${processedContent.length} characters`),
      {
        title: chalk.bold.blue('➕ CONTENT APPENDED'),
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    );
    console.log('\n' + appendBox + '\n');
  }
}

async function checkErrors() {
  console.log(chalk.blue('🔍 Checking for JavaScript errors...'));
  const result = await makeRequest('/errors');
  if (result) {
    if (result.errors.length === 0) {
      const noErrorsBox = boxen(
        chalk.green.bold('✅ No recent errors found!') + '\n' +
        chalk.cyan('Your Strudel code is running clean 🎉'),
        {
          title: chalk.bold.green('🛡️ ERROR STATUS'),
          titleAlignment: 'center',
          padding: 1,
          borderStyle: 'round',
          borderColor: 'green'
        }
      );
      console.log('\n' + noErrorsBox + '\n');
    } else {
      let errorList = '';
      result.errors.forEach((error, index) => {
        errorList += chalk.red(`${index + 1}. [${error.source}] ${error.message}`) + '\n';
        errorList += chalk.gray(`   Time: ${new Date(error.timestamp).toLocaleString()}`) + '\n\n';
      });
      
      const errorsBox = boxen(
        chalk.yellow(`Found ${result.errors.length} recent errors:`) + '\n\n' +
        errorList.trim(),
        {
          title: chalk.bold.red('⚠️ JAVASCRIPT ERRORS'),
          titleAlignment: 'center',
          padding: 1,
          borderStyle: 'double',
          borderColor: 'red'
        }
      );
      console.log('\n' + errorsBox + '\n');
    }
  }
}

async function loadFile(filePath) {
  try {
    console.log(chalk.blue(`📂 Loading file: ${filePath}`));
    const spinner = ora('Reading file...').start();
    
    const content = readFileSync(filePath, 'utf8');
    spinner.succeed(chalk.green('File loaded successfully!'));
    
    await setContent(content);
  } catch (e) {
    console.log(chalk.red('❌ Could not read file:'), e.message);
  }
}

function showHelp() {
  const banner = `
 ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗     ██████╗██╗     ██╗   ██╗██████╗ ██████╗ ██╗███╗   ██╗ ██████╗ 
██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝    ██╔════╝██║     ██║   ██║██╔══██╗██╔══██╗██║████╗  ██║██╔════╝ 
██║     ██║     ███████║██║   ██║██║  ██║█████╗      ██║     ██║     ██║   ██║██████╔╝██████╔╝██║██╔██╗ ██║██║  ███╗
██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝      ██║     ██║     ██║   ██║██╔══██╗██╔══██╗██║██║╚██╗██║██║   ██║
╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗    ╚██████╗███████╗╚██████╔╝██████╔╝██████╔╝██║██║ ╚████║╚██████╔╝
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝     ╚═════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝`;
  
  console.log('\n' + gradient(['#ff6b35', '#ff8c42', '#ffa726', '#ffb74d'])(banner));
  console.log(chalk.hex('#ff8c42').italic('                    A sensory and combative experience with claude.'));
  
  const helpContent = `${chalk.cyan('Control your Strudel IDE from the command line')}

${chalk.bold.yellow('USAGE:')}
  ${chalk.white('node strudel-cli.mjs <command> [args]')}

${chalk.bold.yellow('COMMANDS:')}
  ${chalk.green('status')}                    Check API server and browser connection
  ${chalk.green('errors')}                    Check for recent JavaScript errors
  ${chalk.green('get')}                      Get current editor content
  ${chalk.green('set')} ${chalk.cyan('<content>')}            Set editor content
  ${chalk.green('append')} ${chalk.cyan('<content>')}         Append content to editor
  ${chalk.green('load')} ${chalk.cyan('<file>')}              Load content from file
  ${chalk.green('replace')} ${chalk.cyan('<find> <replace>')} Replace text (supports regex)
  ${chalk.green('eval')}                     Evaluate current code
  ${chalk.green('help')}                     Show this help

${chalk.bold.yellow('EXAMPLES:')}
  ${chalk.gray('node strudel-cli.mjs')} ${chalk.green('status')}
  ${chalk.gray('node strudel-cli.mjs')} ${chalk.green('errors')}
  ${chalk.gray('node strudel-cli.mjs')} ${chalk.green('set')} ${chalk.cyan('\"bd hh sd hh\"')}
  ${chalk.gray('node strudel-cli.mjs')} ${chalk.green('append')} ${chalk.cyan('\".lpf(800)\"')}
  ${chalk.gray('node strudel-cli.mjs')} ${chalk.green('replace')} ${chalk.cyan('\"bd\" \"808\"')}
  ${chalk.gray('node strudel-cli.mjs')} ${chalk.green('load')} ${chalk.cyan('my-pattern.js')}
  ${chalk.gray('node strudel-cli.mjs')} ${chalk.green('eval')}

${chalk.bold.red('NOTE:')} Make sure the API server is running ${chalk.yellow('(npm run api)')} and
      you have a browser with Strudel open at ${chalk.cyan('localhost:4321')}`;
  
  console.log(boxen(helpContent, {
    title: chalk.bold.hex('#ff6b35')('🎼 STRUDEL CLI HELP'),
    titleAlignment: 'center',
    padding: 1,
    borderStyle: 'double',
    borderColor: '#ff6b35'
  }));
  console.log('');
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