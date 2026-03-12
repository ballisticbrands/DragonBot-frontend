# DragonBot Frontend

This repo is the frontend for the DragonBot project. You can find the core DragonBot repo here:
https://github.com/ballisticbrands/DragonBot

## Initial structure

The frontend should look one-to-one like the demo frontend built for the landing page. You can find it here (see the `/chats` page):
https://github.com/ballisticBrands/DragonBotLP

## Logging in

Each DragonBot user will have their own DragonBot set up in its own VPN. Therefore, their frontend should only connect to their DragonBot instance.

TODO
* Implement a log-in page
* Do NOT implement account creation at this point
* The backend of the logging in should be implemented in https://github.com/ballisticbrands/DragonBot-backend (available locally at /Users/gershonballas/work/DragonBot/DragonBot-backend), it should include:
    * API paths for implementing the log-in
    * A DB of users, including a unique ID, their first name, last name, email, password, IP of their DragonBot instance, a unique ID for their DragonBot instance
        * Create a separate table for DragonBot, the user table will only reference the DragonBot's unique ID
        * The IP of the DragonBot will be stored in the DragonBots table

## Communicating with the DragonBot

Build the frontend implementation based on the implementation in the official OpenClaw repo (https://github.com/openclaw/openclaw). Here are the details:

### Where the frontend lives
The built-in frontend is in ui/src/ui/ — a Vite + Lit Web Components SPA (~67 TS files). The key file to study is ui/src/ui/gateway.ts — the GatewayBrowserClient class. That's your reference implementation for connecting from a browser.

For Node.js context, src/gateway/client.ts is the same protocol in a non-browser environment.

### The protocol
Pure WebSocket, JSON-RPC style. No REST API. Three frame types:


// Client → Server (call)
{ "type": "req", "id": "<uuid>", "method": "chat.send", "params": { ... } }

// Server → Client (response)
{ "type": "res", "id": "<uuid>", "ok": true, "payload": { ... } }

// Server → Client (broadcast event)
{ "type": "event", "event": "agent", "payload": { ... }, "seq": 123 }
Handshake:

Server sends connect.challenge with a nonce
Client sends connect with auth (token/password/device-token)
Server responds with hello-ok (or closes with error)
All method schemas are in src/gateway/protocol/schema/. The chat flow specifically is chat.send → stream of agent events → final chat event.

### Submodule — don't
Don't submodule the openclaw repo. You don't need the full source. What you actually need:

The protocol schema (TypeBox types) — you can just copy/vendor the relevant types from src/gateway/protocol/
The GatewayBrowserClient from ui/src/ui/gateway.ts — you can adapt this directly
The openclaw repo is large (mobile apps, CLI, multiple channels). Submoduling it would bloat your frontend repo with irrelevant code and tie your release cycle to OpenClaw's main branch.

### Best approach
Standalone frontend repo, vendor only what you need:


dragonbot-frontend/
├── src/
│   ├── gateway/
│   │   ├── client.ts      # adapted from ui/src/ui/gateway.ts
│   │   ├── protocol.ts    # copied/trimmed from src/gateway/protocol/
│   │   └── types.ts       # method param/response types you actually use
│   ├── components/
│   └── ...
├── package.json
└── ...
Copy ui/src/ui/gateway.ts into your repo and adapt it — strip the Lit-specific parts, keep the WebSocket logic. The protocol types you need are in src/gateway/protocol/schema/frames.ts (the three frame types) plus whatever method schemas you'll call (e.g., chat.send, sessions.list).

### What you actually need to implement a basic chat UI:

chat.send — send a message
chat.history — load transcript
agent events — stream the response
sessions.list / sessions.reset — session management
The connect handshake with token auth (simplest: { "auth": { "token": "your-gateway-token" } })

## Hosting

This should be hosted as a GitHub Pages.

## Initial users

Create a User for:
First name: Gershon
Last name: Ballas
Email: gershon@ballisticbrands.co

Connected to the DragonBot hosted at 136.244.84.198.