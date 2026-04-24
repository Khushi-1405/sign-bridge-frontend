import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Use environment variable for the API URL, falling back to localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://sign-bridge-frontend-am22.onrender.com";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ✅ PRE-CHECK: If user is already logged in, send them home
  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      navigate("/"); // Or "/home" depending on your main route
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault(); // Handle both form submit and button click
    
    try {
      // ✅ Updated Axios call with dynamic URL and withCredentials
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/login`, 
        { email, password },
        { withCredentials: true } 
      );

      console.log("Login Success:", res.data);

      // ✅ Robust data handling
      const userData = res.data.user || res.data;
      const token = res.data.token;

      // ✅ SET LOCAL STORAGE (The "Brain" of the login)
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Using username or email as the display ID
      localStorage.setItem("userId", userData.username || userData.email);

      alert("Welcome back!");
      
      // ✅ TRIGGER REDIRECT
      navigate("/"); // This moves you from the login page to the home page
      
    } catch (err) {
      console.error("Login Error:", err);
      const errorMsg = err.response?.data?.message || err.response?.data || "Invalid email or password";
      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020603] p-4 font-sans selection:bg-[#8be452]/30">
      {/* Background Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8be452]/5 blur-[120px] rounded-full"></div>
      
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl z-10">
        
        {/* LEFT PANEL */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[40px] flex flex-col justify-center shadow-2xl">
          <h1 className="text-white text-7xl font-bold mb-4 tracking-tight">Hello!</h1>
          <p className="text-gray-400 text-lg mb-10 max-w-xs leading-relaxed">
            Sign in to stay connected with signs 🤟
          </p>
          
          <div className="flex flex-col gap-4">
            {/* ✅ Added onClick here so this button also triggers login */}
            <button 
              onClick={handleLogin}
              className="bg-[#8be452] text-[#05140b] font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(139,228,82,0.4)] hover:scale-[1.02] transition-transform"
            >
              SIGN IN
            </button>
            <button 
              type="button"
              onClick={() => navigate("/register")}
              className="border border-white/20 text-white font-bold py-4 rounded-2xl hover:bg-white/5 transition-colors"
            >
              SIGN UP
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
          <form onSubmit={handleLogin} className="flex flex-col h-full justify-center">
            
            <div className="space-y-4 mb-6">
              <input 
                type="email" 
                placeholder="example@mail.com" 
                className="w-full bg-[#0a0f0a]/50 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#8be452]/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              
              <div className="relative group">
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-[#0a0f0a]/50 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#8be452]/50 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="bg-[#8be452] text-[#05140b] font-bold py-4 rounded-2xl shadow-[0_0_25px_rgba(139,228,82,0.5)] hover:brightness-110 transition-all">
              SIGN IN
            </button>

            <button type="button" className="text-gray-500 text-sm mt-4 hover:text-white transition-colors">
              Forgot password?
            </button>

            <div className="mt-10">
              <button type="button" className="w-full flex items-center justify-center gap-3 border border-white/10 py-4 rounded-3xl text-white font-medium hover:bg-white/5 transition-all group">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" alt="G" className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                SIGN IN WITH GOOGLE
              </button>
            </div>

            <p className="text-gray-500 text-sm mt-8 text-center">
              Don't have an account? <span className="text-white cursor-pointer font-bold hover:underline" onClick={() => navigate("/register")}>Sign up</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;