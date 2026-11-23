# Architecture

```
Client A ──┐
           ├── Socket.io ──► Server (Node + Express) ──► PostgreSQL
Client B ──┘
```

## Who does what

- **Client**: shows menus, reads what you type, prints incoming messages.
- **Server**: checks passwords, keeps track of who is in which room, and passes messages to everyone in the room.
- **Database**: only stores rooms (name + hashed password). Messages are never saved.

## Life of a message

1. You type text and press Enter.
2. Client emits `send_message` with the text.
3. Server looks up your room and name from its own memory (`socketRoomMap`).
4. Server emits `receive_message` to everyone in that room, including you.
5. Each client prints it.

## Server memory

- `activeUsers`: room name -> list of users in it
- `socketRoomMap`: socket id -> room and username

This is lost when the server restarts, which is why a restart removes everyone from their rooms.
