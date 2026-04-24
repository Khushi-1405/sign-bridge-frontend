import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://sign-bridge-frontend-am22.onrender.com";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) navigate("/");
  }, [navigate]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, 
        { email, password }, { withCredentials: true } 
      );
      const userData = res.data.user || res.data;
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userId", userData.username || userData.email);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div style={s.screen}>
      {/* RADAR SECTION */}
      <div style={s.radarContainer}>
        {/* Rings */}
        <div style={{...s.ring, width: '100%', height: '100%'}}></div>
        <div style={{...s.ring, width: '70%', height: '70%'}}></div>
        <div style={s.pulseCircle}></div>

        {/* Floating Avatars */}
        <img src="https://i.pravatar.cc/150?u=1" style={{...s.avatar, top: '5%', left: '20%', width: '50px', height: '50px'}} alt="" />
        <img src="https://i.pravatar.cc/150?u=2" style={{...s.avatar, top: '40%', left: '-20px', width: '55px', height: '55px'}} alt="" />
        <img src="https://i.pravatar.cc/150?u=4" style={{...s.avatar, top: '15%', right: '5%', width: '55px', height: '55px'}} alt="" />
        <img src="https://i.pravatar.cc/150?u=5" style={{...s.avatar, bottom: '15%', right: '15%', width: '50px', height: '50px'}} alt="" />

        {/* Center Profile */}
        <div style={s.centerProfile}>
          <img src="https://i.pravatar.cc/150?u=main" style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="Me" />
        </div>
        
        {/* Pink Dot */}
        <div style={s.pinkDot}></div>
      </div>

      {/* FORM SECTION */}
      <div style={s.formWrapper}>
        <h1 style={s.title}>Let's meeting new<br />people around you</h1>

        <form onSubmit={handleLogin} style={s.form}>
          <input 
            type="email" 
            placeholder="Email Address" 
            style={s.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            style={s.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />

          <button type="submit" style={s.primaryBtn}>
            <span style={{fontSize: '20px'}}>📱</span> Login with Account
          </button>

          <button type="button" style={s.secondaryBtn}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" style={{width: '20px'}} alt=""/>
            Login with Google
          </button>
        </form>

        <p style={s.footerText}>
          Don't have an account? <span style={s.link} onClick={() => navigate("/register")}>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

// INLINE STYLES - Guaranteed to work even if Tailwind fails
const s = {
  screen: { minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', fontFamily: 'sans-serif', padding: '20px', overflow: 'hidden' },
  radarContainer: { position: 'relative', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' },
  ring: { position: 'absolute', borderRadius: '50%', border: '1px solid #f3f4f6' },
  pulseCircle: { position: 'absolute', width: '40%', height: '40%', backgroundColor: '#fdf2f8', borderRadius: '50%' },
  avatar: { position: 'absolute', borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', objectFit: 'cover', zIndex: 10 },
  centerProfile: { position: 'relative', width: '90px', height: '90px', borderRadius: '50%', border: '6px solid #fff', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 20 },
  pinkDot: { position: 'absolute', bottom: '30%', right: '30%', width: '15px', height: '15px', backgroundColor: '#ec4899', borderRadius: '50%', border: '2px solid #fff', zIndex: 30 },
  formWrapper: { width: '100%', maxWidth: '380px', textAlign: 'center' },
  title: { fontSize: '28px', fontWeight: '900', color: '#111827', marginBottom: '30px', lineHeight: '1.2' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { width: '100%', backgroundColor: '#f9fafb', border: 'none', padding: '16px 24px', borderRadius: '50px', outline: 'none', fontSize: '16px' },
  primaryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#421d4a', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '50px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px rgba(66, 29, 74, 0.2)' },
  secondaryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#fff', color: '#4b5563', fontWeight: 'bold', padding: '16px', borderRadius: '50px', border: '1px solid #f3f4f6', cursor: 'pointer' },
  footerText: { marginTop: '30px', color: '#9ca3af', fontSize: '14px' },
  link: { color: '#ec4899', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }
};

export default Login;