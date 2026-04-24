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
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-white font-sans overflow-x-hidden">
      
      {/* 1. RADAR SECTION (Responsive Container) */}
      <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center mt-10 md:mt-16 scale-90 md:scale-100">
        
        {/* Concentric Circles */}
        <div className="absolute w-[90%] h-[90%] border border-gray-100 rounded-full"></div>
        <div className="absolute w-[65%] h-[65%] border border-gray-100 rounded-full"></div>
        <div className="absolute w-[40%] h-[40%] bg-pink-50/50 rounded-full animate-pulse"></div>
        
        {/* Floating Avatars - Fixed Positions using % to stay responsive */}
        <div className="absolute top-[10%] left-[25%] w-14 h-14 rounded-full border-4 border-white shadow-xl overflow-hidden z-20">
          <img src="https://i.pravatar.cc/150?u=a" className="w-full h-full object-cover" alt="user" />
        </div>
        <div className="absolute top-[45%] left-[5%] w-12 h-12 rounded-full border-4 border-white shadow-xl overflow-hidden z-20">
          <img src="https://i.pravatar.cc/150?u=b" className="w-full h-full object-cover" alt="user" />
        </div>
        <div className="absolute bottom-[20%] left-[20%] w-10 h-10 rounded-full border-4 border-white shadow-xl overflow-hidden z-20">
          <img src="https://i.pravatar.cc/150?u=c" className="w-full h-full object-cover" alt="user" />
        </div>
        <div className="absolute top-[30%] right-[10%] w-14 h-14 rounded-full border-4 border-white shadow-xl overflow-hidden z-20">
          <img src="https://i.pravatar.cc/150?u=d" className="w-full h-full object-cover" alt="user" />
        </div>
        <div className="absolute bottom-[15%] right-[25%] w-12 h-12 rounded-full border-4 border-white shadow-xl overflow-hidden z-20">
          <img src="https://i.pravatar.cc/150?u=e" className="w-full h-full object-cover" alt="user" />
        </div>

        {/* Center Main Avatar */}
        <div className="relative w-24 h-24 rounded-full border-[6px] border-white shadow-2xl overflow-hidden z-30">
          <img src="https://i.pravatar.cc/150?u=main" className="w-full h-full object-cover" alt="main-user" />
        </div>

        {/* Small Pink Accent Dot */}
        <div className="absolute bottom-[35%] left-[30%] bg-pink-500 w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>
      </div>

      {/* 2. CONTENT SECTION */}
      <div className="w-full max-w-[400px] px-8 pb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-[1.1] tracking-tight">
          Let's meeting new<br/>people around you
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4 mt-8">
          <div className="space-y-3">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-3xl text-gray-800 outline-none focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-3xl text-gray-800 outline-none focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-[#3d1a45] text-white font-bold py-4 rounded-[35px] hover:bg-[#2a1230] transition-all shadow-lg active:scale-[0.98]"
          >
            <span className="text-xl">📱</span>
            Login with Account
          </button>

          <button 
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-[35px] hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" alt="G" className="w-5 h-5"/>
            Login with Google
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-10">
          Don't have an account? <span className="text-pink-500 cursor-pointer font-bold hover:underline" onClick={() => navigate("/register")}>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

export default Login;