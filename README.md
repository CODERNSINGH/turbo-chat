# ⚡ Turbo-Chat

A simple, lightweight CLI real-time chat application powered by **Node.js**, **Express**, **Socket.io**, and **PostgreSQL**.

Built as a college final-year project: clean, readable, and without unnecessary over-engineering.

---

## 🌟 Features

- **Terminal-First UX**: Pure CLI experience with interactive menus using `inquirer` and colored status output with `chalk`.
- **Real-Time Messaging**: Instant WebSocket broadcasting with `socket.io`.
- **Persistent Rooms**: Room names and bcrypt-hashed passwords stored in PostgreSQL (Neon DB).
- **Zero Chat History Overhead**: Messages are live-only (in-memory broadcasting) — lightweight and fast.
- **Graceful In-Chat Typing**: Incoming messages don't break or overwrite your typing prompt.
- **Easy Room Commands**: Type `/exit` anytime to leave a room.

---

## 🏗️ Architecture

```
┌─────────────────────┐          ┌──────────────────────┐          ┌────────────────┐
│  Terminal Client A   │◄────────►│                       │          │                │
│  (turbo-chat CLI)   │  Socket  │   Node.js Server      │◄────────►│   PostgreSQL   │
└─────────────────────┘   .io     │   (Express + Socket.io│  pg lib  │   (rooms table)│
┌─────────────────────┐  events   │    running on Render) │          │                │
│  Terminal Client B   │◄────────►│                       │          │                │
│  (turbo-chat CLI)   │          └──────────────────────┘          └────────────────┘
└─────────────────────┘
```

---

## 📁 Project Structure

```
turbo-chat/
├── bin/
│   └── turbo-chat.js     # Executable CLI entry point (#!/usr/bin/env node)
├── src/
│   ├── config.js         # Configuration (Server URL resolution)
│   ├── socket.js         # Socket.io-client connection manager
│   ├── menu.js           # Interactive Inquirer menus (Create / Join flow)
│   └── chat.js           # Readline live chat loop & message formatting
├── server/
│   ├── db.js             # PostgreSQL pool, schema initialization, and queries
│   └── index.js          # Express + Socket.io server & event handling
├── .env                  # PostgreSQL DATABASE_URL & PORT (not committed)
├── .env.example          # Example environment variables
├── package.json          # Root package definition (includes "bin" configuration)
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** (e.g. Neon PostgreSQL connection string)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Database
Copy `.env.example` to `.env` (or configure your Neon DB URL):
```env
DATABASE_URL=postgresql://user:password@your-host.neon.tech/neondb?sslmode=require
PORT=3000
```

### 4. Start Backend Server
```bash
npm run server
```
The server will automatically connect to Postgres and ensure the `rooms` table is created.

### 5. Start CLI Chat Client
In a new terminal window:
```bash
npm start
```
Or run the binary directly:
```bash
./bin/turbo-chat.js
```

To connect to a custom server (e.g., deployed server on Render):
```bash
./bin/turbo-chat.js --server https://your-server.onrender.com
# OR
SERVER_URL=https://your-server.onrender.com npm start
```

---

## 📦 Global NPM Installation (Optional)

To install globally on your machine:
```bash
npm install -g .
turbo-chat
```

---

## 🔌 Socket.io Events Reference

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `list_rooms` | Client ➔ Server | *(none)* | Requests list of existing room names |
| `room_list` | Server ➔ Client | `[roomName, ...]` | Returns array of room names |
| `create_room` | Client ➔ Server | `{ roomName, password, username }` | Hashes password, saves room in DB, joins user |
| `join_room` | Client ➔ Server | `{ roomName, password, username }` | Validates password against DB hash, joins user |
| `room_joined` | Server ➔ Client | `{ roomName, username }` | Confirms user joined the room |
| `user_joined` | Server ➔ Broadcast | `{ username }` | Notifies others that user joined |
| `send_message` | Client ➔ Server | `{ roomName, username, text }` | Sends chat message |
| `receive_message`| Server ➔ Broadcast | `{ username, text, timestamp }` | Delivers chat message to everyone in room |
| `user_left` | Server ➔ Broadcast | `{ username }` | Notifies room members when user disconnects |
| `error` | Server ➔ Client | `{ message }` | Sends error notification to client |
