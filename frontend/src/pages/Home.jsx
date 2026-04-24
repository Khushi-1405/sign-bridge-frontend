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
  const [isRegistered, setIsRegistered] = useState(false);

  // 🕒 CALL HISTORY (Simulated - You can later save this to localStorage or DB)
  const callHistory = [
    { id: "Alfredo", name: "Alfredo Calzoni", img: "https://i.pravatar.cc/150?u=alfredo", time: "2 hours ago" },
    { id: "Clara", name: "Clara Hazel", img: "https://i.pravatar.cc/150?u=clara", time: "Yesterday" },
    { id: "Brandon", name: "Brandon Aminoff", img: "https://i.pravatar.cc/150?u=brandon", time: "April 20" },
    { id: "Amina", name: "Amina Mina", img: "https://i.pravatar.cc/150?u=amina", time: "April 18" },
  ];

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const register = () => {
      socket.emit("register-user", userId);
    };

    if (socket.connected) register();

    socket.on("connect", register);
    socket.on("me", () => setIsRegistered(true));
    socket.on("registered", () => setIsRegistered(true));
    socket.on("incoming-call", ({ from, roomId }) => setIncomingCall({ from, roomId }));
    socket.on("disconnect", () => setIsRegistered(false));

    return () => {
      socket.off("connect");
      socket.off("me");
      socket.off("registered");
      socket.off("incoming-call");
      socket.off("disconnect");
    };
  }, [userId, navigate]);

  const callUser = (id) => {
    const finalId = id || targetId;
    if (!isRegistered) return alert("Connecting to server...");
    if (!finalId.trim()) return;

    const roomId = [userId, finalId].sort().join("-");
    socket.emit("call-user", { targetId: finalId, from: userId, roomId });
    navigate(`/call/${roomId}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login"); 
  };

  return (
    <div style={s.pageWrapper}>
      <div style={s.mainDashboard}>
        
        {/* TOP BRANDING / HEADER */}
        <div style={s.glassHeader}>
          <div style={s.headerContent}>
            <div>
              <h1 style={s.logoText}>🤟 SignBridge</h1>
              <p style={s.welcomeText}>Welcome back, <span style={{color: '#ec4899'}}>{fullName}</span></p>
            </div>
            <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
          </div>
        </div>

        {/* CONTROLS SECTION (CALL & JOIN) */}
        <div style={s.actionGrid}>
          <div style={s.inputWrapper}>
            <label style={s.inputLabel}>Start Direct Call</label>
            <div style={s.row}>
              <input
                style={s.webInput}
                placeholder="Enter User ID..."
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              />
              <button onClick={() => callUser()} style={s.actionBtn}>Call 📞</button>
            </div>
          </div>

          <div style={s.inputWrapper}>
            <label style={s.inputLabel}>Join Private Room</label>
            <div style={s.row}>
              <input
                style={{ ...s.webInput, backgroundColor: '#fdf2f8' }}
                placeholder="Room Name..."
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
              />
              <button 
                onClick={() => roomInput && navigate(`/call/${roomInput}`)} 
                style={{ ...s.actionBtn, backgroundColor: '#10b981' }}
              >
                Join 🔗
              </button>
            </div>
          </div>
        </div>

        {/* CALL HISTORY SECTION */}
        <div style={s.historySection}>
          <h3 style={s.sectionTitle}>Call History</h3>
          <div style={s.historyList}>
            {callHistory.map((item) => (
              <div key={item.id} style={s.historyItem} onClick={() => callUser(item.id)}>
                <div style={s.itemLeft}>
                  <img src={item.img} style={s.avatar} alt="" />
                  <div>
                    <div style={s.nameText}>{item.name}</div>
                    <div style={s.subText}>Video Call • {item.time}</div>
                  </div>
                </div>
                <div style={s.callAgainIcon}>📞</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INCOMING CALL OVERLAY */}
      {incomingCall && (
        <div style={s.overlay}>
          <div style={s.callModal}>
            <div style={s.modalAvatar}>
               <img src={`https://i.pravatar.cc/150?u=${incomingCall.from}`} style={{width: '100%'}} alt=""/>
            </div>
            <h2 style={{margin: '20px 0'}}>Incoming Call</h2>
            <p style={{color: '#6b7280', marginBottom: '30px'}}>{incomingCall.from} is calling...</p>
            <div style={s.modalActions}>
              <button style={s.acceptBtn} onClick={() => navigate(`/call/${incomingCall.roomId}`)}>Accept</button>
              <button style={s.rejectBtn} onClick={() => setIncomingCall(null)}>Decline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  pageWrapper: { minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: '"Inter", sans-serif' },
  mainDashboard: { width: '100%', maxWidth: '900px', backgroundColor: 'white', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', padding: '40px', overflow: 'hidden' },
  
  glassHeader: { borderBottom: '1px solid #f1f5f9', paddingBottom: '30px', marginBottom: '40px' },
  headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoText: { fontSize: '28px', fontWeight: '900', color: '#421d4a', letterSpacing: '-1px' },
  welcomeText: { color: '#64748b', fontSize: '14px', marginTop: '5px' },
  logoutBtn: { backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },

  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '50px' },
  inputWrapper: { display: 'flex', flexDirection: 'column', gap: '10px' },
  inputLabel: { fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginLeft: '5px' },
  row: { display: 'flex', gap: '10px' },
  webInput: { flex: 1, backgroundColor: '#f1f5f9', border: 'none', padding: '15px 20px', borderRadius: '15px', outline: 'none', fontSize: '15px' },
  actionBtn: { backgroundColor: '#421d4a', color: 'white', border: 'none', padding: '0 25px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' },

  historySection: { textAlign: 'left' },
  sectionTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' },
  historyList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
  historyItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderRadius: '20px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s hover', backgroundColor: '#fff' },
  itemLeft: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatar: { width: '50px', height: '50px', borderRadius: '15px', objectFit: 'cover' },
  nameText: { fontWeight: 'bold', color: '#1e293b' },
  subText: { fontSize: '12px', color: '#94a3b8' },
  callAgainIcon: { color: '#ec4899', opacity: 0.5 },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  callModal: { backgroundColor: 'white', padding: '40px', borderRadius: '40px', width: '90%', maxWidth: '400px', textAlign: 'center' },
  modalAvatar: { width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto', border: '6px solid #f1f5f9' },
  modalActions: { display: 'flex', gap: '15px' },
  acceptBtn: { flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' },
  rejectBtn: { flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }
};

export default Home;