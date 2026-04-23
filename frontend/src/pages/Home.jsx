import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

const Home = () => {
  const navigate = useNavigate();

  // 👤 FETCH LOGGED-IN USER DATA
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.username; // Your customized username
  const fullName = user?.name;   // Your actual name
  const _profilePic = user?.profilePic; // For later use

  const [roomInput, setRoomInput] = useState("");
  const [targetId, setTargetId] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // 🔌 SOCKET SETUP
  useEffect(() => {
    // 1. Auth Guard: If no user is logged in, redirect to login
    if (!userId) {
      navigate("/login");
      return; // Stop execution if no user
    }

    // 2. Register user with socket if already connected
    if (socket.connected) {
      socket.emit("register-user", userId);
      //setIsRegistered(true);
    }

    // 3. Socket Event Listeners
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("register-user", userId);
    });

    socket.on("registered", () => {
      console.log("✅ Registered with username:", userId);
      setIsRegistered(true);
    });

    socket.on("incoming-call", ({ from, roomId }) => {
      console.log("📞 Incoming call from:", from);
      setIncomingCall({ from, roomId });
    });

    // 4. Cleanup on unmount
    return () => {
      socket.off("connect");
      socket.off("registered");
      socket.off("incoming-call");
    };
  }, [userId, navigate]); // The bracket was closed too early before!

  // 📞 CALL USER
  const callUser = () => {
    if (!isRegistered) {
      alert("⚠️ Connecting to server...");
      return;
    }
    if (!targetId.trim()) return;

    const roomId = [userId, targetId].sort().join("-");
    socket.emit("call-user", { targetId, from: userId, roomId });
    navigate(`/call/${roomId}`);
  };

  // ✅ ACCEPT CALL
  const acceptCall = () => {
    if (incomingCall) {
      navigate(`/call/${incomingCall.roomId}`);
      setIncomingCall(null);
    }
  };

  // ❌ LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Using navigate instead of reload for a smoother SPA experience
    navigate("/login"); 
  };

  return (
    <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "800px", margin: "0 auto" }}>
        <h1>🤟 Sign Bridge</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <p style={{ color: "#666" }}>Connecting voices through signs 💙</p>

      {/* 📞 INCOMING CALL OVERLAY */}
      {incomingCall && (
        <div style={styles.overlay}>
          <div style={styles.cardDark}>
            <h2>📞 Incoming Call</h2>
            <p>{incomingCall.from} is calling you...</p>
            <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
              <button style={styles.accept} onClick={acceptCall}>Accept</button>
              <button style={styles.reject} onClick={() => setIncomingCall(null)}>Reject</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.container}>
        {/* 👤 PROFILE CARD */}
        <div style={styles.mainCard}>
          <h3>Welcome, {fullName}!</h3>
          <p>Your ID: <span style={{ color: "#6366f1", fontWeight: "bold" }}>{userId}</span></p>
          <div style={styles.statusBadge}>
            {isRegistered ? "🟢 Online" : "⏳ Connecting..."}
          </div>
        </div>

        {/* 📞 START CALL */}
        <div style={styles.mainCard}>
          <h3>Start a Call</h3>
          <input
            style={styles.input}
            placeholder="Enter Friend's ID"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          />
          <button onClick={callUser} style={styles.callBtn}>Call 📞</button>
        </div>

        {/* 🔗 JOIN BY ROOM */}
        <div style={styles.mainCard}>
          <h3>Join via Room ID</h3>
          <input
            style={styles.input}
            placeholder="Room Name"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
          />
          <button onClick={() => roomInput && navigate(`/call/${roomInput}`)} style={styles.joinBtn}>Join 🔗</button>
        </div>
      </div>
    </div>
  );
};

// 🎨 STYLES
const styles = {
  container: { maxWidth: "800px", margin: "20px auto", display: "grid", gap: "20px" },
  mainCard: { background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
  input: { padding: "12px", width: "70%", borderRadius: "8px", border: "1px solid #ddd", marginRight: "10px", outline: "none" },
  statusBadge: { marginTop: "10px", fontSize: "14px", color: "#444" },
  callBtn: { background: "#6366f1", color: "white", border: "none", padding: "12px 25px", borderRadius: "8px", cursor: "pointer" },
  joinBtn: { background: "#10b981", color: "white", border: "none", padding: "12px 25px", borderRadius: "8px", cursor: "pointer" },
  logoutBtn: { background: "#ef4444", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" },
  overlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 },
  cardDark: { background: "#111", padding: "40px", borderRadius: "20px", textAlign: "center", color: "white" },
  accept: { background: "#22c55e", color: "white", border: "none", padding: "12px 30px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" },
  reject: { background: "#ef4444", color: "white", border: "none", padding: "12px 30px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" },
};

export default Home;