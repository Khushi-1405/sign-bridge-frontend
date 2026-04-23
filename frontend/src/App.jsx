import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Call from "./pages/Call";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <Router>
      <Routes>
        {/* If logged in, go to Home. If not, go to Login */}
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Only allow Call if logged in */}
        <Route path="/call/:roomId" element={user ? <Call /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;