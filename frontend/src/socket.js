import { io } from "socket.io-client";

// 🔥 Prioritize Environment Variable, then check for localhost, then use the live fallback
const SOCKET_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "sign-bridge-node-production.up.railway.app"); 

const socket = io(SOCKET_URL, {
  // 🚀 Added "polling" as a fallback. Render free tier sometimes blocks 
  // initial websocket upgrades, so polling ensures the connection starts.
  transports: ["websocket", "polling"], 
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10, // Increased for better stability on free tier
  withCredentials: true,    // Required for cross-origin cookie/session handling
});

// ✅ Connection Listeners
socket.on("connect", () => {
  console.log("✅ Connected to SignBridge Server | ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket Connection Error:", err.message);
  
  // If websocket fails, it will automatically try polling because of the transports array above
});

export default socket;