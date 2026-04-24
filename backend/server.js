require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);

// ✅ 1. MONGO CONNECTION (Cleaned up and combined)
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI)
  .then(() => console.log("🍃 MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ 2. MIDDLEWARE & ROUTES
app.use(cors({
  origin: [
    "https://sign-bridge-frontend-git-main-khushi-dubeys-projects-f032c6aa.vercel.app",
    "https://sign-bridge-frontend-six.vercel.app",
    "http://localhost:5173" // Keep for local testing
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

const authRoute = require("./routes/auth");
app.use("/api/auth", authRoute);

// Added a simple home route so you don't see "Cannot GET /"
app.get("/", (req, res) => {
  res.send("SignBridge Backend is Live! 🤟");
});

// ✅ 3. SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: [
      "https://sign-bridge-frontend-git-main-khushi-dubeys-projects-f032c6aa.vercel.app",
      "https://sign-bridge-frontend-six.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"] // Match the frontend transports
});

const users = {}; // userId -> socketId mapping

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // 📢 CRITICAL: Send the socket ID back to the user immediately.
  // This is what flips the frontend from "Connecting..." to "Online".
  socket.emit("me", socket.id);

  // ✅ REGISTER USER
  socket.on("register-user", (userId) => {
    users[userId] = socket.id;
    console.log(`✅ Registered: ${userId} -> ${socket.id}`);
    socket.emit("registered");
  });

  // 📞 CALL USER
  socket.on("call-user", ({ targetId, from, roomId }) => {
    const targetSocket = users[targetId];
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", { from, roomId });
    } else {
      console.log("❌ User NOT FOUND:", targetId);
    }
  });

  // 🔗 JOIN ROOM & SYNC
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`👤 ${socket.id} joined room ${roomId}`);
    const clients = io.sockets.adapter.rooms.get(roomId);

    if (clients && clients.size >= 2) {
      setTimeout(() => {
        socket.emit("call-started");
        socket.to(roomId).emit("call-started");
      }, 1000);
    }
  });

  // 📝 CAPTIONS & DATA
  socket.on("send-caption", (data) => {
    socket.to(data.roomId).emit("receive-caption", data);
  });

  // 🎥 WEBRTC SIGNALING
  socket.on("offer", (offer, roomId) => socket.to(roomId).emit("offer", offer));
  socket.on("answer", (answer, roomId) => socket.to(roomId).emit("answer", answer));
  socket.on("ice-candidate", (candidate, roomId) => socket.to(roomId).emit("ice-candidate", candidate));

  // 🤟 AI SIGN SHARING
  socket.on("send-sign", (sign, roomId) => socket.to(roomId).emit("receive-sign", sign));
  socket.on("send-text", (text, roomId) => socket.to(roomId).emit("receive-text", text));

  // ❌ DISCONNECT LOGIC
  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit("call-ended");
  });

  socket.on("disconnect", () => {
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        console.log(`🧹 Cleaned up: ${userId}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 SignBridge Socket Server running on port ${PORT}`);
});