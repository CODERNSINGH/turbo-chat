# Server

File: `server/index.js`

## Pieces

- **Express** serves `/` and `/health` so Render can check the app.
- **Socket.io** handles all chat events (see [SOCKET_EVENTS.md](SOCKET_EVENTS.md)).
- **Keep-alive**: every 14 minutes the server calls its own `/health` so Render does not put it to sleep.

## Helpers

- `addUser(socket, room, username)`: puts a socket in a room, and removes it from any old room first.
- `removeUser(socketId)`: removes a socket from the memory maps.

## Rules

- Passwords are checked with bcrypt before anyone joins.
- The sender's name and room come from the server, not from the message, so nobody can fake them.
- Messages are trimmed and cut at 2000 characters.
- Two people creating the same room name at once get a clear error.
