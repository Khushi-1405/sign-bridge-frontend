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

  // 🕒 CALL HISTORY
  const callHistory = [
    { id: "Priyanshu", name: "Priyanshu S.", img: "https://i.pravatar.cc/150?u=alfredo", time: "2 hours ago" },
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
      {/* BACKGROUND IMAGE OVERLAY */}
      <div style={s.bgOverlay}></div>
      
      <div style={s.mainDashboard}>
        
        {/* HEADER SECTION */}
        <div style={s.glassHeader}>
          <div style={s.headerContent}>
            <div>
              <h1 style={s.logoText}>🤟 SignBridge</h1>
              <p style={s.welcomeText}>Welcome back, <span style={s.userNameHighlight}>{fullName}</span></p>
            </div>
            <button onClick={handleLogout} style={s.logoutBtn}>
              Logout <span style={{marginLeft: '5px'}}>⏻</span>
            </button>
          </div>
        </div>

        {/* ACTIONS SECTION */}
        <div style={s.actionGrid}>
          <div style={s.glassCard}>
            <label style={s.inputLabel}>Start Direct Call</label>
            <div style={s.row}>
              <input
                style={s.webInput}
                placeholder="Enter User ID..."
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              />
              <button onClick={() => callUser()} style={s.callBtn}>Call 📞</button>
            </div>
          </div>

          <div style={s.glassCard}>
            <label style={s.inputLabel}>Join Private Room</label>
            <div style={s.row}>
              <input
                style={s.webInput}
                placeholder="Room Name..."
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
              />
              <button 
                onClick={() => roomInput && navigate(`/call/${roomInput}`)} 
                style={s.joinBtn}
              >
                Join 🔗
              </button>
            </div>
          </div>
        </div>

        {/* HISTORY SECTION */}
        <div style={s.historySection}>
          <h3 style={s.sectionTitle}>Recent Connections</h3>
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
            <h2 style={{margin: '20px 0', color: '#1e293b'}}>Incoming Call</h2>
            <p style={{color: '#64748b', marginBottom: '30px'}}>{incomingCall.from} is inviting you to connect.</p>
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
  pageWrapper: { 
    minHeight: '100vh', 
    width: '100%', 
    backgroundImage: 'url("https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=2070")', // Professional Bridge Background
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: '20px', 
    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
    position: 'relative'
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Darker tint to make the white glass pop
    backdropFilter: 'blur(3px)',
    zIndex: 1
  },
  mainDashboard: { 
    width: '100%', 
    maxWidth: '950px', 
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Glass effect
    backdropFilter: 'blur(15px)',
    borderRadius: '32px', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
    padding: '40px', 
    zIndex: 2,
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  
  glassHeader: { borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '25px', marginBottom: '40px' },
  headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoText: { fontSize: '32px', fontWeight: '800', color: '#1e293b', letterSpacing: '-1.5px', margin: 0 },
  welcomeText: { color: '#475569', fontSize: '15px', marginTop: '4px' },
  userNameHighlight: { color: '#7c3aed', fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 22px', borderRadius: '14px', fontWeight: '600', cursor: 'pointer', transition: '0.3s' },

  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '45px' },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  inputLabel: { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' },
  row: { display: 'flex', gap: '12px' },
  webInput: { flex: 1, backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '14px 18px', borderRadius: '14px', outline: 'none', fontSize: '15px', transition: '0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' },
  callBtn: { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', border: 'none', padding: '0 25px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)' },
  joinBtn: { background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white', border: 'none', padding: '0 25px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' },

  historySection: { textAlign: 'left' },
  sectionTitle: { fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' },
  historyList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' },
  historyItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '20px', backgroundColor: 'white', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  itemLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatar: { width: '52px', height: '52px', borderRadius: '16px', objectFit: 'cover' },
  nameText: { fontWeight: '700', color: '#1e293b', fontSize: '16px' },
  subText: { fontSize: '13px', color: '#64748b', marginTop: '2px' },
  callAgainIcon: { color: '#7c3aed', backgroundColor: '#f5f3ff', padding: '10px', borderRadius: '12px', fontSize: '14px' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  callModal: { backgroundColor: 'white', padding: '45px', borderRadius: '40px', width: '90%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
  modalAvatar: { width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto', border: '5px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  modalActions: { display: 'flex', gap: '16px' },
  acceptBtn: { flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '18px', borderRadius: '18px', fontWeight: '700', cursor: 'pointer', fontSize: '16px' },
  rejectBtn: { flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '18px', borderRadius: '18px', fontWeight: '700', cursor: 'pointer', fontSize: '16px' }
};

export default Home;