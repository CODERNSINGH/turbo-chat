# Forktrix-Chat

A lightweight CLI real-time chat application powered by Node.js, Express, Socket.io, and PostgreSQL.

---

## Overview

Forktrix-Chat provides a terminal-based messaging experience with room-based isolation and WebSocket communication. Rooms and bcrypt-hashed passwords are persisted in PostgreSQL, while live messages are broadcast directly to connected clients with low latency.

---

## Features

- Terminal-First User Interface: Interactive menus powered by inquirer.
- Real-Time Messaging: Instant WebSocket communication via Socket.io.
- Persistent Room Storage: Room credentials hashed with bcrypt and stored in PostgreSQL.
- Ephemeral Message Delivery: Chat messages are broadcast in real time and not stored in the database.
- Non-Disruptive Typing: Terminal input line is preserved when new messages arrive.
- Single Command Execution: Install via npm or execute directly with npx.

---

## Architecture

```
┌─────────────────────────┐          ┌──────────────────────┐          ┌────────────────┐
│   Terminal Client A     │◄────────►│                      │          │                │
│   (forktrix-chat CLI)   │  Socket  │   Node.js Server     │◄────────►│   PostgreSQL   │
└─────────────────────────┘   .io    │   (Express + Socket) │  pg lib  │   (rooms table)│
┌─────────────────────────┐  events  │                      │          │                │
│   Terminal Client B     │◄────────►│                      │          │                │
│   (forktrix-chat CLI)   │          └──────────────────────┘          └────────────────┘
└─────────────────────────┘
```

---

## Project Structure

```
forktrix-chat/
├── bin/
│   └── forktrix-chat.js   # CLI entry point
├── src/
│   ├── config.js          # Resolves target server URL
│   ├── socket.js          # Socket.io client connection manager
│   ├── menu.js            # Interactive menus for creating and joining rooms
│   └── chat.js            # Terminal chat interface and message loop
├── server/
│   ├── db.js              # PostgreSQL connection pool and schema
│   └── index.js           # Server application and socket event listeners
├── package.json           # Package metadata and binary definitions
└── README.md
```

---

## Quick Start

### Run Instantly with npx
```bash
npx forktrix-chat
```

### Install Globally
```bash
npm install -g forktrix-chat
forktrix-chat
```

### Connecting to a Specific Server
```bash
forktrix-chat --server https://your-server.onrender.com
```

---

## Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require
PORT=3000
```

### 3. Start Backend Server
```bash
npm run server
```

### 4. Run CLI Client Locally
```bash
npm start
# or
node bin/forktrix-chat.js
```

### 5. Run Test Suite
```bash
npm test
```

---

## Socket.io Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| list_rooms | Client to Server | None | Requests list of available rooms |
| room_list | Server to Client | string[] | Returns array of room names |
| create_room | Client to Server | { roomName, password, username } | Creates a room and joins user |
| join_room | Client to Server | { roomName, password, username } | Validates password and joins user |
| room_joined | Server to Client | { roomName, username } | Confirms successful entry into room |
| user_joined | Server to Broadcast | { username } | Notifies participants of a new user |
| send_message | Client to Server | { roomName, username, text } | Transmits chat message |
| receive_message | Server to Broadcast | { username, text, timestamp } | Delivers message to room participants |
| user_left | Server to Broadcast | { username } | Notifies participants when user disconnects |
| error | Server to Client | { message } | Returns error message |
