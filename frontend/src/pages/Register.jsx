import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://sign-bridge-frontend-am22.onrender.com";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "", name: "", email: "", password: "", dob: ""
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/register`, 
        formData,
        { withCredentials: true }
      );
      
      const token = res.data.token;
      const userData = res.data.user || res.data;

      if (token && userData.username) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userId", userData.username);
        alert("Registration Successful! Welcome to Sign Bridge.");
        navigate("/"); 
      } else {
        alert("Account created successfully! Please sign in.");
        navigate("/login");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div style={s.screen}>
      {/* RADAR SECTION (Visual Consistency) */}
      <div style={s.radarContainer}>
        <div style={{...s.ring, width: '100%', height: '100%'}}></div>
        <div style={{...s.ring, width: '70%', height: '70%'}}></div>
        <div style={s.pulseCircle}></div>

        {/* Dynamic Avatars */}
        <img src="https://i.pravatar.cc/150?u=9" style={{...s.avatar, top: '5%', left: '20%', width: '45px', height: '45px'}} alt="" />
        <img src="https://i.pravatar.cc/150?u=12" style={{...s.avatar, bottom: '20%', right: '10%', width: '55px', height: '55px'}} alt="" />
        <img src="https://i.pravatar.cc/150?u=8" style={{...s.avatar, top: '35%', right: '-10px', width: '40px', height: '40px'}} alt="" />

        <div style={s.centerProfile}>
          <img src="https://i.pravatar.cc/150?u=newuser" style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="New User" />
        </div>
        <div style={{...s.pinkDot, backgroundColor: '#8be452'}}></div> {/* Green dot for "New" */}
      </div>

      {/* REGISTRATION FORM SECTION */}
      <div style={s.formWrapper}>
        <h1 style={s.title}>Create your account<br />to start connecting</h1>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.inputGroup}>
            <input 
              type="text" 
              placeholder="Username" 
              style={s.input}
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              required 
            />
            <input 
              type="text" 
              placeholder="Full Name" 
              style={s.input}
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              required 
            />
            <input 
              type="email" 
              placeholder="Email Address" 
              style={s.input}
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
            />
            <div style={s.dateContainer}>
                <label style={s.dateLabel}>Date of Birth</label>
                <input 
                    type="date" 
                    style={s.inputDate}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})} 
                    required 
                />
            </div>
            <input 
              type="password" 
              placeholder="Password" 
              style={s.input}
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          <button type="submit" style={s.primaryBtn}>
            <span style={{fontSize: '20px'}}>✨</span> CREATE ACCOUNT
          </button>
        </form>

        <p style={s.footerText}>
          Already have an account? <span style={s.link} onClick={() => navigate("/login")}>Sign In</span>
        </p>
      </div>
    </div>
  );
};

// CONSISTENT INLINE STYLES
const s = {
  screen: { minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', fontFamily: 'sans-serif', padding: '40px 20px', overflowX: 'hidden' },
  radarContainer: { position: 'relative', width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' },
  ring: { position: 'absolute', borderRadius: '50%', border: '1px solid #f3f4f6' },
  pulseCircle: { position: 'absolute', width: '40%', height: '40%', backgroundColor: '#f5f3ff', borderRadius: '50%' },
  avatar: { position: 'absolute', borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', objectFit: 'cover', zIndex: 10 },
  centerProfile: { position: 'relative', width: '80px', height: '80px', borderRadius: '50%', border: '6px solid #fff', boxShadow: '0 20px 25px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 20 },
  pinkDot: { position: 'absolute', bottom: '30%', right: '30%', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #fff', zIndex: 30 },
  formWrapper: { width: '100%', maxWidth: '380px', textAlign: 'center' },
  title: { fontSize: '26px', fontWeight: '900', color: '#111827', marginBottom: '25px', lineHeight: '1.2' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { width: '100%', backgroundColor: '#f9fafb', border: 'none', padding: '14px 20px', borderRadius: '50px', outline: 'none', fontSize: '15px', color: '#374151' },
  dateContainer: { textAlign: 'left', padding: '0 20px' },
  dateLabel: { fontSize: '11px', color: '#9ca3af', marginBottom: '4px', display: 'block' },
  inputDate: { width: '100%', backgroundColor: '#f9fafb', border: 'none', padding: '10px 0', outline: 'none', fontSize: '14px', color: '#374151' },
  primaryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#421d4a', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '50px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px rgba(66, 29, 74, 0.2)', marginTop: '10px' },
  footerText: { marginTop: '25px', color: '#9ca3af', fontSize: '14px' },
  link: { color: '#ec4899', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }
};

export default Register;