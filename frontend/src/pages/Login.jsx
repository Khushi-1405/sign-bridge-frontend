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
    <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans p-6">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        
        {/* TOP SECTION: CIRCULAR RADAR DESIGN */}
        <div className="relative w-full aspect-square flex items-center justify-center mb-8">
          {/* Concentric Circles */}
          <div className="absolute w-[100%] h-[100%] border border-gray-100 rounded-full"></div>
          <div className="absolute w-[75%] h-[75%] border border-gray-100 rounded-full"></div>
          <div className="absolute w-[50%] h-[50%] bg-pink-50 rounded-full animate-pulse"></div>
          
          {/* Avatar Points (Simulating "People around you") */}
          <div className="absolute top-10 left-20 w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=1" alt="user" />
          </div>
          <div className="absolute bottom-20 left-4 w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=2" alt="user" />
          </div>
          <div className="absolute top-1/2 right-4 w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=3" alt="user" />
          </div>
          
          {/* Center Avatar */}
          <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-2xl overflow-hidden z-10">
            <img src="https://i.pravatar.cc/150?u=me" alt="me" />
          </div>
          
          {/* Floating Icons */}
          <div className="absolute bottom-10 right-20 bg-pink-500 p-2 rounded-full shadow-lg">
             <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>

        {/* TEXT SECTION */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
            Let's meeting new<br/>people around you
          </h1>
        </div>

        {/* FORM SECTION */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
          {/* Hidden inputs but kept for state logic, or replace with the sleek buttons in image */}
          <div className="space-y-3">
             <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full bg-gray-50 border-none p-4 rounded-3xl text-gray-700 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full bg-gray-50 border-none p-4 rounded-3xl text-gray-700 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
          </div>

          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-[#421d4a] text-white font-bold py-4 rounded-[32px] hover:bg-[#2d1432] transition-all shadow-lg"
          >
            <span className="bg-white/20 p-1 rounded-full">📞</span>
            Login with Account
          </button>

          <button 
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-100 text-gray-700 font-bold py-4 rounded-[32px] hover:bg-gray-50 transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" alt="G" className="w-5 h-5"/>
            Login with Google
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-gray-400 text-sm mt-8">
          Don't have an account? <span className="text-pink-500 cursor-pointer font-bold hover:underline" onClick={() => navigate("/register")}>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

export default Login;