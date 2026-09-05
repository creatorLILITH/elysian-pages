import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home";
import Reader from "./pages/Reader";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Library from "./pages/Library";
import MyLibrary from "./pages/MyLibrary";
import Profile from "./pages/Profile";
import AuthRedirect from "./components/AuthRedirect";
import AdminRoute from "./components/AdminRoute";

function App() {
  const [darkMode] = useState(false);

  const appStyle = {
    backgroundColor: darkMode ? "#121212" : "#f5f5f5",
    color: darkMode ? "white" : "black",
    minHeight: "100vh",
    transition: "0.3s ease",
  };

  return (
    <div style={appStyle}>
      <Router>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/home" element={<Home />} />
          <Route path="/reader" element={<Reader />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<AdminRoute>
            <AdminDashboard />
            </AdminRoute>}/>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/mylibrary" element={<MyLibrary />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;