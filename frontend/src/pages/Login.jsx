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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white font-sans overflow-hidden">
      
      {/* --- RADAR VISUAL SECTION --- */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center mb-8">
        
        {/* Concentric Circles using Tailwind Rings/Borders */}
        <div className="absolute inset-0 border border-gray-100 rounded-full"></div>
        <div className="absolute inset-[15%] border border-gray-100 rounded-full"></div>
        <div className="absolute inset-[30%] bg-pink-50/60 rounded-full animate-pulse"></div>
        
        {/* Floating Avatars with Fixed Tailwind Positions */}
        <div className="absolute top-[5%] left-[20%] w-12 h-12 rounded-full border-4 border-white shadow-xl overflow-hidden z-20">
          <img src="https://i.pravatar.cc/150?u=1" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="absolute top-[40%] -left-4 w-14 h-14 rounded-full border-4 border-white shadow-xl overflow-hidden z-20">
          <img src="https://i.pravatar.cc/150?u=2" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="absolute bottom-[10%] left-[15%] w-10 h-10 rounded-full border-4 border-white shadow-xl overflow-hidden z-20">
          <img src="https://i.pravatar.cc/150?u=3" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="absolute top-[20%] right-[5%] w-14 h-14 rounded-full border-4 border-white shadow-xl overflow-hidden z-20">
          <img src="https://i.pravatar.cc/150?u=4" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="absolute bottom-[20%] right-[10%] w-12 h-12 rounded-full border-4 border-white shadow-xl overflow-hidden z-20">
          <img src="https://i.pravatar.cc/150?u=5" className="w-full h-full object-cover" alt="" />
        </div>

        {/* Center Main Profile */}
        <div className="relative w-24 h-24 rounded-full border-[6px] border-white shadow-2xl overflow-hidden z-30">
          <img src="https://i.pravatar.cc/150?u=khushi" className="w-full h-full object-cover" alt="Me" />
        </div>

        {/* Decorative Notification Dot */}
        <div className="absolute bottom-[30%] right-[30%] w-4 h-4 bg-pink-500 rounded-full border-2 border-white shadow-md z-40"></div>
      </div>

      {/* --- FORM SECTION --- */}
      <div className="w-full max-w-sm px-6 text-center">
        <h1 className="text-3xl font-black text-gray-900 leading-tight mb-8">
          Let's meeting new<br />people around you
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-gray-50 border-none px-6 py-4 rounded-full text-gray-800 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-gray-50 border-none px-6 py-4 rounded-full text-gray-800 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="w-full flex items-center justify-center gap-3 bg-[#421d4a] text-white font-bold py-4 rounded-full shadow-lg hover:bg-[#2d1432] active:scale-95 transition-all"
          >
            <span className="text-lg">📱</span>
            Login with Account
          </button>

          <button 
            type="button" 
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-100 text-gray-600 font-bold py-4 rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" alt="G" className="w-5 h-5"/>
            Login with Google
          </button>
        </form>

        <p className="mt-8 text-sm text-gray-400">
          Don't have an account? <span className="text-pink-500 font-bold cursor-pointer hover:underline" onClick={() => navigate("/register")}>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

export default Login;