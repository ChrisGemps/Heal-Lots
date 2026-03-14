import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const raw = localStorage.getItem('user');
  const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Patient';
  const photo = localStorage.getItem('userPhoto') || null;

  const appointments = [
    { specialist: 'Manang Rosa', service: 'Traditional Hilot', date: 'Feb 8, 2026', time: '10:00 AM', status: 'Scheduled' },
    { specialist: 'Mang Berting', service: 'Herbal Compress',  date: 'Feb 9, 2026', time: '2:00 PM',  status: 'Scheduled' },
  ];

  const statusColors = {
    Scheduled:  { bg: '#fef3c7', color: '#b45309' },
    Completed:  { bg: '#dcfce7', color: '#15803d' },
    Cancelled:  { bg: '#fee2e2', color: '#dc2626' },
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .ud-wrap {
          min-height: 100vh;
          background: #fafaf8;
          font-family: 'DM Sans', sans-serif;
          color: #1c1408;
        }

        /* ── TOP BAR ── */
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

        .ud-avatar img { width:100%; height:100%; border-radius:50%; object-fit:cover; }
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

        /* ── MAIN ── */
        .ud-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 24px 60px;
        }

        /* ── GREETING ── */
        .ud-greeting {
          margin-bottom: 36px;
        }

        .ud-greeting-tag {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #d97706;
          margin-bottom: 8px;
        }

        .ud-greeting h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(26px, 3.5vw, 36px);
          font-weight: 800;
          color: #1c1408;
          margin-bottom: 6px;
          line-height: 1.15;
        }

        .ud-greeting h1 em {
          font-style: italic;
          color: #d97706;
        }

        .ud-greeting p {
          font-size: 15px;
          color: #78716c;
          font-weight: 300;
        }

        /* ── QUICK ACTIONS ── */
        .ud-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 36px;
        }

        .ud-action-card {
          background: #fff;
          border: 1.5px solid #f0e6d3;
          border-radius: 16px;
          padding: 24px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ud-action-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(217,119,6,0.12);
          border-color: #d97706;
        }

        .ud-action-icon {
          width: 48px; height: 48px;
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .ud-action-text h4 {
          font-size: 15px;
          font-weight: 600;
          color: #1c1408;
          margin-bottom: 3px;
        }

        .ud-action-text p {
          font-size: 13px;
          color: #78716c;
          font-weight: 400;
        }

        /* ── APPOINTMENTS ── */
        .ud-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .ud-section-header h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 700;
          color: #1c1408;
        }

        .ud-view-all {
          font-size: 13px;
          font-weight: 600;
          color: #d97706;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }

        .ud-view-all:hover { color: #b45309; }

        .ud-appt-card {
          background: #fff;
          border: 1.5px solid #f0e6d3;
          border-radius: 16px;
          overflow: hidden;
        }

        .ud-appt-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 24px;
          border-bottom: 1px solid #f5ede0;
          transition: background 0.15s;
        }

        .ud-appt-row:last-child { border-bottom: none; }
        .ud-appt-row:hover { background: #fffbf5; }

        .ud-appt-avatar {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .ud-appt-info { flex: 1; }

        .ud-appt-specialist {
          font-size: 15px;
          font-weight: 600;
          color: #1c1408;
          margin-bottom: 3px;
        }

        .ud-appt-meta {
          font-size: 13px;
          color: #78716c;
        }

        .ud-appt-status {
          font-size: 12px;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 100px;
        }

        .ud-empty {
          text-align: center;
          padding: 52px 24px;
          color: #a8956b;
        }

        .ud-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .ud-empty p { font-size: 15px; }

        @media (max-width: 768px) {
          .ud-actions { grid-template-columns: 1fr; }
          .ud-topbar { padding: 0 20px; }
          .ud-user-info { display: none; }
        }
      `}</style>

      <div className="ud-wrap">

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
              <div className="ud-avatar" onClick={() => navigate('/profile')} title="View Profile" style={{cursor:'pointer'}}>
                {photo ? <img src={photo} alt="Profile" /> : displayName.charAt(0).toUpperCase()}
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

        {/* MAIN */}
        <div className="ud-main">

          {/* GREETING */}
          <div className="ud-greeting">
            <div className="ud-greeting-tag"></div>
            <h1>👋🏻Welcome back, <em>{displayName.split(' ')[0]}</em> </h1>
            <p>Manage your hilot sessions and wellness appointments.</p>
          </div>

          {/* QUICK ACTIONS */}
          <div className="ud-actions">
            <div className="ud-action-card" onClick={() => navigate('/book')}>
              <div className="ud-action-icon" style={{ background: '#fef3c7' }}>📅</div>
              <div className="ud-action-text">
                <h4>Book a Session</h4>
                <p>Schedule a new hilot appointment</p>
              </div>
            </div>
            <div className="ud-action-card" onClick={() => navigate('/appointments')}>
              <div className="ud-action-icon" style={{ background: '#dcfce7' }}>📋</div>
              <div className="ud-action-text">
                <h4>My Appointments</h4>
                <p>View and manage your sessions</p>
              </div>
            </div>
            <div className="ud-action-card" onClick={() => { navigate('/'); setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 150); }}>
              <div className="ud-action-icon" style={{ background: '#ede9fe' }}>🌿</div>
              <div className="ud-action-text">
                <h4>Our Services</h4>
                <p>Browse all available treatments</p>
              </div>
            </div>
          </div>

          {/* UPCOMING APPOINTMENTS */}
          <div className="ud-section-header">
            <h2>Upcoming Sessions</h2>
            <button className="ud-view-all" onClick={() => navigate('/appointments')}>
              View all →
            </button>
          </div>

          <div className="ud-appt-card">
            {appointments.length === 0 ? (
              <div className="ud-empty">
                <div className="ud-empty-icon">🌿</div>
                <p>No upcoming sessions. Book your first hilot today!</p>
              </div>
            ) : (
              appointments.map((appt, idx) => (
                <div className="ud-appt-row" key={idx}>
                  <div className="ud-appt-avatar">🤲</div>
                  <div className="ud-appt-info">
                    <div className="ud-appt-specialist">{appt.specialist}</div>
                    <div className="ud-appt-meta">{appt.service} &nbsp;·&nbsp; {appt.date} &nbsp;·&nbsp; {appt.time}</div>
                  </div>
                  <div
                    className="ud-appt-status"
                    style={{
                      background: statusColors[appt.status]?.bg || '#f3f4f6',
                      color: statusColors[appt.status]?.color || '#374151',
                    }}
                  >
                    {appt.status}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
}