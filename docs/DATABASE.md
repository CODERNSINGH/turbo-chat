# Database

PostgreSQL, one table, created automatically on server start (`initDb` in `server/db.js`).

```sql
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Functions in db.js

| Function | Purpose |
|---|---|
| createRoom | Hash the password with bcrypt and insert |
| findRoom | Look up a room by name, ignoring case |
| verifyRoomPassword | Compare plain password to the hash |
| listRooms | All room names, newest first |

Messages and users are not stored.
