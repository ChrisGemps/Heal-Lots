import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

import Navbar from "./components/Navbar";

// Public pages
import Home         from "./pages/public/Home";
import Login        from "./pages/public/Login";
import Register     from "./pages/public/Register";

// User-only pages
import UserDashboard    from "./pages/user/UserDashboard";
import BookAppointment  from "./pages/user/BookAppointment";
import MyAppointments   from "./pages/user/MyAppointments";

// Admin-only pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Profile        from "./pages/user/Profile";

// ── Protected route wrappers ──────────────────────────────────────────────────

function RequireAuth({ isLoggedIn, children }) {
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ isLoggedIn, isAdmin, children }) {
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin)    return <Navigate to="/"      replace />;
  return children;
}

// ── Layout ────────────────────────────────────────────────────────────────────
function Layout({ isLoggedIn, isAdmin, children }) {
  const location = useLocation();
  const hideNavbarOn = ['/dashboard', '/admin', '/book', '/appointments','login', '/register', '/profile'];
  const showNavbar = !hideNavbarOn.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} />}
      {children}
    </>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  // Initialize from localStorage so back-navigation and refresh stay protected
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
      return user?.role === 'ADMIN';
    } catch { return false; }
  });

  return (
    <Router>
      <Layout isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
        <Routes>

          {/* Public */}
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={<Login    setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />} />
          <Route path="/register" element={<Register />} />

          {/* User-only */}
          <Route path="/dashboard" element={
            <RequireAuth isLoggedIn={isLoggedIn}>
              <UserDashboard setIsLoggedIn={setIsLoggedIn} />
            </RequireAuth>
          } />
          <Route path="/book" element={
            <RequireAuth isLoggedIn={isLoggedIn}>
              <BookAppointment setIsLoggedIn={setIsLoggedIn} />
            </RequireAuth>
          } />
          <Route path="/appointments" element={
            <RequireAuth isLoggedIn={isLoggedIn}>
              <MyAppointments setIsLoggedIn={setIsLoggedIn} />
            </RequireAuth>
          } />

          <Route path="/profile" element={
            <RequireAuth isLoggedIn={isLoggedIn}>
              <Profile setIsLoggedIn={setIsLoggedIn} />
            </RequireAuth>
          } />

          {/* Admin-only */}
          <Route path="/admin" element={
            <RequireAdmin isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
              <AdminDashboard />
            </RequireAdmin>
          } />

        </Routes>
      </Layout>
    </Router>
  );
}

export default App;