# Strudel AI Control System - Implementation Plan

## Project Vision
Transform Strudel from a solo live-coding environment into a collaborative AI-human music creation platform where coding agents can intelligently assist with pattern creation, arrangement, and real-time performance.

## Current System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  External Tool  │    │   API Server     │    │  Browser IDE    │
│  (Claude/Agent) │◄──►│  (Express+WS)    │◄──►│   (Strudel)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Phase 1: Foundation (MVP) 🔄 **IN PROGRESS**

### ✅ Completed
- [x] API Server (Express + WebSocket) on port 3001
- [x] Browser WebSocket client with auto-connect
- [x] CodeMirror integration via `window.strudelMirror`
- [x] Basic CLI tool structure
- [x] Core API endpoints: health, content, replace, eval

### 🔧 Current Issue
- [ ] **CLI HTTP client not working** - Node.js fetch compatibility issue
- [ ] **End-to-end workflow testing** - Need to verify full chain works

### 🎯 Phase 1 Success Criteria
- External tool can set/get editor content
- Text replacement works via API
- Code evaluation can be triggered remotely
- Changes appear instantly in browser
- No conflicts with existing Strudel functionality

## Phase 2: Intelligent Editing

### Goals
- [ ] **Cursor positioning** - Place cursor at specific functions/patterns
- [ ] **Range-based editing** - Edit specific text ranges precisely
- [ ] **Selection targeting** - Select specific code blocks
- [ ] **Context preservation** - Maintain indentation, style
- [ ] **Pattern recognition** - Identify musical constructs (drums, melody, effects)

### API Extensions Needed
```javascript
POST /api/editor/cursor     // Set cursor position
POST /api/editor/select     // Set text selection
POST /api/editor/edit       // Edit specific ranges
GET  /api/editor/selection  // Get current selection
POST /api/editor/insert     // Insert at specific position
```

## Phase 3: Musical Intelligence

### Goals
- [ ] **AST parsing** - Understand Strudel code structure
- [ ] **Pattern analysis** - Recognize drums, melody, harmony patterns
- [ ] **Musical context** - Know scales, rhythms, effects relationships
- [ ] **Smart suggestions** - Propose musically coherent changes
- [ ] **Multi-agent collaboration** - Multiple AIs working together

## Phase 4: Autonomous Agents

### Goals  
- [ ] **Real-time feedback loop** - Hear results and adjust automatically
- [ ] **Collaborative live coding** - Human-AI performance partnerships  
- [ ] **Autonomous composition** - AI generates complete musical pieces
- [ ] **Learning system** - Improve based on user preferences

## Implementation Strategy

### Technical Principles
1. **Non-invasive approach** - Minimal changes to core Strudel
2. **Graceful degradation** - Works without API server running
3. **Real-time communication** - WebSocket for instant updates
4. **Security first** - Localhost only, user-initiated connections
5. **Technology agnostic** - Any HTTP client can control Strudel

### Current File Structure
```
strudel/
├── api-server.mjs              # Express + WebSocket server
├── strudel-cli.mjs             # Command line interface  
├── plan.md                     # This file
├── package.json                # Added express, cors, ws deps
└── website/src/repl/
    ├── api-client.mjs          # Browser WebSocket client
    └── useReplContext.jsx      # Modified to import api-client
```

## Next Actions (Immediate)

### Priority 1: Fix Current Issues
1. **Fix CLI HTTP client** - Replace fetch with compatible solution
2. **Test end-to-end workflow** - Verify CLI → API → Browser → Editor
3. **Validate basic operations** - content set/get, replace, eval

### Priority 2: Add Precision Editing
4. **Implement cursor positioning API** 
5. **Add range-based editing**
6. **Create intelligent text selection**

### Priority 3: Testing & Polish
7. **Create test scenarios** - Common editing use cases
8. **Add error handling** - Graceful failure modes
9. **Performance optimization** - Minimize latency

## Success Metrics

**Phase 1 Complete When:**
- [x] API server starts without errors
- [x] Browser connects to WebSocket automatically  
- [ ] CLI can set editor content and see changes in browser
- [ ] Text replacement works correctly
- [ ] Code evaluation triggers successfully

**Long-term Success:**
- Claude can intelligently edit specific musical patterns
- Multiple agents collaborate on same piece
- Real-time collaborative live coding sessions
- Autonomous music generation with human oversight

---

**Current Status:** Phase 1 - Foundation (95% complete, fixing CLI HTTP issue)
**Next Milestone:** End-to-end workflow demonstration
**Timeline:** Phase 1 completion target - Today