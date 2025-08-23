# Param Strudels — AI‑Assisted Live Coding for Strudel

Build and perform live music with an autonomous AI agent that can read, write and evaluate Strudel code in your browser IDE.

This repo adds a lightweight API layer and CLI so external agents can control the Strudel editor in real time over HTTP/WebSocket, without invasive changes to core Strudel.

## What’s inside

- API server (Express + WebSocket) translating HTTP into editor actions
- Browser client that connects automatically and drives CodeMirror
- Minimal CLI for sending commands from the terminal

## Quick start

1. Install prerequisites
   ```bash
   pnpm i
   ```
2. Start the API server
   ```bash
   pnpm api
   ```
3. Start the Strudel dev server (opens the IDE)
   ```bash
   pnpm dev
   ```
4. In another terminal, try a command (sets code in the editor)
   ```bash
   node strudel-cli.mjs set "$: 'bd hh'"
   ```

That’s it — the AI bridge is live. Agents can now GET/SET editor content and trigger evaluation remotely.

## Premise

An autonomous agent collaborates with you by editing and executing Strudel patterns in real time, enabling hands‑free arrangement, transformation, and performance.

## More details

High‑level plan and technical overview live in the commit notes and these docs:

- `plan.md` — roadmap and phases
- `overview.md` — architecture and workflow

License: [AGPL‑3.0‑or‑later](LICENSE)
