import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";

// Calendar constants
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MORNING_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'];
const AFTERNOON_SLOTS = ['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const LUNCH_BREAK = '12:00 PM';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function MyAppointments({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [reschedulingDay, setReschedulingDay] = useState(null);
  const [reschedulingTime, setReschedulingTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const raw = localStorage.getItem('user');
  const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Patient';
  const photo = user?.profilePictureUrl || localStorage.getItem(user?.email ? `userPhoto_${user.email}` : 'userPhoto') || null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (setIsLoggedIn) setIsLoggedIn(false);
    navigate('/', { replace: true });
    window.location.reload();
  };

  // Returns true if appointment is at least 24 hours away
  const canModifyAppointment = (dateString, timeString) => {
    try {
      // ── Parse time ───────────────────────────────────────────────────
      const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
      const timeMatch = timeString?.match(timeRegex);
      let hour = 9, minute = 0;
      if (timeMatch) {
        hour   = parseInt(timeMatch[1]);
        minute = parseInt(timeMatch[2]);
        const meridiem = timeMatch[3].toUpperCase();
        if (meridiem === 'PM' && hour !== 12) hour += 12;
        if (meridiem === 'AM' && hour === 12)  hour  = 0;
      }

      // ── Parse date ───────────────────────────────────────────────────
      let year, month, day;

      if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        // ISO: 2026-03-20  or  2026-03-20T...
        const parts = dateString.split('T')[0].split('-');
        year  = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1; // 0-indexed
        day   = parseInt(parts[2]);
      } else {
        // Human-readable: "March 20, 2026"  or  "Mar 20, 2026"
        const MONTHS = {
          january:0,february:1,march:2,april:3,may:4,june:5,
          july:6,august:7,september:8,october:9,november:10,december:11,
          jan:0,feb:1,mar:2,apr:3,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11
        };
        // e.g. "March 20, 2026" -> ["March", "20,", "2026"]
        const tokens = dateString.replace(',', '').trim().split(/\s+/);
        month = MONTHS[tokens[0]?.toLowerCase()];
        day   = parseInt(tokens[1]);
        year  = parseInt(tokens[2]);
        if (month === undefined || isNaN(day) || isNaN(year)) return true; // fail open
      }

      // Build appointment Date object using LOCAL time (no UTC shift)
      const appointmentDate = new Date(year, month, day, hour, minute, 0, 0);
      const now = new Date();
      const hoursLeft = (appointmentDate - now) / (1000 * 60 * 60);

      return hoursLeft >= 24;
    } catch (e) {
      console.error('canModifyAppointment error:', e);
      return true; // fail open — allow modification if parsing fails
    }
  };

  const openModal = (appt) => {
    setSelectedAppt(appt);
    setModalOpen(true);
    setRescheduleMode(false);
    setShowConfirmCancel(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAppt(null);
    setRescheduleMode(false);
    setShowConfirmCancel(false);
    setReschedulingDay(null);
    setReschedulingTime('');
    setRescheduleReason('');
    setCancelReason('');
    setCalYear(new Date().getFullYear());
    setCalMonth(new Date().getMonth());
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppt || !selectedAppt.id || !cancelReason.trim()) return;

    const appointmentId = selectedAppt.id;

    // Update UI immediately
    setAppointments(prev => 
      prev.map(a => a.id === appointmentId ? { ...a, status: 'Canceled by Patient', cancellationReason: cancelReason } : a)
    );
    closeModal();
    alert('Appointment cancelled successfully');

    // Update backend asynchronously
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/appointments/${appointmentId}/status`,
        { status: 'Canceled by Patient', cancellationReason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Failed to update appointment on server');
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedAppt || !selectedAppt.id || reschedulingDay === null || !reschedulingTime || !rescheduleReason.trim()) return;

    const appointmentId = selectedAppt.id;
    const reschedulingDate = `${MONTH_NAMES[calMonth]} ${reschedulingDay}, ${calYear}`;

    // Update UI immediately
    setAppointments(prev =>
      prev.map(a => a.id === appointmentId 
        ? { ...a, date: reschedulingDate, time: reschedulingTime, status: 'Rescheduled by Patient', rescheduleReason: rescheduleReason } 
        : a
      )
    );
    closeModal();
    alert('                      Appointment Rescheduled Successfully.\n                     Please Wait For the Approval of the Clinic');

    // Update backend asynchronously
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/appointments/${appointmentId}`,
        { 
          appointmentDate: reschedulingDate,
          timeSlot: reschedulingTime,
          rescheduleReason: rescheduleReason,
          status: 'Rescheduled by Patient'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      alert('Failed to update appointment on server');
    }
  };

  // Fetch appointments from backend
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/appointments/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Transform backend data to match UI format
        const transformedAppointments = response.data.map(appt => ({
          id: appt.id,
          specialist: appt.specialistName,
          service: appt.serviceName,
          date: appt.appointmentDate,
          time: appt.timeSlot,
          reason: appt.reason || 'N/A',
          status: appt.status || 'Pending',
          notes: appt.notes || '',
          rescheduleReason: appt.rescheduleReason || '',
          cancellationReason: appt.cancellationReason || '',
        }));
        
        // Sort appointments by date (closest upcoming date first)
        transformedAppointments.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA - dateB;
        });
        
        setAppointments(transformedAppointments);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        // Keep empty array if fetch fails
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, []);

  // Helper function to parse date string and determine if it's upcoming or past
  const isUpcoming = (dateString) => {
    try {
      const appointmentDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return appointmentDate >= today;
    } catch (e) {
      return true; // Default to upcoming if parsing fails
    }
  };

  const upcoming = appointments.filter(a => a.status !== 'Cancelled' && isUpcoming(a.date));
  const past = appointments.filter(a => a.status !== 'Cancelled' && !isUpcoming(a.date));
  const cancelled = appointments.filter(a => a.status === 'Cancelled');

  const list = tab === "upcoming" ? upcoming : tab === "past" ? past : cancelled;

  const statusStyle = {
    Pending: { bg: '#fef3c7', color: '#b45309',  dot: '#d97706' },
    Scheduled: { bg: '#fef3c7', color: '#b45309',  dot: '#d97706' },
    Approved: { bg: '#dcfce7', color: '#15803d',  dot: '#22c55e' },
    Completed: { bg: '#dcfce7', color: '#15803d',  dot: '#22c55e' },
    Cancelled: { bg: '#fee2e2', color: '#dc2626',  dot: '#ef4444' },
    'Rescheduled by Patient': { bg: '#e0e7ff', color: '#4f46e5',  dot: '#6366f1' },
    'Canceled by Patient': { bg: '#fee2e2', color: '#dc2626',  dot: '#ef4444' },
  };

  const serviceEmoji = {
    'Traditional Hilot':  '🤲🏻',
    'Herbal Compress':    '🌿',
    'Head & Neck Relief': '💆🏻‍♀️',
    'Foot Reflexology':   '🦶🏼',
    'Hot Oil Massage':    '🫙',
    'Whole-Body Hilot':   '🧘🏻',
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
              <strong>{cancelled.length}</strong> Cancelled
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
            <button className={`ma-tab ${tab === 'cancelled' ? 'active' : ''}`} onClick={() => setTab('cancelled')}>
              Cancelled <span className="ma-tab-count">{cancelled.length}</span>
            </button>
          </div>

          {/* CARDS */}
          {list.length === 0 ? (
            <div className="ma-empty">
              <div className="ma-empty-icon">🌿</div>
              <h3>No {tab} appointments</h3>
              <p>{tab === 'upcoming' ? 'Book your first hilot session today.' : tab === 'past' ? 'Your completed sessions will appear here.' : 'No cancelled appointments.'}</p>
              {tab === 'upcoming' && (
                <button className="ma-empty-btn" onClick={() => navigate('/book')}>Book a Session</button>
              )}
            </div>
          ) : (
            list.map((a, i) => {
              const st = statusStyle[a.status] || statusStyle.Pending;
              return (
                <div key={i} className="ma-card">
                  <div className="ma-card-accent" style={{ background: st.dot }} />

                  <div className="ma-card-top">
                    <div className="ma-card-left">
                      <div className="ma-service-icon">
                        {serviceEmoji[a.service] || '🤲🏻'}
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
                        <button 
                          className="ma-btn ma-btn-dark" 
                          onClick={() => openModal(a)}
                        >
                          View Details →
                        </button>
                        <button 
                          className="ma-btn ma-btn-light" 
                          onClick={() => {
                            if (!canModifyAppointment(a.date, a.time)) {
                              alert('Appointments can only be rescheduled at least 24 hours before the scheduled time. Please contact the clinic if you need to make changes within 24 hours of your appointment.');
                            } else {
                              setSelectedAppt(a);
                              setRescheduleMode(true);
                              setModalOpen(true);
                            }
                          }}
                        >
                          🔄 Reschedule
                        </button>
                        <button 
                          className="ma-btn ma-btn-red"
                          onClick={() => {
                            if (!canModifyAppointment(a.date, a.time)) {
                              alert('Appointments can only be canceled at least 24 hours before the scheduled time. Please contact the clinic if you need to cancel within 24 hours of your appointment.');
                            } else {
                              setSelectedAppt(a);
                              setShowConfirmCancel(true);
                              setModalOpen(true);
                            }
                          }}
                        >
                          ✕ Cancel Appointment
                        </button>
                      </>
                    ) : tab === 'past' ? (
                      <>
                        <button className="ma-btn ma-btn-light" onClick={() => openModal(a)}>📄 View Summary</button>
                        <button className="ma-btn ma-btn-dark" onClick={() => navigate('/book')}>Book Follow-up →</button>
                      </>
                    ) : (
                      <>
                        <button className="ma-btn ma-btn-light" onClick={() => openModal(a)}>📄 View Details</button>
                        <button className="ma-btn ma-btn-dark" onClick={() => navigate('/book')}>Rebook →</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

        </div>

        {/* MODAL */}
        {modalOpen && selectedAppt && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: '#fff', borderRadius: '18px', padding: '32px',
              maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              {!rescheduleMode && !showConfirmCancel ? (
                <>
                  <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, marginBottom: '20px', color: '#1c1408' }}>
                    Appointment Details
                  </h2>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Service</label>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1408' }}>{selectedAppt.service}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Specialist</label>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1408' }}>{selectedAppt.specialist}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Date</label>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1408' }}>{selectedAppt.date}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Time</label>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1408' }}>{selectedAppt.time}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Status</label>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1408' }}>{selectedAppt.status}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Patient Name</label>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1408' }}>{displayName}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Reason</label>
                      <div style={{ fontSize: '14px', color: '#1c1408' }}>{selectedAppt.reason}</div>
                    </div>
                    {selectedAppt.notes && (
                      <div style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Additional Notes</label>
                        <div style={{ fontSize: '14px', color: '#1c1408', lineHeight: '1.5', wordBreak: 'break-word' }}>
                          {selectedAppt.notes}
                        </div>
                      </div>
                    )}
                    {selectedAppt.rescheduleReason && (
                      <div style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Reschedule Reason</label>
                        <div style={{ fontSize: '14px', color: '#1c1408', lineHeight: '1.5', wordBreak: 'break-word', background: '#e0e7ff', padding: '12px', borderRadius: '8px' }}>
                          {selectedAppt.rescheduleReason}
                        </div>
                      </div>
                    )}
                    {selectedAppt.cancellationReason && (
                      <div style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Cancellation Reason</label>
                        <div style={{ fontSize: '14px', color: '#1c1408', lineHeight: '1.5', wordBreak: 'break-word', background: '#fee2e2', padding: '12px', borderRadius: '8px' }}>
                          {selectedAppt.cancellationReason}
                        </div>
                      </div>
                    )}
                  </div>

                  {tab === 'upcoming' && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                      <button
                        onClick={() => {
                          if (!canModifyAppointment(selectedAppt.date, selectedAppt.time)) {
                            alert('Appointments can only be rescheduled at least 24 hours before the scheduled time. Please contact the clinic if you need to make changes within 24 hours of your appointment.');
                          } else {
                            setRescheduleMode(true);
                          }
                        }}
                        style={{
                          flex: 1, padding: '11px 12px', borderRadius: '10px', fontWeight: 600,
                          border: '1.5px solid #e8ddd0', background: '#fff', color: '#44291a',
                          cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
                          transition: 'all 0.18s'
                        }}
                      >
                        🔄 Reschedule
                      </button>
                      <button
                        onClick={() => {
                          if (!canModifyAppointment(selectedAppt.date, selectedAppt.time)) {
                            alert('Appointments can only be canceled at least 24 hours before the scheduled time. Please contact the clinic if you need to cancel within 24 hours of your appointment.');
                          } else {
                            setShowConfirmCancel(true);
                          }
                        }}
                        style={{
                          flex: 1, padding: '11px 12px', borderRadius: '10px', fontWeight: 600,
                          border: '1.5px solid #fecaca', background: '#fff', color: '#dc2626',
                          cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
                          transition: 'all 0.18s'
                        }}
                      >
                        ✕ Cancel Appointment
                      </button>
                    </div>
                  )}

                  <button
                    onClick={closeModal}
                    style={{
                      width: '100%', padding: '11px 12px', marginTop: '12px', borderRadius: '10px',
                      border: '1.5px solid #e8ddd0', background: '#fff', color: '#44291a',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.18s'
                    }}
                  >
                    Close
                  </button>
                </>
              ) : rescheduleMode ? (
                <>
                  <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#1c1408' }}>
                    Reschedule Appointment
                  </h2>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      Reason for Rescheduling *
                    </label>
                    <textarea
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="Please provide a reason for rescheduling..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1.5px solid #e8ddd0',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontFamily: "'DM Sans', sans-serif",
                        color: '#1c1408',
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: '80px',
                        transition: 'border-color 0.18s'
                      }}
                    />
                    <div style={{ fontSize: '11px', color: '#a8956b', marginTop: '6px' }}>
                      {rescheduleReason.length}/200 characters
                    </div>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1c1408', marginBottom: '16px', marginTop: '20px' }}>Select New Date & Time</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    {/* Calendar */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <button
                          onClick={() => {
                            if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
                            else setCalMonth(m => m - 1);
                            setReschedulingDay(null); setReschedulingTime('');
                          }}
                          style={{ background: 'none', border: '1px solid #e8ddd0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px', color: '#78716c', transition: 'all 0.15s' }}
                        >
                          ←
                        </button>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1c1408' }}>{MONTH_NAMES[calMonth]} {calYear}</div>
                        <button
                          onClick={() => {
                            if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
                            else setCalMonth(m => m + 1);
                            setReschedulingDay(null); setReschedulingTime('');
                          }}
                          style={{ background: 'none', border: '1px solid #e8ddd0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px', color: '#78716c', transition: 'all 0.15s' }}
                        >
                          →
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                        {DAY_NAMES.map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#a8956b', padding: '6px 0', textTransform: 'uppercase' }}>
                            {d}
                          </div>
                        ))}
                        {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
                          <div key={`e${i}`} />
                        ))}
                        {Array.from({ length: getDaysInMonth(calYear, calMonth) }, (_, i) => i + 1).map(day => {
                          const today = new Date();
                          const isPast = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          const dayOfWeek = (getFirstDayOfMonth(calYear, calMonth) + day - 1) % 7;
                          const isSunday = dayOfWeek === 0;
                          return (
                            <div
                              key={day}
                              onClick={() => { if (!isPast && !isSunday) { setReschedulingDay(day); setReschedulingTime(''); } }}
                              style={{
                                aspectRatio: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                borderRadius: '8px',
                                cursor: isPast || isSunday ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s',
                                background: reschedulingDay === day ? 'linear-gradient(135deg,#d97706,#b45309)' : 'transparent',
                                color: reschedulingDay === day ? '#fff' : isPast || isSunday ? '#d4c5b0' : '#44291a',
                                fontWeight: reschedulingDay === day ? '700' : '500',
                                boxShadow: reschedulingDay === day ? '0 3px 10px rgba(217,119,6,0.35)' : 'none',
                                border: !isPast && !isSunday && reschedulingDay !== day ? '1.5px solid transparent' : 'none'
                              }}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: '#a8956b', marginBottom: '12px' }}>
                        Select Time
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Morning Slots */}
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#a8956b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Morning
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                            {MORNING_SLOTS.map(t => {
                              const isLunchBreak = t === LUNCH_BREAK;
                              return (
                                <div
                                  key={t}
                                  onClick={() => !isLunchBreak && setReschedulingTime(t)}
                                  title={isLunchBreak ? 'Lunch break' : ''}
                                  style={{
                                    border: '1.5px solid #e8ddd0',
                                    borderRadius: '10px',
                                    padding: '10px 8px',
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    fontWeight: reschedulingTime === t ? '600' : '500',
                                    cursor: isLunchBreak ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s',
                                    color: isLunchBreak ? '#a8956b' : reschedulingTime === t ? '#fff' : '#44291a',
                                    background: isLunchBreak ? '#f5f5f5' : reschedulingTime === t ? 'linear-gradient(135deg,#d97706,#b45309)' : '#fff',
                                    borderColor: isLunchBreak ? '#d4c5b0' : reschedulingTime === t ? '#d97706' : '#e8ddd0',
                                    boxShadow: reschedulingTime === t && !isLunchBreak ? '0 3px 10px rgba(217,119,6,0.3)' : 'none',
                                    opacity: isLunchBreak ? 0.6 : 1
                                  }}
                                >
                                  {t}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Afternoon Slots */}
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#a8956b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Afternoon
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                            {AFTERNOON_SLOTS.map(t => (
                              <div
                                key={t}
                                onClick={() => setReschedulingTime(t)}
                                style={{
                                  border: '1.5px solid #e8ddd0',
                                  borderRadius: '10px',
                                  padding: '10px 8px',
                                  textAlign: 'center',
                                  fontSize: '14px',
                                  fontWeight: reschedulingTime === t ? '600' : '500',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  color: reschedulingTime === t ? '#fff' : '#44291a',
                                  background: reschedulingTime === t ? 'linear-gradient(135deg,#d97706,#b45309)' : '#fff',
                                  borderColor: reschedulingTime === t ? '#d97706' : '#e8ddd0',
                                  boxShadow: reschedulingTime === t ? '0 3px 10px rgba(217,119,6,0.3)' : 'none'
                                }}
                              >
                                {t}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                    <button
                      onClick={handleRescheduleAppointment}
                      disabled={reschedulingDay === null || !reschedulingTime || !rescheduleReason.trim()}
                      style={{
                        flex: 1, padding: '11px 12px', borderRadius: '10px', fontWeight: 600,
                        background: reschedulingDay === null || !reschedulingTime || !rescheduleReason.trim() ? 'rgba(217,119,6,0.3)' : 'linear-gradient(135deg, #0f172a, #1c1408)', 
                        border: 'none',
                        color: reschedulingDay === null || !reschedulingTime || !rescheduleReason.trim() ? '#ccc' : '#fbbf24', 
                        cursor: reschedulingDay === null || !reschedulingTime || !rescheduleReason.trim() ? 'not-allowed' : 'pointer', 
                        fontSize: '13px',
                        fontFamily: "'DM Sans', sans-serif", 
                        transition: 'all 0.18s'
                      }}
                    >
                      ✓ Confirm Reschedule
                    </button>
                    <button
                      onClick={() => setRescheduleMode(false)}
                      style={{
                        flex: 1, padding: '11px 12px', borderRadius: '10px', fontWeight: 600,
                        border: '1.5px solid #e8ddd0', background: '#fff', color: '#44291a',
                        cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 0.18s'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : showConfirmCancel ? (
                <>
                  <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, marginBottom: '20px', color: '#1c1408' }}>
                    Cancel Appointment
                  </h2>
                  
                  <p style={{ fontSize: '14px', color: '#78716c', marginBottom: '20px' }}>
                    Are you sure you want to cancel this appointment? This action cannot be undone.
                  </p>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a8956b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      Reason for Cancellation *
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Please provide a reason for cancellation..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1.5px solid #e8ddd0',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontFamily: "'DM Sans', sans-serif",
                        color: '#1c1408',
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: '100px',
                        transition: 'border-color 0.18s'
                      }}
                    />
                    <div style={{ fontSize: '11px', color: '#a8956b', marginTop: '6px' }}>
                      {cancelReason.length}/200 characters
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                    <button
                      onClick={handleCancelAppointment}
                      disabled={!cancelReason.trim()}
                      style={{
                        flex: 1, padding: '11px 12px', borderRadius: '10px', fontWeight: 600,
                        border: '1.5px solid #fecaca', 
                        background: !cancelReason.trim() ? '#fee2e2' : '#fff', 
                        color: '#dc2626',
                        cursor: !cancelReason.trim() ? 'not-allowed' : 'pointer', 
                        fontSize: '13px', 
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 0.18s',
                        opacity: !cancelReason.trim() ? 0.5 : 1
                      }}
                    >
                      ✕ Yes, Cancel Appointment
                    </button>
                    <button
                      onClick={() => setShowConfirmCancel(false)}
                      style={{
                        flex: 1, padding: '11px 12px', borderRadius: '10px', fontWeight: 600,
                        border: '1.5px solid #e8ddd0', background: '#fff', color: '#44291a',
                        cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 0.18s'
                      }}
                    >
                      Keep Appointment
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

      </div>
    </>
  );
}