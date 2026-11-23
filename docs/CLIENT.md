# Client

## Flow

1. `bin/forktrix-chat.js` prints the banner and calls `connectSocket()`.
2. `src/menu.js` shows the main menu and asks for room name, password, and display name.
3. After `room_joined`, `src/chat.js` takes over the terminal.

## Chat screen

- Uses Node `readline` so your half-typed line is not wrecked by incoming messages.
- Commands: `/help`, `/clear`, `/info`, `/exit`.
- If the connection drops, it tells you to `/exit` and join again. It does not reconnect to the room on its own.

## Server URL

Order of choice: `--server <url>` flag, then `SERVER_URL` env var, then the default Render URL in `src/config.js`.
