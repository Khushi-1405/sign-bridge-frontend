require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);

// ✅ 1. MONGO CONNECTION
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🍃 MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ 2. ROBUST CORS SETUP
const allowedOrigins = [
  "https://sign-bridge-frontend-git-main-khushi-dubeys-projects-f032c6aa.vercel.app",
  "https://sign-bridge-frontend-k30j1x17y-khushi-dubeys-projects-f032c6aa.vercel.app",
  "https://sign-bridge-frontend-six.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin or if in whitelist
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("⚠️ CORS Blocked Origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

const authRoute = require("./routes/auth");
app.use("/api/auth", authRoute);

app.get("/", (req, res) => {
  res.send("SignBridge Backend is Live! 🤟");
});

// ✅ 3. SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true, // Compatibility for older clients
  transports: ["polling", "websocket"]
});

const users = new Map(); 

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);
  socket.emit("me", socket.id);

  socket.on("register-user", (userId) => {
    if (!userId) return;
    users.set(userId, socket.id);
    console.log(`✅ Registered: ${userId} -> ${socket.id}`);
    socket.emit("registered");
  });

  socket.on("call-user", ({ targetId, from, roomId }) => {
    const targetSocket = users.get(targetId);
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", { from, roomId });
    } else {
      socket.emit("user-offline", { targetId });
    }
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`👤 ${socket.id} joined room: ${roomId}`);
    
    const clients = io.sockets.adapter.rooms.get(roomId);
    // If there are at least 2 people, start the handshake
    if (clients && clients.size >= 2) {
      console.log(`🚀 Room ${roomId} is full. Starting handshake...`);
      // Emit to EVERYONE in the room
      io.in(roomId).emit("call-started");
    }
  });

  // 📝 TWO-WAY SYNC (Captions & WebRTC)
  // socket.to(roomId) sends to everyone EXCEPT sender
  socket.on("send-caption", (data) => {
    socket.to(data.roomId).emit("receive-caption", data);
  });

  socket.on("offer", (offer, roomId) => socket.to(roomId).emit("offer", offer));
  socket.on("answer", (answer, roomId) => socket.to(roomId).emit("answer", answer));
  socket.on("ice-candidate", (candidate, roomId) => socket.to(roomId).emit("ice-candidate", candidate));
  
  socket.on("send-sign", (sign, roomId) => socket.to(roomId).emit("receive-sign", sign));
  socket.on("send-text", (text, roomId) => socket.to(roomId).emit("receive-text", text));

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit("call-ended");
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        console.log(`🧹 Cleaned up: ${userId}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 SignBridge Server running on port ${PORT}`);
});