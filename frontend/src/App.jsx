import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Call from "./pages/Call";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  // ✅ This helper function ensures we get the latest status from localStorage
  const isAuthenticated = () => {
    return localStorage.getItem("user") !== null;
  };

  return (
    <Router>
      <Routes>
        {/* 🏠 Main Route: Redirects based on Auth status */}
        <Route 
          path="/" 
          element={isAuthenticated() ? <Home /> : <Navigate to="/login" />} 
        />

        {/* 📝 Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🎥 Protected Call Route */}
        <Route 
          path="/call/:roomId" 
          element={isAuthenticated() ? <Call /> : <Navigate to="/login" />} 
        />

        {/* 🚀 Home Fallback (Optional: in case you navigate to /home specifically) */}
        <Route 
          path="/home" 
          element={isAuthenticated() ? <Home /> : <Navigate to="/login" />} 
        />

        {/* 404 Catch-all: Send them back to root */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;