import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import VideoCall from "../components/VideoCall";

const Call = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [incomingSign, setIncomingSign] = useState("");
  const [history, setHistory] = useState([]); // 🔥 To show conversation flow
  const [callConnected, setCallConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // 🎧 Listen for signs from the remote user
    socket.on("receive-sign", (data) => {
      if (data && data !== "No Sign") {
        setIncomingSign(data);
        
        // Add to history list (limited to last 5 for UI cleanliness)
        setHistory((prev) => [data, ...prev].slice(0, 5));

        // Clear current bubble after 4 seconds
        setTimeout(() => setIncomingSign(""), 4000);
      }
    });

    socket.on("call-started", () => setCallConnected(true));
    socket.emit("join-room", roomId);

    // ⏱️ Simple call timer
    const timer = setInterval(() => {
      if (callConnected) setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      socket.off("receive-sign");
      socket.off("call-started");
      clearInterval(timer);
    };
  }, [roomId, callConnected]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div style={styles.page}>
      {/* 🚀 Header: Modern and Professional */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoCircle}>🤟</div>
          <div>
            <h2 style={styles.logoText}>SignBridge <span style={{ color: "#6366f1" }}>PRO</span></h2>
            <p style={styles.statusText}>{callConnected ? `🟢 Live • ${formatTime(callDuration)}` : "📡 Connecting..."}</p>
          </div>
        </div>
        <div style={styles.roomBadge}>Room ID: {roomId}</div>
      </header>

      <main style={styles.main}>
        <div style={styles.contentLayout}>
          
          {/* 📹 LEFT: The Video Interaction (Your ML Canvas is inside here) */}
          <div style={styles.videoSection}>
             <VideoCall roomId={roomId} />
          </div>

          {/* 🗨️ RIGHT: The Translation Intelligence Sidebar */}
          <div style={styles.sidebar}>
            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Live Translation</h4>
              <div style={styles.activeSubtitle}>
                {incomingSign ? (
                  <span style={styles.glowText}>{incomingSign}</span>
                ) : (
                  <span style={{ opacity: 0.4, fontSize: "16px" }}>Watching for gestures...</span>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Conversation History</h4>
              <div style={styles.historyList}>
                {history.length > 0 ? history.map((h, i) => (
                  <div key={i} style={{...styles.historyItem, opacity: 1 - (i * 0.2)}}>
                    {h}
                  </div>
                )) : <p style={styles.emptyText}>No signs detected yet.</p>}
              </div>
            </div>

            <button style={styles.endBtn} onClick={() => navigate("/")}>
              End Session 📞
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#0b0f1a", color: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  header: { padding: "15px 40px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a" },
  brand: { display: "flex", alignItems: "center", gap: "15px" },
  logoCircle: { width: "40px", height: "40px", background: "#6366f1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  logoText: { margin: 0, fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px" },
  statusText: { margin: 0, fontSize: "12px", opacity: 0.6, fontWeight: "500" },
  roomBadge: { padding: "6px 12px", background: "#1e293b", borderRadius: "8px", fontSize: "12px", border: "1px solid #334155" },
  main: { padding: "30px", maxWidth: "1200px", margin: "0 auto" },
  contentLayout: { display: "grid", gridTemplateColumns: "1fr 350px", gap: "30px" },
  videoSection: { background: "#111827", padding: "20px", borderRadius: "24px", border: "1px solid #1e293b", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
  sidebar: { display: "flex", flexDirection: "column", gap: "20px" },
  card: { background: "#161b2c", padding: "20px", borderRadius: "20px", border: "1px solid #1e293b" },
  cardTitle: { margin: "0 0 15px 0", fontSize: "14px", color: "#6366f1", textTransform: "uppercase", letterSpacing: "1px" },
  activeSubtitle: { minHeight: "80px", background: "#0b0f1a", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "bold", border: "1px solid #334155" },
  glowText: { color: "#fff", textShadow: "0 0 10px rgba(99, 102, 241, 0.8)" },
  historyList: { display: "flex", flexDirection: "column", gap: "10px" },
  historyItem: { padding: "10px 15px", background: "#1e293b", borderRadius: "10px", fontSize: "14px", borderLeft: "4px solid #6366f1" },
  emptyText: { fontSize: "12px", opacity: 0.4, textAlign: "center" },
  endBtn: { marginTop: "auto", background: "#ef4444", color: "white", padding: "15px", borderRadius: "15px", border: "none", cursor: "pointer", fontWeight: "bold", transition: "0.3s" }
};

export default Call;