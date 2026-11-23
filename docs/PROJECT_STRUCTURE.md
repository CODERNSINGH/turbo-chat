# Project Structure

```
turbo-chat/
├── bin/forktrix-chat.js   # CLI entry point, prints banner, connects, opens menu
├── src/
│   ├── config.js          # Picks the server URL (--server flag, SERVER_URL env, or default)
│   ├── socket.js          # Connects to the server with socket.io-client
│   ├── menu.js            # Create Room / Join Room / Exit menus
│   └── chat.js            # The live chat screen and /commands
├── server/
│   ├── index.js           # Express + Socket.io server, all events live here
│   └── db.js              # PostgreSQL pool, rooms table, bcrypt helpers
├── docs/                  # These guides
├── test-e2e.mjs           # End-to-end test (needs a database)
├── .env.example           # Template for environment variables
├── .gitignore             # Files git should not track
└── package.json
```

## Folder rule of thumb

- `bin/` and `src/` run on the user's computer (the client).
- `server/` runs on Render (the backend).
