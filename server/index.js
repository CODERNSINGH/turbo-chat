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

      // Join the socket room
      socket.join(trimmedName);

      // Track user in memory
      activeUsers[trimmedName] = [{ socketId: socket.id, username: trimmedUser }];
      socketRoomMap[socket.id] = { roomName: trimmedName, username: trimmedUser };

      console.log(`[Room Created] "${trimmedName}" by ${trimmedUser}`);
      socket.emit("room_joined", {
        roomName: trimmedName,
        username: trimmedUser,
      });
    } catch (err) {
      console.error("Error creating room:", err.message);
      socket.emit("error", { message: "Failed to create room. Please try again." });
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

      // Join socket.io room
      socket.join(trimmedName);

      // Track user in memory
      if (!activeUsers[trimmedName]) {
        activeUsers[trimmedName] = [];
      }
      activeUsers[trimmedName].push({ socketId: socket.id, username: trimmedUser });
      socketRoomMap[socket.id] = { roomName: trimmedName, username: trimmedUser };

      console.log(`[User Joined] ${trimmedUser} joined "${trimmedName}"`);

      // Confirm to current socket
      socket.emit("room_joined", {
        roomName: trimmedName,
        username: trimmedUser,
      });

      // Broadcast to other users in the room
      socket.to(trimmedName).emit("user_joined", {
        username: trimmedUser,
      });
    } catch (err) {
      console.error("Error joining room:", err.message);
      socket.emit("error", { message: "Failed to join room. Please try again." });
    }
  });

  // 4. Send and broadcast message
  socket.on("send_message", ({ roomName, username, text }) => {
    if (!roomName || !text || !text.trim()) return;

    const messagePayload = {
      username: username || "Anonymous",
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    // Broadcast to everyone in the room (including sender)
    io.to(roomName).emit("receive_message", messagePayload);
  });

  // 5. Disconnect handling
  socket.on("disconnect", () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    const userSession = socketRoomMap[socket.id];
    if (userSession) {
      const { roomName, username } = userSession;
      delete socketRoomMap[socket.id];

      if (activeUsers[roomName]) {
        activeUsers[roomName] = activeUsers[roomName].filter(
          (u) => u.socketId !== socket.id
        );
        if (activeUsers[roomName].length === 0) {
          delete activeUsers[roomName];
        }
      }

      // Notify other members of the room
      socket.to(roomName).emit("user_left", { username });
      console.log(`[User Left] ${username} left "${roomName}"`);
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
    });
  })
  .catch((err) => {
    console.error("Server startup failed due to DB error:", err.message);
    process.exit(1);
  });
