# Strudel AI Control System - Technical Overview

## What This Is
An API bridge that lets external AI agents (like Claude) read and write code in a live Strudel music IDE through HTTP/WebSocket commands.

## Architecture
```
[AI Agent] <--HTTP--> [API Server] <--WebSocket--> [Browser Strudel IDE]
     │                    │                              │
  CLI Tool          Express+WS Server              CodeMirror Editor
  (Node.js)         (Port 3001)                   (window.strudelMirror)
```

## Core Components

### 1. API Server (`api-server.mjs`)
- **Purpose**: Translates HTTP requests into WebSocket commands
- **Port**: 3001
- **Start**: `npm run api`
- **Key endpoints**:
  - `GET /api/editor/content` - Read current code
  - `POST /api/editor/content` - Set entire code
  - `POST /api/editor/append` - Append content to editor
  - `POST /api/editor/replace` - Replace text patterns
  - `POST /api/editor/eval` - Execute code
  - `GET /api/errors` - Get recent JavaScript errors
  - `GET /api/health` - Connection status

### 2. Browser Client (`website/src/repl/api-client.mjs`)
- **Purpose**: Receives WebSocket commands and controls CodeMirror
- **Auto-loads**: Imported in `useReplContext.jsx`
- **Key methods**: `editor.code` (read), `editor.setCode()` (write), `editor.appendCode()` (append), `editor.evaluate()` (run)
- **Error capture**: Global error handlers, console.error interception, promise rejection handling
- **Global**: Available as `window.strudelAPI`

### 3. CLI Tool (`strudel-cli.mjs`)
- **Purpose**: Command-line interface for testing/controlling
- **Usage**: `node strudel-cli.mjs <command>`
- **Commands**: `get`, `set`, `append`, `replace`, `eval`, `errors`, `status`
- **Auto error checking**: Configured hooks automatically check for errors after `set`, `append`, and `eval`

### 4. UI Feedback (`website/src/repl/components/APIStatus.jsx`)
- **Purpose**: Shows live connection status and command feed
- **Location**: Strudel header bar
- **Displays**: Green dot + "AI CONNECTED" + live command alerts

## Error Monitoring System

### Real-time JavaScript Error Capture
The system automatically captures and reports JavaScript errors from the browser to provide immediate feedback during live coding:

**Error Sources Captured:**
- Syntax errors (missing brackets, quotes, etc.)
- Runtime errors (undefined functions, invalid patterns)  
- Promise rejections (async operation failures)
- Console errors (logged error messages)
- Pattern evaluation failures

**Error Flow:**
```
1. JavaScript error occurs in browser
2. Error captured by global handlers or console.error interception
3. Error sent via WebSocket to API server: {"type":"error-report","error":"..."}
4. API server stores error with timestamp and source
5. CLI command retrieves errors: GET /api/errors
```

**Automatic Error Checking:**
- Hooks configured in `.claude/settings.local.json`
- Automatic `errors` command runs after `set`, `append`, and `eval`
- 3-second delay allows error capture before checking
- Provides immediate feedback on coding mistakes

## How It Works

### 1. Connection Flow
```
1. Start API server: npm run api
2. Open Strudel in browser (npm run dev)  
3. Browser auto-connects to WebSocket
4. Green "AI CONNECTED" appears in header
```

### 2. Command Flow (Example: Reading Code)
```
1. AI sends: GET http://localhost:3001/api/editor/content
2. API server broadcasts: {"type":"get-content","id":123}
3. Browser receives command via WebSocket
4. Browser reads: content = editor.code
5. Browser responds: {"type":"content-response","id":123,"content":"$: bd hh"}
6. API server returns: {"content":"$: bd hh","length":8}
```

### 3. Real-time UI Updates
```
1. Command received → Dispatch custom event
2. APIStatus component shows: "🤖 Claude: Reading current pattern"
3. Alert auto-fades after 5 seconds
```

## Critical File Locations

### Core Files
- `api-server.mjs` - HTTP/WebSocket server
- `strudel-cli.mjs` - CLI tool
- `website/src/repl/api-client.mjs` - Browser WebSocket client
- `website/src/repl/components/APIStatus.jsx` - UI feedback

### Integration Points
- `website/src/repl/useReplContext.jsx` - Imports api-client
- `website/src/repl/components/Header.jsx` - Shows APIStatus
- `website/src/repl/Repl.css` - Animation styles

## Strudel Editor API

### Reading Code
```javascript
const content = window.strudelMirror.code;
```

### Writing Code
```javascript
window.strudelMirror.setCode("$: 'bd hh'.s()");
```

### Executing Code
```javascript
window.strudelMirror.evaluate();
```

## Message Protocol

### Commands (API Server → Browser)
```javascript
{"type": "set-content", "content": "$: 'bd hh'"}
{"type": "append-content", "content": ".lpf(800)"}
{"type": "replace", "find": "bd", "replace": "808"}
{"type": "evaluate", "selection": false}
{"type": "get-content", "id": 123}
```

### Responses (Browser → API Server)
```javascript
{"type": "content-response", "id": 123, "content": "$: 'bd hh'"}
{"type": "error-report", "error": "SyntaxError: Unexpected token", "source": "console"}
```

## Development Workflow

### 1. Making Changes
- Edit core files listed above
- API server auto-restarts are NOT enabled
- Browser hot-reloads automatically
- Kill/restart API server for server changes: `npm run api`

### 2. Testing
```bash
# Terminal 1: Start API server
npm run api

# Terminal 2: Start Strudel dev server  
npm run dev

# Terminal 3: Test commands
node strudel-cli.mjs status
node strudel-cli.mjs set "$: 'bd hh'"
node strudel-cli.mjs append ".lpf(800)"
node strudel-cli.mjs errors
node strudel-cli.mjs get
```

### 3. Debugging
- Browser console: WebSocket connection logs
- API server: Terminal output shows connections/commands  
- Network tab: HTTP requests to localhost:3001
- **Error monitoring**: `node strudel-cli.mjs errors` for recent JavaScript errors
- **Automatic error checking**: Hooks run error checks after music commands

## Common Issues & Fixes

### "No browsers connected"
- Refresh Strudel page
- Check browser console for WebSocket errors
- Restart API server

### "Timeout waiting for browser response"  
- Browser WebSocket disconnected
- Check if `window.strudelMirror` exists
- Refresh browser page

### Command not working
- Check API server logs for error messages
- Verify WebSocket connection in browser console
- Test with `node strudel-cli.mjs status`

## Extension Points

### Adding New Commands
1. Add endpoint in `api-server.mjs`
2. Add handler in `api-client.mjs` 
3. Add CLI command in `strudel-cli.mjs`
4. Add description in `COMMAND_DESCRIPTIONS`

### UI Customization
- Modify `APIStatus.jsx` for different styling
- Edit `Repl.css` for animations
- Change header placement in `Header.jsx`

## Security Notes
- **Localhost only**: No external network access
- **User initiated**: Browser must explicitly load Strudel page
- **Transparent**: All commands shown in UI
- **Reversible**: All edits can be undone (Ctrl+Z)