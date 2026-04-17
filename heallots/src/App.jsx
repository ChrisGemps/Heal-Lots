import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

import Navbar from "./components/Navbar";

// Public pages
import Home         from "./features/public/pages/Home";
import Login        from "./features/authentication/pages/Login";
import Register     from "./features/authentication/pages/Register";

// User-only pages
import UserDashboard    from "./features/user-profile/pages/UserDashboard";
import BookAppointment  from "./features/appointments/pages/BookAppointment";
import MyAppointments   from "./features/appointments/pages/MyAppointments";
import Profile          from "./features/user-profile/pages/Profile";

// Admin-only pages
import AdminDashboard from "./features/admin-dashboard/pages/AdminDashboard";

// ── Protected route wrappers ──────────────────────────────────────────────────

function RequireAuth({ isLoggedIn, children }) {
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

function RequireAdmin({ isLoggedIn, isAdmin, children }) {
  if (!isLoggedIn) return <Navigate to="/"  replace />;
  if (!isAdmin)    return <Navigate to="/"  replace />;
  return children;
}

function PublicOnly({ isLoggedIn, isAdmin, children }) {
  if (isLoggedIn) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }
  return children;
}

// ── Layout ────────────────────────────────────────────────────────────────────
function Layout({ isLoggedIn, isAdmin, children }) {
  const location = useLocation();
  const hideNavbarOn = ['/dashboard', '/admin', '/book', '/appointments', '/login', '/register', '/profile'];
  const onHome = location.pathname === '/';
  const showNavbar = !hideNavbarOn.includes(location.pathname) && !(onHome && isLoggedIn);

  return (
    <>  
      {showNavbar && <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} />}
      {children}
    </>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
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

          {/* Public — Home receives isLoggedIn to switch topbars */}
          <Route path="/"         element={<Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/login"    element={
            <PublicOnly isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
              <Login setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
            </PublicOnly>
          } />
          <Route path="/register" element={
            <PublicOnly isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
              <Register />
            </PublicOnly>
          } />

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
              <AdminDashboard setIsLoggedIn={setIsLoggedIn} />
            </RequireAdmin>
          } />

        </Routes>
      </Layout>
    </Router>
  );
}

export default App;