import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";


export default function MyAppointments({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("upcoming");

  const raw = localStorage.getItem('user');
const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
const displayName =
  user?.fullName || user?.name || user?.email?.split('@')[0] || 'Patient';

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (setIsLoggedIn) setIsLoggedIn(false);
  navigate('/', { replace: true });
};

  const upcoming = [
    {
      doctor: "Dr. Sarah Johnson",
      service: "General Practitioner",
      date: "Feb 10, 2026",
      time: "10:00 AM",
      reason: "Annual Checkup",
      status: "Confirmed",
    },
  ];

  const past = [
    {
      doctor: "Dr. David Martinez",
      service: "General Practitioner",
      date: "Jan 20, 2026",
      time: "9:00 AM",
      reason: "Flu Symptoms",
      status: "Completed",
    },
  ];

  const list = tab === "upcoming" ? upcoming : past;

  return (
    <>
      <style>{`

      .appt-wrap{
        min-height:100vh;
        background:#fafaf8;
        font-family:'DM Sans',sans-serif;
      }

      /* ── TOPBAR (from UserDashboard) ── */
      .ud-topbar {
        background: linear-gradient(135deg, #0f172a 0%, #1c1408 100%);
        border-bottom: 1px solid rgba(217,119,6,0.2);
        padding: 0 40px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 50;
      }

      .ud-topbar-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
      }

      .ud-topbar-logo {
        height: 55px;
        width: auto;
        filter: brightness(0) invert(1) drop-shadow(0 0 5px rgba(217,119,6,0.5));
      }

      .ud-topbar-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .ud-user-badge {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ud-avatar {
        width: 36px; height: 36px;
        background: linear-gradient(135deg, #d97706, #b45309);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 15px;
        font-weight: 700;
        color: #fff;
        box-shadow: 0 2px 8px rgba(217,119,6,0.4);
      }

      .ud-user-info { line-height: 1.2; }

      .ud-user-name {
        font-size: 14px;
        font-weight: 600;
        color: #e2c98a;
      }

      .ud-user-role {
        font-size: 12px;
        color: #a8956b;
      }

      .ud-topbar-nav {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .ud-topbar-nav a {
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #a8956b;
        text-decoration: none;
        padding: 7px 14px;
        border-radius: 8px;
        transition: all 0.18s;
      }

      .ud-topbar-nav a:hover,
      .ud-topbar-nav a.active {
        color: #fbbf24;
        background: rgba(217,119,6,0.12);
      }

      .ud-logout-btn {
        background: rgba(217,119,6,0.12);
        border: 1px solid rgba(217,119,6,0.3);
        color: #fbbf24;
        border-radius: 8px;
        padding: 7px 16px;
        font-size: 13px;
        font-weight: 600;
        font-family: 'DM Sans', sans-serif;
        cursor: pointer;
        transition: all 0.18s;
      }

      .ud-logout-btn:hover {
        background: rgba(217,119,6,0.22);
        border-color: rgba(217,119,6,0.5);
      }

      .appt-body{
        max-width:950px;
        margin:auto;
        padding:30px 24px;
      }

      .back-btn{
        background:none;
        border:none;
        color:#d97706;
        font-weight:600;
        cursor:pointer;
        margin-bottom:20px;
      }

      .tabs{
        display:flex;
        gap:12px;
        margin-bottom:20px;
      }

      .tab{
        padding:10px 18px;
        border-radius:10px;
        border:1px solid #d1d5db;
        background:#fff;
        cursor:pointer;
        font-weight:600;
      }

      .tab.active{
        background:#1f2937;
        color:#fff;
        border:none;
      }

      .card{
        background:#fff;
        border:1px solid #e5e7eb;
        border-radius:14px;
        padding:22px;
        margin-bottom:18px;
      }

      .card-head{
        display:flex;
        justify-content:space-between;
        margin-bottom:14px;
      }

      .doctor{
        font-weight:700;
        font-size:16px;
      }

      .status{
        font-size:19px;
        padding:4px 10px;
        border-radius:6px;
      }

      .confirmed{background:#dcfce7;color:#15803d;}
      .completed{background:green;}

      .reason{
        background:#f9fafb;
        padding:12px;
        border-radius:8px;
        margin:14px 0;
        font-size:14px;
      }

      .actions{
        display:flex;
        gap:10px;
      }

      .btn{
        flex:1;
        padding:10px;
        border-radius:8px;
        font-weight:600;
        cursor:pointer;
      }

      .btn.dark{
        background:#1f2937;
        color:#fff;
        border:none;
      }

      .btn.red{
        border:1px solid #ef4444;
        color:#ef4444;
        background:#fff;
      }

      .btn.light{
        border:1px solid #d1d5db;
        background:#fff;
      }

      `}</style>

      <div className="appt-wrap">

        {/* TOP BAR */}
<div className="ud-topbar">
  <div className="ud-topbar-brand" onClick={() => navigate('/dashboard')}>
    <img src="/logo.png" alt="Heal Lots" className="ud-topbar-logo" />
  </div>

  <div className="ud-topbar-right">
    <nav className="ud-topbar-nav">
      <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
      <Link to="/book"         className={location.pathname === '/book'         ? 'active' : ''}>Book Session</Link>
      <Link to="/appointments" className={location.pathname === '/appointments' ? 'active' : ''}>My Appointments</Link>
    </nav>
    <div className="ud-user-badge">
      <div className="ud-avatar">
        {displayName.charAt(0).toUpperCase()}
      </div>

      <div className="ud-user-info">
        <div className="ud-user-name">{displayName}</div>
        <div className="ud-user-role">Patient</div>
      </div>
    </div>

    <button className="ud-logout-btn" onClick={handleLogout}>
      Sign Out
    </button>
  </div>
</div>
        

        <div className="appt-body">

          {/* BACK BUTTON */}
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>

          {/* TABS */}
          <div className="tabs">
            <button
              className={`tab ${tab === "upcoming" ? "active" : ""}`}
              onClick={() => setTab("upcoming")}
            >
              Upcoming (3)
            </button>

            <button
              className={`tab ${tab === "past" ? "active" : ""}`}
              onClick={() => setTab("past")}
            >
              Past (2)
            </button>
          </div>

          {/* CARDS */}
          {list.map((a, i) => (
            <div key={i} className="card">

              <div className="card-head">
                <div>
                  <div className="doctor">{a.doctor}</div>
                  <div style={{fontSize:"13px",color:"#6b7280"}}>
                    {a.service} · {a.date} · {a.time}
                  </div>
                </div>

                <span className={`status ${a.status==="Confirmed"?"confirmed":"completed"}`}>
                  {a.status}
                </span>
              </div>

              <div className="reason">
                <strong>Reason for Visit</strong><br/>
                {a.reason}
              </div>

              <div className="actions">
                {tab==="upcoming" ? (
                  <>
                    <button className="btn light">Reschedule</button>
                    <button className="btn red">Cancel</button>
                    <button className="btn dark">View Details</button>
                  </>
                ) : (
                  <>
                    <button className="btn light">View Summary</button>
                    <button className="btn dark">Book Follow-up</button>
                  </>
                )}
              </div>

            </div>
          ))}

        </div>
      </div>
    </>
  );
}