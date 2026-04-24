import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

const Home = () => {
  const navigate = useNavigate();

  // 👤 FETCH LOGGED-IN USER DATA
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.username; 
  const fullName = user?.name;   

  const [roomInput, setRoomInput] = useState("");
  const [targetId, setTargetId] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  // ✅ FIXED: Changed 'sellsRegistered' to 'setIsRegistered' to match your usage
  const [isRegistered, setIsRegistered] = useState(false);

  // 🔌 SOCKET SETUP
  useEffect(() => {
    // 1. Auth Guard
    if (!userId) {
      navigate("/login");
      return;
    }

    // Function to handle registration logic
    const register = () => {
      socket.emit("register-user", userId);
      // We don't set isRegistered to true here; 
      // we wait for the 'registered' or 'me' event from server
    };

    // 2. Immediate Check
    if (socket.connected) {
      register();
    }

    // 3. Socket Event Listeners
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      register();
    });

    socket.on("me", (id) => {
      console.log("🤝 Handshake received:", id);
      setIsRegistered(true);
    });

    socket.on("registered", () => {
      console.log("✅ Registered with username:", userId);
      setIsRegistered(true);
    });

    socket.on("incoming-call", ({ from, roomId }) => {
      console.log("📞 Incoming call from:", from);
      setIncomingCall({ from, roomId });
    });

    socket.on("disconnect", () => {
      setIsRegistered(false);
    });

    // 4. Cleanup
    return () => {
      socket.off("connect");
      socket.off("me");
      socket.off("registered");
      socket.off("incoming-call");
      socket.off("disconnect");
    };
  }, [userId, navigate]);

  // 📞 CALL USER
  const callUser = () => {
    if (!isRegistered) {
      alert("⏳ Connecting to server... please wait a moment.");
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
    localStorage.clear();
    navigate("/login"); 
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.logo}>🤟 Sign Bridge</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <p style={styles.subtext}>Connecting voices through signs 💙</p>

      {/* 📞 INCOMING CALL OVERLAY */}
      {incomingCall && (
        <div style={styles.overlay}>
          <div style={styles.cardDark}>
            <h2 style={{fontSize: '2rem'}}>📞 Incoming Call</h2>
            <p style={{margin: '15px 0'}}>{incomingCall.from} is calling you...</p>
            <div style={{ display: "flex", gap: "20px", marginTop: "20px", justifyContent: 'center' }}>
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
          <div style={{...styles.statusBadge, color: isRegistered ? '#22c55e' : '#f59e0b'}}>
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
  page: { textAlign: "center", padding: "40px", backgroundColor: "#f0f2f5", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "800px", margin: "0 auto" },
  logo: { fontSize: '2.5rem', color: '#1a1a1a' },
  subtext: { color: "#666", marginTop: '10px' },
  container: { maxWidth: "800px", margin: "30px auto", display: "grid", gap: "20px" },
  mainCard: { background: "white", padding: "30px", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
  input: { padding: "12px", width: "65%", borderRadius: "10px", border: "1px solid #ddd", marginRight: "10px", outline: "none" },
  statusBadge: { marginTop: "15px", fontSize: "14px", fontWeight: '600' },
  callBtn: { background: "#6366f1", color: "white", border: "none", padding: "12px 25px", borderRadius: "10px", cursor: "pointer", fontWeight: 'bold' },
  joinBtn: { background: "#10b981", color: "white", border: "none", padding: "12px 25px", borderRadius: "10px", cursor: "pointer", fontWeight: 'bold' },
  logoutBtn: { background: "#ef4444", color: "white", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: 'bold' },
  overlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 },
  cardDark: { background: "#1f2937", padding: "50px", borderRadius: "30px", textAlign: "center", color: "white" },
  accept: { background: "#22c55e", color: "white", border: "none", padding: "12px 30px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold" },
  reject: { background: "#ef4444", color: "white", border: "none", padding: "12px 30px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold" },
};

export default Home;