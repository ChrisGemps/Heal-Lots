import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function MyAppointments({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("upcoming");

  const raw = localStorage.getItem('user');
  const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Patient';
  const photo = localStorage.getItem('userPhoto') || null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (setIsLoggedIn) setIsLoggedIn(false);
    navigate('/', { replace: true });
  };

  const upcoming = [
    { specialist: 'Manang Rosa',    service: 'Traditional Hilot', date: 'Feb 10, 2026', time: '10:00 AM', reason: 'Body pain / muscle aches', status: 'Scheduled'  },
    { specialist: 'Mang Berting',   service: 'Herbal Compress',   date: 'Feb 14, 2026', time: '2:00 PM',  reason: 'Stress & fatigue relief',  status: 'Scheduled'  },
    { specialist: 'Ate Cora',       service: 'Head & Neck Relief', date: 'Feb 18, 2026', time: '11:00 AM', reason: 'Headache / migraine',       status: 'Scheduled'  },
  ];

  const past = [
    { specialist: 'Manang Lourdes', service: 'Foot Reflexology',  date: 'Jan 20, 2026', time: '9:00 AM',  reason: 'Regular wellness session',  status: 'Completed'  },
    { specialist: 'Mang Totoy',     service: 'Hot Oil Massage',   date: 'Jan 5, 2026',  time: '3:00 PM',  reason: 'Post-injury recovery',       status: 'Cancelled'  },
  ];

  const list = tab === "upcoming" ? upcoming : past;

  const statusStyle = {
    Scheduled: { bg: '#fef3c7', color: '#b45309',  dot: '#d97706' },
    Completed: { bg: '#dcfce7', color: '#15803d',  dot: '#22c55e' },
    Cancelled: { bg: '#fee2e2', color: '#dc2626',  dot: '#ef4444' },
  };

  const serviceEmoji = {
    'Traditional Hilot':  '🤲',
    'Herbal Compress':    '🌿',
    'Head & Neck Relief': '💆',
    'Foot Reflexology':   '🦶',
    'Hot Oil Massage':    '🛢️',
    'Whole-Body Hilot':   '🧘',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .ma-wrap {
          min-height: 100vh;
          background: #fafaf8;
          font-family: 'DM Sans', sans-serif;
          color: #1c1408;
        }

        /* ── TOPBAR ── */
        .ud-topbar {
          background: linear-gradient(135deg, #0f172a 0%, #1c1408 100%);
          border-bottom: 1px solid rgba(217,119,6,0.2);
          padding: 0 40px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
        }
        .ud-topbar-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .ud-topbar-logo  { height: 55px; width: auto; filter: brightness(0) invert(1) drop-shadow(0 0 5px rgba(217,119,6,0.5)); }
        .ud-topbar-right { display: flex; align-items: center; gap: 16px; }
        .ud-topbar-nav   { display: flex; align-items: center; gap: 4px; }
        .ud-topbar-nav a {
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          color: #a8956b; text-decoration: none; padding: 7px 14px;
          border-radius: 8px; transition: all 0.18s;
        }
        .ud-topbar-nav a:hover,
        .ud-topbar-nav a.active { color: #fbbf24; background: rgba(217,119,6,0.12); }
        .ud-user-badge { display: flex; align-items: center; gap: 10px; }
        .ud-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #d97706, #b45309);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: #fff;
          box-shadow: 0 2px 8px rgba(217,119,6,0.4); overflow: hidden;
        }
        .ud-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .ud-user-info  { line-height: 1.2; }
        .ud-user-name  { font-size: 14px; font-weight: 600; color: #e2c98a; }
        .ud-user-role  { font-size: 12px; color: #a8956b; }
        .ud-logout-btn {
          background: rgba(217,119,6,0.12); border: 1px solid rgba(217,119,6,0.3);
          color: #fbbf24; border-radius: 8px; padding: 7px 16px;
          font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.18s;
        }
        .ud-logout-btn:hover { background: rgba(217,119,6,0.22); border-color: rgba(217,119,6,0.5); }

        /* ── MAIN ── */
        .ma-main { max-width: 1000px; margin: 0 auto; padding: 36px 24px 64px; }

        /* ── PAGE HEADER ── */
        .ma-header { margin-bottom: 28px; }
        .ma-header-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .ma-back-btn {
          background: none; border: none; color: #d97706;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; padding: 0;
          display: flex; align-items: center; gap: 5px; transition: color 0.15s;
        }
        .ma-back-btn:hover { color: #b45309; }
        .ma-header h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 800; color: #1c1408;
          line-height: 1.15; margin-bottom: 4px;
        }
        .ma-header p { font-size: 14px; color: #78716c; font-weight: 300; }

        /* ── STAT PILLS ── */
        .ma-stats {
          display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px;
        }
        .ma-stat-pill {
          background: #fff; border: 1.5px solid #f0e6d3;
          border-radius: 100px; padding: 8px 18px;
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 500; color: #44291a;
        }
        .ma-stat-pill .dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .ma-stat-pill strong { font-weight: 700; color: #1c1408; }

        /* ── TABS ── */
        .ma-tabs {
          display: flex; gap: 0;
          background: #fff; border: 1.5px solid #f0e6d3;
          border-radius: 12px; padding: 4px;
          width: fit-content; margin-bottom: 24px;
        }
        .ma-tab {
          padding: 9px 24px; border-radius: 9px;
          border: none; background: transparent;
          font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          color: #a8956b; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 7px;
        }
        .ma-tab.active {
          background: linear-gradient(135deg, #0f172a, #1c1408);
          color: #fbbf24;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        }
        .ma-tab-count {
          font-size: 11px; font-weight: 700;
          background: rgba(217,119,6,0.15);
          color: #d97706; border-radius: 100px;
          padding: 1px 7px; min-width: 20px;
          text-align: center;
        }
        .ma-tab.active .ma-tab-count {
          background: rgba(251,191,36,0.2); color: #fbbf24;
        }

        /* ── APPOINTMENT CARD ── */
        .ma-card {
          background: #fff;
          border: 1.5px solid #f0e6d3;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 14px;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .ma-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(217,119,6,0.1);
          border-color: rgba(217,119,6,0.3);
        }
        .ma-card-accent {
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 4px; border-radius: 18px 0 0 18px;
        }

        .ma-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 16px;
        }
        .ma-card-left { display: flex; align-items: center; gap: 14px; }

        .ma-service-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: #fef3c7;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; flex-shrink: 0;
        }

        .ma-service-name {
          font-family: 'Fraunces', serif;
          font-size: 17px; font-weight: 700;
          color: #1c1408; margin-bottom: 3px;
        }
        .ma-specialist {
          font-size: 13px; color: #78716c; margin-bottom: 5px;
        }
        .ma-datetime {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: #a8956b; font-weight: 500;
        }
        .ma-datetime span { color: #d97706; }

        .ma-status-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700;
          padding: 5px 13px; border-radius: 100px;
          white-space: nowrap; flex-shrink: 0;
        }
        .ma-status-badge .sdot {
          width: 6px; height: 6px; border-radius: 50%;
        }

        /* ── REASON ROW ── */
        .ma-reason {
          background: #fafaf8; border: 1px solid #f0e6d3;
          border-radius: 10px; padding: 11px 16px;
          font-size: 13px; color: #78716c;
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .ma-reason strong { color: #44291a; }

        /* ── ACTION BUTTONS ── */
        .ma-actions { display: flex; gap: 8px; }
        .ma-btn {
          flex: 1; padding: 10px 12px; border-radius: 10px;
          font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          transition: all 0.18s; text-align: center;
        }
        .ma-btn-light {
          border: 1.5px solid #e8ddd0; background: #fff; color: #44291a;
        }
        .ma-btn-light:hover { border-color: #d97706; color: #d97706; background: #fffbf5; }
        .ma-btn-red {
          border: 1.5px solid #fecaca; background: #fff; color: #dc2626;
        }
        .ma-btn-red:hover { background: #fef2f2; border-color: #ef4444; }
        .ma-btn-dark {
          background: linear-gradient(135deg, #0f172a, #1c1408);
          border: none; color: #fbbf24;
        }
        .ma-btn-dark:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.2); transform: translateY(-1px); }

        /* ── EMPTY STATE ── */
        .ma-empty {
          text-align: center; padding: 64px 24px;
          background: #fff; border: 1.5px solid #f0e6d3;
          border-radius: 18px;
        }
        .ma-empty-icon { font-size: 48px; margin-bottom: 16px; }
        .ma-empty h3 {
          font-family: 'Fraunces', serif; font-size: 20px;
          color: #1c1408; margin-bottom: 8px;
        }
        .ma-empty p { font-size: 14px; color: #a8956b; margin-bottom: 24px; font-weight: 300; }
        .ma-empty-btn {
          background: linear-gradient(135deg, #d97706, #b45309);
          color: #fff; border: none; border-radius: 10px;
          padding: 11px 28px; font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          box-shadow: 0 4px 14px rgba(217,119,6,0.35); transition: all 0.2s;
        }
        .ma-empty-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(217,119,6,0.45); }

        @media (max-width: 768px) {
          .ud-topbar { padding: 0 20px; }
          .ud-user-info { display: none; }
          .ud-topbar-nav a { padding: 7px 10px; font-size: 13px; }
          .ma-card-top { flex-direction: column; }
          .ma-actions { flex-wrap: wrap; }
        }
      `}</style>

      <div className="ma-wrap">

        {/* TOP BAR */}
        <div className="ud-topbar">
          <div className="ud-topbar-brand" onClick={() => navigate('/dashboard')}>
            <img src="/logo.png" alt="Heal Lots" className="ud-topbar-logo" />
          </div>
          <div className="ud-topbar-right">
            <nav className="ud-topbar-nav">
              <Link to="/dashboard"    className={location.pathname === '/dashboard'    ? 'active' : ''}>Dashboard</Link>
              <Link to="/book"         className={location.pathname === '/book'         ? 'active' : ''}>Book Session</Link>
              <Link to="/appointments" className={location.pathname === '/appointments' ? 'active' : ''}>My Appointments</Link>
            </nav>
            <div className="ud-user-badge">
              <div className="ud-avatar" onClick={() => navigate('/profile')} title="View Profile" style={{ cursor: 'pointer' }}>
                {photo ? <img src={photo} alt="Profile" /> : displayName.charAt(0).toUpperCase()}
              </div>
              <div className="ud-user-info">
                <div className="ud-user-name">{displayName}</div>
                <div className="ud-user-role">Patient</div>
              </div>
            </div>
            <button className="ud-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        {/* MAIN */}
        <div className="ma-main">

          {/* PAGE HEADER */}
          <div className="ma-header">
            <div className="ma-header-top">
              <button className="ma-back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
            </div>
            <h1>My Appointments</h1>
            <p>Track and manage all your hilot sessions</p>
          </div>

          {/* STATS */}
          <div className="ma-stats">
            <div className="ma-stat-pill">
              <span className="dot" style={{ background: '#d97706' }} />
              <strong>{upcoming.length}</strong> Upcoming
            </div>
            <div className="ma-stat-pill">
              <span className="dot" style={{ background: '#22c55e' }} />
              <strong>{past.filter(a => a.status === 'Completed').length}</strong> Completed
            </div>
            <div className="ma-stat-pill">
              <span className="dot" style={{ background: '#ef4444' }} />
              <strong>{past.filter(a => a.status === 'Cancelled').length}</strong> Cancelled
            </div>
          </div>

          {/* TABS */}
          <div className="ma-tabs">
            <button className={`ma-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
              Upcoming <span className="ma-tab-count">{upcoming.length}</span>
            </button>
            <button className={`ma-tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
              Past <span className="ma-tab-count">{past.length}</span>
            </button>
          </div>

          {/* CARDS */}
          {list.length === 0 ? (
            <div className="ma-empty">
              <div className="ma-empty-icon">🌿</div>
              <h3>No {tab} appointments</h3>
              <p>{tab === 'upcoming' ? 'Book your first hilot session today.' : 'Your completed sessions will appear here.'}</p>
              {tab === 'upcoming' && (
                <button className="ma-empty-btn" onClick={() => navigate('/book')}>Book a Session</button>
              )}
            </div>
          ) : (
            list.map((a, i) => {
              const st = statusStyle[a.status] || statusStyle.Scheduled;
              return (
                <div key={i} className="ma-card">
                  <div className="ma-card-accent" style={{ background: st.dot }} />

                  <div className="ma-card-top">
                    <div className="ma-card-left">
                      <div className="ma-service-icon">
                        {serviceEmoji[a.service] || '🤲'}
                      </div>
                      <div>
                        <div className="ma-service-name">{a.service}</div>
                        <div className="ma-specialist">with {a.specialist}</div>
                        <div className="ma-datetime">
                          📅 {a.date} <span>·</span> 🕐 {a.time}
                        </div>
                      </div>
                    </div>
                    <div
                      className="ma-status-badge"
                      style={{ background: st.bg, color: st.color }}
                    >
                      <span className="sdot" style={{ background: st.dot }} />
                      {a.status}
                    </div>
                  </div>

                  <div className="ma-reason">
                    📝 <strong>Reason:</strong>&nbsp;{a.reason}
                  </div>

                  <div className="ma-actions">
                    {tab === 'upcoming' ? (
                      <>
                        <button className="ma-btn ma-btn-light">🔄 Reschedule</button>
                        <button className="ma-btn ma-btn-red">✕ Cancel</button>
                        <button className="ma-btn ma-btn-dark">View Details →</button>
                      </>
                    ) : (
                      <>
                        <button className="ma-btn ma-btn-light">📄 View Summary</button>
                        <button className="ma-btn ma-btn-dark" onClick={() => navigate('/book')}>Book Follow-up →</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

        </div>
      </div>
    </>
  );
}