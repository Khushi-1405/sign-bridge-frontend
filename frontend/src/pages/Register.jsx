import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Use environment variable for the API URL, falling back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "", name: "", email: "", password: "", dob: ""
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Send registration request with withCredentials for CORS support
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/register`, 
        formData,
        { withCredentials: true }
      );
      
      console.log("Registration Success:", res.data);

      // 2. ✅ AUTO-LOGIN LOGIC
      // Check if backend sends token and user data (handling both flat and nested structures)
      const token = res.data.token;
      const userData = res.data.user || res.data;

      if (token && userData.username) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userId", userData.username); // Required for Socket.io registration

        alert("Registration Successful! Welcome to Sign Bridge.");
        navigate("/"); // Move straight to Home
      } else {
        // Fallback if backend doesn't perform auto-login on register
        alert("Account created successfully! Please sign in.");
        navigate("/login");
      }
    } catch (err) {
      console.error("Registration Error:", err);
      alert(err.response?.data?.message || err.response?.data || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020603] p-4 font-sans">
      {/* Background Ambient Glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#8be452]/5 blur-[120px] rounded-full"></div>
      
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl z-10">
        
        {/* LEFT PANEL: Branding/Nav */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[40px] flex flex-col justify-center shadow-2xl order-2 md:order-1">
          <h1 className="text-white text-6xl font-bold mb-4 tracking-tight">Join Us!</h1>
          <p className="text-gray-400 text-lg mb-10 max-w-xs leading-relaxed">
            Create your Sign Bridge account and start connecting through signs 🤟
          </p>
          
          <div className="flex flex-col gap-4">
             <button 
              type="button"
              onClick={() => navigate("/login")}
              className="border border-white/20 text-white font-bold py-4 rounded-2xl hover:bg-white/5 transition-colors"
            >
              SIGN IN
            </button>
            <button type="button" className="bg-[#8be452] text-[#05140b] font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(139,228,82,0.4)] hover:scale-[1.02] transition-transform">
              SIGN UP
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Registration Form */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] shadow-2xl order-1 md:order-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-white text-2xl font-semibold mb-2">Create Account</h2>
            
            <input 
              type="text" 
              placeholder="Username" 
              className="w-full bg-[#0a0f0a]/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#8be452]/50 transition-all"
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              required 
            />
            
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full bg-[#0a0f0a]/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#8be452]/50 transition-all"
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              required 
            />

            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-[#0a0f0a]/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#8be452]/50 transition-all"
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
            />

            <div className="flex flex-col gap-1">
              <label className="text-gray-500 text-xs ml-2">Date of Birth</label>
              <input 
                type="date" 
                className="w-full bg-[#0a0f0a]/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#8be452]/50 transition-all color-scheme-dark"
                onChange={(e) => setFormData({...formData, dob: e.target.value})} 
                required 
              />
            </div>

            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-[#0a0f0a]/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#8be452]/50 transition-all"
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
            />

            <button type="submit" className="bg-[#8be452] text-[#05140b] font-bold py-4 rounded-2xl shadow-[0_0_25px_rgba(139,228,82,0.5)] hover:brightness-110 transition-all mt-4">
              CREATE ACCOUNT
            </button>

            <p className="text-gray-500 text-sm mt-4 text-center">
              Already have an account? <span className="text-white cursor-pointer font-bold hover:underline" onClick={() => navigate("/login")}>Sign in</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;