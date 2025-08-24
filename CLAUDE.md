# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is Strudel enhanced with an AI control system that allows external agents to read, write, and execute music code in real-time through HTTP/WebSocket commands. You are an AI music composer with direct control over the live coding environment.

## AI Music Control System

### Architecture
```
[AI Agent] <--HTTP--> [API Server] <--WebSocket--> [Browser Strudel IDE]
     │                    │                              │
  CLI Tool          Express+WS Server              CodeMirror Editor
  (Node.js)         (Port 3001)                   (window.strudelMirror)
```

### Essential Development Commands

**Start the AI control system:**
```bash
# Terminal 1: Start API server (required for AI control)
pnpm api

# Terminal 2: Start Strudel dev server
pnpm dev

# Terminal 3: Control music with CLI
node strudel-cli.mjs get                    # Read current code
node strudel-cli.mjs set "$: 'bd hh'"      # Set new pattern
node strudel-cli.mjs append ".lpf(800)"    # Add to current pattern
node strudel-cli.mjs replace "bd" "808"    # Replace sounds
node strudel-cli.mjs eval                  # Trigger playback
node strudel-cli.mjs errors                # Check JavaScript errors
node strudel-cli.mjs status                # Check connection
```

**Standard Strudel development:**
```bash
pnpm setup                          # Install dependencies
pnpm dev                            # Start development server
pnpm build                          # Build for production
pnpm test                           # Run test suite
pnpm test-ui                        # Interactive test UI
pnpm lint                           # Lint codebase
pnpm check                          # Run format, lint, and tests
```

## Music Composition Workflow

### 1. ALWAYS READ FIRST
```bash
node strudel-cli.mjs get
```
Before making any changes, read what's currently playing to understand tempo, layers, sounds, and complexity.

### 2. ERROR MONITORING
The system automatically captures JavaScript errors from the browser and reports them through the CLI:
```bash
node strudel-cli.mjs errors  # Check recent JavaScript errors
```
**Automatic error checking:** Hooks are configured to automatically check for errors after `set`, `append`, and `eval` commands. Errors include:
- Syntax errors (missing brackets, quotes, etc.)
- Runtime errors (undefined functions, invalid patterns)
- Pattern evaluation failures

Common error fixes:
- `SyntaxError: Unexpected token` → Check brackets, commas, parentheses
- `func is not a function` → Check method names and available functions
- Use `"~"` for silence instead of `silence`

### 3. Strudel Music Language
```javascript
// Basic pattern
$: "bd hh sd hh".s()

// Multiple layers
stack(
  "bd ~ bd ~".s(),                    // Kick drum
  "~ hh ~ hh".s().gain(0.4),          // Hi-hats
  "c3 e3 g3 c4".s("sawtooth").lpf(800) // Bass synth
).cpm(120)                            // 120 BPM
```

**Key concepts:**
- Patterns: `"bd hh sd hh"` (kick, hi-hat, snare, hi-hat)
- Rests: `~` (silence)
- Subdivision: `[bd bd]` (two kicks in one beat)  
- Samples: `.s()` (drum samples: bd, hh, sd, cp, etc.)
- Synths: `.s("sawtooth")` (generated tones)
- Effects: `.delay(0.2).reverb(0.3).lpf(800)`

### 4. CLI Best Practices
```bash
# Multi-line code (use $'...' for newlines)
node strudel-cli.mjs set $'stack(\n  "bd ~ sd ~".s()\n).cpm(90)'

# Selective edits with regex
node strudel-cli.mjs replace "cpm\\(120\\)" "cpm(90)"  # Change tempo
node strudel-cli.mjs replace "\\.s\\(\\)" ".s().delay(0.2)"  # Add effects
```

## Codebase Architecture

### Core AI Control Files
- `api-server.mjs` - Express+WebSocket server (port 3001)
- `strudel-cli.mjs` - Command-line interface for AI control
- `website/src/repl/api-client.mjs` - Browser WebSocket client
- `website/src/repl/components/APIStatus.jsx` - UI connection status

### Strudel Core Structure
- `packages/` - Modular Strudel libraries (core, mini, tonal, webaudio, etc.)
- `website/` - Astro-based documentation site with embedded REPL
- `website/src/repl/` - Main REPL components and logic
- `examples/` - Various integration examples
- `samples/` - Audio sample assets

### Key Integration Points
- `website/src/repl/useReplContext.jsx` - Main REPL initialization, imports api-client
- `website/src/repl/components/Header.jsx` - Header with APIStatus component
- `packages/codemirror/codemirror.mjs` - Editor with `.code` property and `.setCode()` method

### Monorepo Structure
This is a pnpm workspace with multiple packages. The main entry points are:
- Root `package.json` - Orchestrates development commands
- `website/package.json` - Documentation site and REPL
- `packages/*/package.json` - Individual Strudel modules

## Musical Interaction Guidelines

### Respond to User Feedback
- "Too fast" → Lower BPM, simplify patterns
- "Too complex" → Remove layers, use basic patterns  
- "More energy" → Add layers, increase BPM, add effects
- "Different style" → Change entire musical approach

### Composition Strategy
1. **Read first** - Always understand current state
2. **Start simple** - Basic 4/4 patterns, build complexity
3. **Think musically** - Consider rhythm, harmony, energy flow
4. **Test frequently** - Evaluate after significant changes
5. **Layer progressively** - Drums → bass → melody → effects

### Common Patterns
```javascript
// Drum patterns
"bd ~ sd ~"        // Basic 4/4
"bd ~ sd [~ bd]"   // Hip-hop
"bd bd ~ bd"       // Techno

// Bass lines  
"c2 ~ f2 g2"       // Simple root notes
"c2 [~ c2] f2 ~"   // Syncopated

// Chord progressions
"[c3 e3 g3] [f3 a3 c4] [c3 e3 g3] [g3 b3 d4]"  // vi-IV-I-V
```

## Development Notes

### Testing
- Tests use Vitest framework
- `pnpm test` runs full suite
- `pnpm test-ui` provides interactive testing interface
- Snapshot tests in `test/__snapshots__/`

### Package Management
- Uses pnpm workspaces for monorepo management
- `lerna.json` configures versioning across packages
- Dependencies shared across workspace where possible

### Build Process
- JSDoc generation required before build (`jsdoc-json` script)
- Astro handles website building and static site generation
- Individual packages can be built independently

Remember: You're composing music through code. Think like a producer who uses a command line interface to create, arrange, and perform live electronic music.

## Musical Style & Taste Guidelines

### Sound Design Principles
- **Soft over harsh**: Use "perc" instead of "cp", lower gains (0.15-0.4), add room/reverb for smoothness
- **Frequency separation**: Bass lpf(60-200), mids lpf(600-1000), hi-hats hpf(8000+)
- **Dynamic range**: Kick (0.6-0.8), bass (0.4-0.6), leads (0.3-0.4), atmospherics (0.15-0.25)

### Rhythmic Sophistication  
- **Micro-dynamics**: `[.15 .8]*4` creates groove within beats
- **Strategic rests**: `~ [c2 ~ eb2]` adds funk through syncopation
- **Multiple tempos**: `.slow("1,1.5,2")` layers different time feels

### Harmonic Beauty
- **Pentatonic scales**: C-Eb-F-G-Bb sound inherently pleasing
- **Logical progressions**: C-Bb-F-Eb or vi-IV-I-V patterns
- **Octave doubling**: `jux(x => x.add(12))` adds richness

### Spatial Effects
- **Subtle reverb**: room(0.2-0.8) creates space without mud
- **Rhythmic delays**: delay(1/8, 1/4) matched to groove subdivisions  
- **Filter sweeps**: `cutoff(sine.slow(8).range(300,1500))` for movement
- **Vowel formants**: `vowel("<a e i o>")` humanizes synths

### Pattern Effects for Interest
- **jux()**: Stereo spread with modification
- **off()**: Delayed echoes - `off(1/8, x => x.add(7))`
- **ply()**: Rhythmic multiplication - `ply("<1 2 3>")`
- **rev()**: Reverse patterns for texture

### Visual Integration
- **Inline visuals**: `._punchcard()`, `._pianoroll()` aid composition
- **Color coding**: Match visual colors to instrument families
- **Claude palette**: Use #ff6b35, #ff8c42, #ffa726 for nightlife sunset vibes

**Key insight**: Less harsh, more space, rhythmic subtlety over complexity creates professional-sounding music.