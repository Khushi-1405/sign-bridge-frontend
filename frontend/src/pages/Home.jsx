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

  // Example "Recent" list
  const recentCalls = [
    { id: "Alfredo", name: "Alfredo Calzoni", img: "https://i.pravatar.cc/150?u=alfredo" },
    { id: "Clara", name: "Clara Hazel", img: "https://i.pravatar.cc/150?u=clara" },
    { id: "Brandon", name: "Brandon Aminoff", img: "https://i.pravatar.cc/150?u=brandon" },
    { id: "Amina", name: "Amina Mina", img: "https://i.pravatar.cc/150?u=amina" },
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
    <div style={s.page}>
      {/* PURPLE TOP SECTION */}
      <div style={s.topPanel}>
        <div style={s.header}>
          <div style={s.backBtn}>👋 Hi, {fullName?.split(' ')[0]}</div>
          <h1 style={s.pageTitle}>Messages</h1>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>

        <div style={s.recentSection}>
          <p style={s.sectionLabel}>Recent Matches</p>
          <div style={s.recentRow}>
             {recentCalls.map((item) => (
               <div key={item.id} style={s.recentAvatarWrapper} onClick={() => callUser(item.id)}>
                 <img src={item.img} style={s.recentAvatar} alt={item.name} />
                 <div style={s.activeDot}></div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* WHITE BOTTOM LIST SECTION */}
      <div style={s.listPanel}>
        <div style={s.handleBar}></div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
          {/* 1. CALL BY USER ID */}
          <div style={s.inputContainer}>
            <input
              style={s.searchBar}
              placeholder="Enter User ID to Call..."
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
            <button onClick={() => callUser()} style={s.fabCall}>📞</button>
          </div>

          {/* 2. JOIN BY ROOM NAME (Uses roomInput) */}
          <div style={s.inputContainer}>
            <input
              style={{ ...s.searchBar, backgroundColor: '#f3f4f6' }}
              placeholder="Join Meeting Room Name..."
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
            />
            <button 
              onClick={() => roomInput && navigate(`/call/${roomInput}`)} 
              style={{ ...s.fabCall, backgroundColor: '#10b981' }}
            >
              🔗
            </button>
          </div>
        </div>

        {/* CALL LIST */}
        <div style={s.callList}>
          {recentCalls.map((item) => (
            <div key={item.id} style={s.callItem} onClick={() => callUser(item.id)}>
              <img src={item.img} style={s.itemAvatar} alt="" />
              <div style={s.itemInfo}>
                <div style={s.itemName}>{item.name}</div>
                <div style={s.itemSub}>Online • Click to call</div>
              </div>
              <div style={s.statusText}>Active</div>
            </div>
          ))}
        </div>
      </div>

      {/* INCOMING CALL MODAL */}
      {incomingCall && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalAvatar}>
              <img src={`https://i.pravatar.cc/150?u=${incomingCall.from}`} style={{width:'100%'}} alt=""/>
            </div>
            <h2 style={{marginTop:'20px', color: '#111827'}}>Incoming Call</h2>
            <p style={{color:'#6b7280', marginBottom: '30px'}}>{incomingCall.from} is calling...</p>
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
  page: { height: '100vh', width: '100%', backgroundColor: '#421d4a', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' },
  topPanel: { padding: '40px 25px 30px 25px', color: 'white' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  backBtn: { fontSize: '14px', opacity: 0.8 },
  pageTitle: { fontSize: '24px', fontWeight: 'bold' },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px' },
  
  recentSection: { marginTop: '10px' },
  sectionLabel: { fontSize: '13px', marginBottom: '15px', opacity: 0.9 },
  recentRow: { display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' },
  recentAvatarWrapper: { position: 'relative', flexShrink: 0, cursor: 'pointer' },
  recentAvatar: { width: '65px', height: '65px', borderRadius: '18px', border: '2px solid rgba(255,255,255,0.2)', objectFit: 'cover' },
  activeDot: { position: 'absolute', top: '-2px', right: '-2px', width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%', border: '2px solid #421d4a' },

  listPanel: { flex: 1, backgroundColor: 'white', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', padding: '25px 20px', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 20px rgba(0,0,0,0.1)' },
  handleBar: { width: '40px', height: '5px', backgroundColor: '#e5e7eb', borderRadius: '10px', alignSelf: 'center', marginBottom: '25px' },
  
  inputContainer: { display: 'flex', gap: '10px' },
  searchBar: { flex: 1, backgroundColor: '#f9fafb', border: 'none', padding: '15px 20px', borderRadius: '20px', outline: 'none', fontSize: '14px' },
  fabCall: { backgroundColor: '#421d4a', border: 'none', color: 'white', width: '50px', height: '50px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  callList: { flex: 1, overflowY: 'auto' },
  callItem: { display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' },
  itemAvatar: { width: '55px', height: '55px', borderRadius: '15px', marginRight: '15px', objectFit: 'cover' },
  itemInfo: { flex: 1 },
  itemName: { fontWeight: 'bold', color: '#111827', marginBottom: '4px' },
  itemSub: { fontSize: '13px', color: '#9ca3af' },
  statusText: { fontSize: '11px', color: '#ec4899', fontWeight: 'bold' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { backgroundColor: 'white', width: '100%', maxWidth: '320px', borderRadius: '40px', padding: '40px 25px', textAlign: 'center' },
  modalAvatar: { width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto', border: '5px solid #f3f4f6' },
  modalActions: { display: 'flex', gap: '12px' },
  acceptBtn: { flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  rejectBtn: { flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }
};

export default Home;