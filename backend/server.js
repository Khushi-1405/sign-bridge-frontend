require("dotenv").config(); // ✅ Load environment variables first
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
require('dotenv').config();

// Change your connection line to use the variable:
const dbURI = process.env.MONGO_URI; 
mongoose.connect(dbURI) .then(() => console.log("🍃 MongoDB Connected Successfully!")) .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Import the new Auth Routes
const authRoute = require("./routes/auth");

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://sign-bridge-frontend-six.vercel.app", // Add your deployed URL here later
];

app.use(cors({
  origin: [
    "https://sign-bridge-frontend-git-main-khushi-dubeys-projects-f032c6aa.vercel.app",
    "https://sign-bridge-frontend-six.vercel.app" // Add your shorter production link too
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json()); // ✅ Critical for reading JSON body in Register/Login

// ✅ Connect new Auth Routes
app.use("/api/auth", authRoute);

// ✅ MONGODB CONNECTION LOGIC
const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log("🍃 MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const users = {}; // userId -> socketId mapping

const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "https://sign-bridge-frontend-git-main-khushi-dubeys-projects-f032c6aa.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // ✅ REGISTER USER (Socket Mapping)
  socket.on("register-user", (userId) => {
    users[userId] = socket.id;
    console.log(`✅ Registered: ${userId} -> ${socket.id}`);
    socket.emit("registered");
  });

  // 📞 CALL USER
  socket.on("call-user", ({ targetId, from, roomId }) => {
    console.log("\n📞 CALL EVENT");
    const targetSocket = users[targetId];
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", { from, roomId });
    } else {
      console.log("❌ User NOT FOUND:", targetId);
    }
  });

  // 🔗 JOIN ROOM & SYNC HANDSHAKE
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`👤 ${socket.id} joined room ${roomId}`);
    const clients = io.sockets.adapter.rooms.get(roomId);

    if (clients && clients.size >= 2) {
      console.log(`🔥 ROOM FULL (${roomId}). Triggering explicit handshake...`);
      setTimeout(() => {
        socket.emit("call-started");
        socket.to(roomId).emit("call-started");
        console.log("📢 Handshake sent to both peers.");
      }, 1000);
    }
  });

  socket.on("send-caption", (data) => {
    socket.to(data.roomId).emit("receive-caption", data);
  });

  // 🎥 WEBRTC SIGNALING
  socket.on("offer", (offer, roomId) => socket.to(roomId).emit("offer", offer));
  socket.on("answer", (answer, roomId) =>
    socket.to(roomId).emit("answer", answer),
  );
  socket.on("ice-candidate", (candidate, roomId) =>
    socket.to(roomId).emit("ice-candidate", candidate),
  );

  // 🤟 SIGN SHARING
  socket.on("send-sign", (sign, roomId) =>
    socket.to(roomId).emit("receive-sign", sign),
  );

  // 🎤 TEXT SHARING
  socket.on("send-text", (text, roomId) =>
    socket.to(roomId).emit("receive-text", text),
  );

  // ❌ MANUAL LEAVE
  socket.on("leave-room", (roomId) => {
    console.log("❌ User manually left room:", roomId);
    socket.leave(roomId);
    socket.to(roomId).emit("call-ended");
  });

  // ❌ AUTO DISCONNECT
  socket.on("disconnecting", () => {
    console.log("⚠️ User disconnecting:", socket.id);
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      if (roomId !== socket.id) socket.to(roomId).emit("call-ended");
    });
  });

  // ❌ CLEANUP USERS OBJECT
  socket.on("disconnect", () => {
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        console.log(`🧹 Cleaned up user mapping for: ${userId}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 SignBridge Socket Server running on port ${PORT}`);
});
