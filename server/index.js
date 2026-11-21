import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import {
  initDb,
  createRoom,
  findRoom,
  verifyRoomPassword,
  listRooms,
} from "./db.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for socket and HTTP connections
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 20000,
});

const PORT = process.env.PORT || 3000;

// In-memory active users state:
// activeUsers: roomName -> [ { socketId, username } ]
const activeUsers = {};
// socketRoomMap: socketId -> { roomName, username }
const socketRoomMap = {};

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    app: "Turbo-Chat Server",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Render free tier sleeps after 15 min idle, so ping ourselves every 14 min
const KEEP_ALIVE_MS = 14 * 60 * 1000;
const SELF_URL = process.env.RENDER_EXTERNAL_URL || "https://turbo-chat-2wuy.onrender.com";

function startKeepAlive() {
  setInterval(async () => {
    try {
      const res = await fetch(`${SELF_URL}/health`);
      console.log(`[Keep-Alive] ping ${res.status}`);
    } catch (err) {
      console.error("[Keep-Alive] ping failed:", err.message);
    }
  }, KEEP_ALIVE_MS);
}

// Remove a socket from the in-memory room state
function removeUser(socketId) {
  const session = socketRoomMap[socketId];
  if (!session) return null;
  delete socketRoomMap[socketId];
  const { roomName } = session;
  if (activeUsers[roomName]) {
    activeUsers[roomName] = activeUsers[roomName].filter((u) => u.socketId !== socketId);
    if (activeUsers[roomName].length === 0) delete activeUsers[roomName];
  }
  return session;
}

// Add a socket to a room (leaves any previous room first)
function addUser(socket, roomName, username) {
  const previous = removeUser(socket.id);
  if (previous) {
    socket.leave(previous.roomName);
    socket.to(previous.roomName).emit("user_left", { username: previous.username });
  }
  socket.join(roomName);
  if (!activeUsers[roomName]) activeUsers[roomName] = [];
  activeUsers[roomName].push({ socketId: socket.id, username });
  socketRoomMap[socket.id] = { roomName, username };
}

// Socket.io event handling
io.on("connection", (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // 1. List available rooms
  socket.on("list_rooms", async () => {
    try {
      const rooms = await listRooms();
      socket.emit("room_list", rooms);
    } catch (err) {
      console.error("Error listing rooms:", err.message);
      socket.emit("error", { message: "Failed to fetch room list." });
    }
  });

  // 2. Create room
  socket.on("create_room", async ({ roomName, password, username }) => {
    try {
      if (!roomName || !password || !username) {
        return socket.emit("error", {
          message: "Room name, password, and display name are required.",
        });
      }

      const trimmedName = roomName.trim();
      const trimmedUser = username.trim();

      // Check if room name is already taken
      const existing = await findRoom(trimmedName);
      if (existing) {
        return socket.emit("error", {
          message: `Room "${trimmedName}" already exists. Please choose a different name.`,
        });
      }

      // Hash password and store in PostgreSQL
      await createRoom(trimmedName, password);

      addUser(socket, trimmedName, trimmedUser);

      console.log(`[Room Created] "${trimmedName}" by ${trimmedUser}`);
      socket.emit("room_joined", {
        roomName: trimmedName,
        username: trimmedUser,
      });
    } catch (err) {
      console.error("Error creating room:", err.message);
      // 23505 = unique violation (two people made the same room at once)
      const message =
        err.code === "23505"
          ? "That room name was just taken. Please choose a different name."
          : "Failed to create room. Please try again.";
      socket.emit("error", { message });
    }
  });

  // 3. Join room
  socket.on("join_room", async ({ roomName, password, username }) => {
    try {
      if (!roomName || !password || !username) {
        return socket.emit("error", {
          message: "Room name, password, and display name are required.",
        });
      }

      const trimmedName = roomName.trim();
      const trimmedUser = username.trim();

      // Find room in database
      const room = await findRoom(trimmedName);
      if (!room) {
        return socket.emit("error", {
          message: `Room "${trimmedName}" was not found.`,
        });
      }

      // Verify room password with bcrypt
      const passwordMatch = await verifyRoomPassword(password, room.password_hash);
      if (!passwordMatch) {
        return socket.emit("error", {
          message: `Incorrect password for room "${trimmedName}".`,
        });
      }

      // A silent rejoin after a reconnect should not announce the user again
      const previous = socketRoomMap[socket.id];
      const isRejoin = previous && previous.roomName === trimmedName;
      if (!isRejoin) addUser(socket, trimmedName, trimmedUser);

      console.log(`[User Joined] ${trimmedUser} joined "${trimmedName}"`);

      // Confirm to current socket
      socket.emit("room_joined", {
        roomName: trimmedName,
        username: trimmedUser,
      });

      if (!isRejoin) {
        socket.to(trimmedName).emit("user_joined", { username: trimmedUser });
      }
    } catch (err) {
      console.error("Error joining room:", err.message);
      socket.emit("error", { message: "Failed to join room. Please try again." });
    }
  });

  // 4. Send and broadcast message
  socket.on("send_message", ({ text } = {}, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const session = socketRoomMap[socket.id];

    // Socket lost its room (e.g. after a reconnect): tell the client to rejoin
    if (!session) {
      socket.emit("not_in_room");
      return reply({ ok: false });
    }
    if (typeof text !== "string" || !text.trim()) return reply({ ok: false });

    io.to(session.roomName).emit("receive_message", {
      username: session.username,
      text: text.trim().slice(0, 2000),
      timestamp: new Date().toISOString(),
    });
    reply({ ok: true });
  });

  // Client left the room but stays connected
  socket.on("leave_room", () => {
    const session = removeUser(socket.id);
    if (!session) return;
    socket.leave(session.roomName);
    socket.to(session.roomName).emit("user_left", { username: session.username });
  });

  // 5. Disconnect handling
  socket.on("disconnect", () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    const session = removeUser(socket.id);
    if (session) {
      socket.to(session.roomName).emit("user_left", { username: session.username });
      console.log(`[User Left] ${session.username} left "${session.roomName}"`);
    }
  });
});

// Initialize database and start the server
initDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  Turbo-Chat Server running on port ${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/health`);
      console.log(`========================================`);
      startKeepAlive();
    });
  })
  .catch((err) => {
    console.error("Server startup failed due to DB error:", err.message);
    process.exit(1);
  });
