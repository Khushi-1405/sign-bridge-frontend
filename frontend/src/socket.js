import { io } from "socket.io-client";

// 🔥 This logic ensures it works both during development and after deployment
const SOCKET_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5000" 
  : "https://sign-bridge-backend.onrender.com"; 

const socket = io(SOCKET_URL, {
  transports: ["websocket"], // 🚀 Forces websocket for lower latency in sign detection
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
});

// ✅ Connection Listeners (Helpful for debugging during your demo)
socket.on("connect", () => {
  console.log("✅ Connected to SignBridge Server | ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket Connection Error:", err.message);
});

export default socket;