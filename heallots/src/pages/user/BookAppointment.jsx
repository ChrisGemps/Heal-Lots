import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

const SERVICES = [
  { id: 1, name: 'Traditional Hilot',   specialist: 'Manang Rosa',    emoji: '🤲🏻', tag: 'Most Popular' },
  { id: 2, name: 'Herbal Compress',     specialist: 'Mang Berting',   emoji: '🌿', tag: 'Best for Pain' },
  { id: 3, name: 'Head & Neck Relief',  specialist: 'Ate Cora',       emoji: '💆🏻‍♀️', tag: 'Stress Relief' },
  { id: 4, name: 'Foot Reflexology',    specialist: 'Manang Lourdes', emoji: '🦶🏼', tag: 'Walk-in' },
  { id: 5, name: 'Hot Oil Massage',     specialist: 'Mang Totoy',     emoji: '🫙', tag: 'New' },
  { id: 6, name: 'Whole-Body Hilot',    specialist: 'Ate Nena',       emoji: '🧘🏻', tag: 'Premium' },
];

const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const MORNING_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'];
const AFTERNOON_SLOTS = ['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const LUNCH_BREAK = '12:00 PM';

const REASONS = [
  'Body Pain / Muscle Aches',
  'Stress & Fatigue Relief',
  'Post-injury Recovery',
  'Regular Wellness Session',
  'Sleep Improvement',
  'Headache / Migraine',
  'Other',
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function BookAppointment({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();

  const raw  = localStorage.getItem('user');
  const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};

  const today = new Date();
  const [step,        setStep]        = useState(1);
  const [service,     setService]     = useState(null);
  const [calYear,     setCalYear]     = useState(today.getFullYear());
  const [calMonth,    setCalMonth]    = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [timeSlot,    setTimeSlot]    = useState('');
  const [reason,      setReason]      = useState('');
  const [notes,       setNotes]       = useState('');
  const [submitted,   setSubmitted]   = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [specialistRatings, setSpecialistRatings] = useState({});

  const daysInMonth  = getDaysInMonth(calYear, calMonth);
  const firstDay     = getFirstDayOfMonth(calYear, calMonth);
  const selectedDate = selectedDay
    ? `${MONTH_NAMES[calMonth]} ${selectedDay}, ${calYear}`
    : null;

  // Pre-select service if navigated from Home with a service title
  useEffect(() => {
    const preselect = location.state?.preselect;
    if (preselect) {
      const match = SERVICES.find(s => s.name === preselect);
      if (match) setService(match);
    }
  }, [location.state]);

  // Fetch approved appointments to check availability
  useEffect(() => {
    const fetchApprovedAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/appointments/all', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Filter only approved appointments
        const approved = response.data.filter(appt => appt.status === 'Approved');
        setBookedSlots(approved);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      }
    };
    
    fetchApprovedAppointments();
  }, []);

  // Fetch specialist ratings and reviews
  useEffect(() => {
    const fetchSpecialistRatings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/reviews/specialist-ratings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Format: { "Manang Rosa": { rating: 4.9, reviews: 214 }, ... }
        setSpecialistRatings(response.data || {});
      } catch (err) {
        console.error('Error fetching specialist ratings:', err);
        // Fallback: set empty ratings to avoid errors
        setSpecialistRatings({});
      }
    };
    
    fetchSpecialistRatings();
  }, []);

  const canProceedStep1 = !!service;
  const canProceedStep2 = !!selectedDay && !!timeSlot;
  const canSubmit       = !!reason;

  // Check if a time slot is booked for the selected specialist on the selected date
  const isSlotBooked = (slot) => {
    if (!service || !selectedDate) return false;
    return bookedSlots.some(appt => 
      appt.specialistName === service.specialist && 
      appt.appointmentDate === selectedDate && 
      appt.timeSlot === slot
    );
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null); setTimeSlot('');
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null); setTimeSlot('');
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const appointmentData = {
        serviceName: service.name,
        specialistName: service.specialist,
        appointmentDate: selectedDate,
        timeSlot: timeSlot,
        reason: reason,
        notes: notes,
      };
      
      const response = await axios.post('http://localhost:8080/api/appointments/book', appointmentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Appointment booked:', response.data);
      setSubmitted(true);
    } catch (err) {
      console.error('Error booking appointment:', err.response?.data || err.message);
      // You could set an error state here to display to the user
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (setIsLoggedIn) setIsLoggedIn(false);
    navigate('/', { replace: true });
  };

  const displayName = user?.fullName || user?.name || 'Patient';
  const getPhotoKey = () => `userPhoto_${user?.id}`;
  const buildPhotoUrl = (val) => {
    if (!val) return null;
    if (val.startsWith('data:') || val.startsWith('http')) return val;
    if (val.startsWith('/uploads/')) return 'http://localhost:8080/api/user/profile-picture/' + val.split('/').pop();
    return 'http://localhost:8080/api/user/profile-picture/' + val;
  };
  const photo = (() => {
    const stored = localStorage.getItem(getPhotoKey());
    const fromDb = user?.profilePictureUrl;
    if (stored && stored.startsWith('http')) return stored;
    const built = buildPhotoUrl(fromDb);
    if (built) localStorage.setItem(getPhotoKey(), built);
    return built || stored || null;
  })();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ba-wrap {
          min-height: 100vh;
          background: #fafaf8;
          font-family: 'DM Sans', sans-serif;
          color: #1c1408;
          display: flex;
          flex-direction: column;
        }

        /* ── TOP BAR ── */
        .ba-topbar {
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
          flex-shrink: 0;
        }

        .ba-topbar-brand { display: flex; align-items: center; cursor: pointer; }
        .ba-topbar-logo  { height: 55px; width: auto; filter: brightness(0) invert(1) drop-shadow(0 0 5px rgba(217,119,6,0.5)); }
        .ba-topbar-right { display: flex; align-items: center; gap: 16px; }
        .ba-user-badge   { display: flex; align-items: center; gap: 10px; }

        .ba-avatar img { width:100%; height:100%; border-radius:50%; object-fit:cover; }
        .ba-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #d97706, #b45309);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: #fff;
          box-shadow: 0 2px 8px rgba(217,119,6,0.4);
        }

        .ba-user-info { line-height: 1.2; }
        .ba-user-name { font-size: 14px; font-weight: 600; color: #e2c98a; }
        .ba-user-role { font-size: 12px; color: #a8956b; }

        .ba-topbar-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ba-topbar-nav a {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #a8956b;
          text-decoration: none;
          padding: 7px 14px;
          border-radius: 8px;
          transition: all 0.18s;
        }

        .ba-topbar-nav a:hover,
        .ba-topbar-nav a.active {
          color: #fbbf24;
          background: rgba(217,119,6,0.12);
        }

        .ba-logout-btn {
          background: rgba(217,119,6,0.12); border: 1px solid rgba(217,119,6,0.3);
          color: #fbbf24; border-radius: 8px; padding: 7px 16px;
          font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.18s;
        }
        .ba-logout-btn:hover { background: rgba(217,119,6,0.22); border-color: rgba(217,119,6,0.5); }
        .ba-admin-btn {
          background: #bbab81;
          border: none;
          color: #1c1408; border-radius: 20px; padding: 8px 18px;
          font-size: 12px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.18s;
          letter-spacing: 0.5px; text-transform: uppercase;
        }
        .ba-admin-btn:hover { background: #f59e0b; box-shadow: 0 4px 12px rgba(217,119,6,0.3); }

        /* ── BODY ── */
        .ba-body { flex: 1; max-width: 860px; margin: 0 auto; padding: 40px 24px 60px; width: 100%; }

        /* ── STEPPER ── */
        .ba-stepper {
          display: flex; align-items: center; justify-content: center;
          gap: 0; margin-bottom: 36px;
        }

        .ba-step {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          position: relative; z-index: 1;
        }

        .ba-step-circle {
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; transition: all 0.3s;
          border: 2px solid #e8ddd0; background: #fff; color: #a8956b;
        }

        .ba-step.active   .ba-step-circle { background: linear-gradient(135deg,#d97706,#b45309); border-color: #d97706; color: #fff; box-shadow: 0 4px 14px rgba(217,119,6,0.4); }
        .ba-step.done     .ba-step-circle { background: #fef3c7; border-color: #d97706; color: #b45309; }

        .ba-step-label { font-size: 12px; font-weight: 500; color: #a8956b; white-space: nowrap; }
        .ba-step.active .ba-step-label { color: #d97706; font-weight: 600; }
        .ba-step.done   .ba-step-label { color: #b45309; }

        .ba-step-line {
          flex: 1; height: 2px; background: #e8ddd0;
          margin: 0 12px; margin-bottom: 28px; min-width: 60px; transition: background 0.3s;
        }
        .ba-step-line.done { background: #d97706; }

        /* ── CARD ── */
        .ba-card {
          background: #fff; border: 1.5px solid #f0e6d3;
          border-radius: 20px; padding: 32px; margin-bottom: 20px;
        }

        .ba-card-title {
          font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700;
          color: #1c1408; margin-bottom: 20px;
        }

        /* ── SERVICE GRID ── */
        .ba-service-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
        }

        .ba-service-item {
          border: 1.5px solid #f0e6d3; border-radius: 14px;
          padding: 16px; display: flex; align-items: center; gap: 14px;
          cursor: pointer; transition: all 0.2s; background: #fff;
        }

        .ba-service-item:hover { border-color: #d97706; background: #fffbf5; transform: translateY(-1px); }
        .ba-service-item.selected { border-color: #d97706; background: #fef3c7; box-shadow: 0 4px 16px rgba(217,119,6,0.15); }

        .ba-service-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: #fef3c7; display: flex; align-items: center;
          justify-content: center; font-size: 24px; flex-shrink: 0;
        }

        .ba-service-name { font-size: 14px; font-weight: 600; color: #1c1408; margin-bottom: 2px; }
        .ba-service-spec { font-size: 12px; color: #78716c; margin-bottom: 4px; }

        .ba-service-tag {
          display: inline-block; font-size: 10px; font-weight: 600;
          padding: 2px 8px; border-radius: 100px;
          background: #fef3c7; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;
        }

        .ba-service-rating { font-size: 12px; color: #d97706; font-weight: 500; margin-left: auto; white-space: nowrap; }

        /* ── CALENDAR ── */
        .ba-date-time { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

        .ba-cal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }

        .ba-cal-title { font-size: 15px; font-weight: 600; color: #1c1408; }

        .ba-cal-nav {
          background: none; border: 1px solid #e8ddd0; border-radius: 8px;
          width: 30px; height: 30px; cursor: pointer; font-size: 14px;
          color: #78716c; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .ba-cal-nav:hover { background: #fef3c7; border-color: #d97706; color: #d97706; }

        .ba-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }

        .ba-cal-day-name {
          text-align: center; font-size: 11px; font-weight: 600;
          color: #a8956b; padding: 6px 0; text-transform: uppercase;
        }

        .ba-cal-day {
          aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
          font-size: 13px; border-radius: 8px; cursor: pointer;
          transition: all 0.15s; color: #44291a; font-weight: 500;
        }

        .ba-cal-day:hover:not(.past) { background: #fef3c7; color: #d97706; }
        .ba-cal-day.selected { background: linear-gradient(135deg,#d97706,#b45309); color: #fff; font-weight: 700; box-shadow: 0 3px 10px rgba(217,119,6,0.35); }
        .ba-cal-day.today:not(.selected) { border: 1.5px solid #d97706; color: #d97706; }
        .ba-cal-day.past { color: #d4c5b0; cursor: not-allowed; }
        .ba-cal-day.empty { cursor: default; }

        /* ── TIME SLOTS ── */
        .ba-slots-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #a8956b; margin-bottom: 12px; }

        .ba-slots-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }

        .ba-slot {
          border: 1.5px solid #e8ddd0; border-radius: 10px; padding: 10px 8px;
          text-align: center; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.15s; color: #44291a; background: #fff;
        }

        .ba-slot:hover:not(.disabled) { border-color: #d97706; background: #fef3c7; color: #b45309; }
        .ba-slot.selected { background: linear-gradient(135deg,#d97706,#b45309); border-color: #d97706; color: #fff; font-weight: 600; box-shadow: 0 3px 10px rgba(217,119,6,0.3); }
        .ba-slot.disabled { 
          background: #f5f5f5; 
          border-color: #d4c5b0; 
          color: #a8956b; 
          cursor: not-allowed; 
          opacity: 0.6;
        }

        /* ── REASON ── */
        .ba-select {
          width: 100%; padding: 12px 16px; border: 1.5px solid #e8ddd0;
          border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #1c1408; background: #fff; outline: none;
          transition: border-color 0.18s, box-shadow 0.18s; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a8956b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
          padding-right: 40px; margin-bottom: 16px; cursor: pointer;
        }
        .ba-select:focus { border-color: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.12); }

        .ba-textarea {
          width: 100%; padding: 12px 16px; border: 1.5px solid #e8ddd0;
          border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #1c1408; background: #fff; outline: none; resize: vertical;
          min-height: 100px; transition: border-color 0.18s, box-shadow 0.18s;
        }
        .ba-textarea:focus { border-color: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.12); }

        .ba-field-label {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 1px; color: #a8956b; margin-bottom: 8px; display: block;
        }

        /* ── SUMMARY BOX ── */
        .ba-summary {
          background: #fef3c7; border: 1.5px solid rgba(217,119,6,0.25);
          border-radius: 14px; padding: 20px 24px; margin-bottom: 20px;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        }

        .ba-summary-item label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #b45309; display: block; margin-bottom: 4px; }
        .ba-summary-item span  { font-size: 14px; font-weight: 600; color: #1c1408; }

        /* ── FOOTER BTNS ── */
        .ba-footer {
          display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px;
        }

        .ba-btn-back {
          background: #fff; border: 1.5px solid #e8ddd0; border-radius: 10px;
          padding: 12px 28px; font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; color: #78716c; cursor: pointer;
          transition: all 0.18s;
        }
        .ba-btn-back:hover { border-color: #d97706; color: #d97706; }

        .ba-btn-next {
          background: linear-gradient(135deg,#d97706,#b45309); border: none;
          border-radius: 10px; padding: 12px 32px; font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; color: #fff; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 4px 14px rgba(217,119,6,0.35);
        }
        .ba-btn-next:hover:not(:disabled) { background: linear-gradient(135deg,#f59e0b,#d97706); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(217,119,6,0.45); }
        .ba-btn-next:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── SUCCESS MODAL ── */
        .ba-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }

        .ba-modal {
          background: #fff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          max-width: 480px; width: 100%; padding: 40px; text-align: center;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ba-modal-icon { font-size: 64px; margin-bottom: 24px; }

        .ba-modal-title {
          font-family: 'Fraunces', serif; font-size: 32px; font-weight: 900;
          color: #1c1408; margin-bottom: 16px;
        }

        .ba-modal-text {
          font-size: 16px; color: #78716c; line-height: 1.7;
          margin-bottom: 8px;
        }

        .ba-modal-highlight {
          font-size: 18px; color: #d97706; font-weight: 700;
          margin: 24px 0 32px;
        }

        .ba-modal-button {
          background: linear-gradient(135deg,#d97706,#b45309); color: #fff;
          border: none; border-radius: 12px; padding: '13px 32px';
          font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(217,119,6,0.35);
          padding: 13px 32px;
        }

        .ba-modal-button:hover {
          background: linear-gradient(135deg,#f59e0b,#d97706);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(217,119,6,0.45);
        }

        @media (max-width: 640px) {
          .ba-service-grid { grid-template-columns: 1fr; }
          .ba-date-time    { grid-template-columns: 1fr; }
          .ba-summary      { grid-template-columns: 1fr; }
          .ba-topbar       { padding: 0 20px; }
          .ba-user-info    { display: none; }
        }
      `}</style>

      <div className="ba-wrap">
        {/* TOP BAR */}
        <div className="ba-topbar">
          <div className="ba-topbar-brand" onClick={() => navigate('/dashboard')}>
            <img src="/logo.png" alt="Heal Lots" className="ba-topbar-logo" />
          </div>
          <div className="ba-topbar-right">
            <nav className="ba-topbar-nav">
              {user?.role === 'ADMIN' && (
                <button className="ba-admin-btn" onClick={() => navigate('/admin')} title="Go to Admin Panel">
                  ADMIN dashboard
                </button>
              )}
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
              <Link to="/book"         className={location.pathname === '/book'         ? 'active' : ''}>Book Session</Link>
              <Link to="/appointments" className={location.pathname === '/appointments' ? 'active' : ''}>My Appointments</Link>
            </nav>
            <div className="ba-user-badge">
              <div className="ba-avatar" onClick={() => navigate('/profile')} title="View Profile" style={{cursor:'pointer'}}>{photo ? <img src={photo} alt="Profile" /> : displayName.charAt(0).toUpperCase()}</div>
              <div className="ba-user-info">
                <div className="ba-user-name">{displayName}</div>
                <div className="ba-user-role">{user?.role === 'ADMIN' ? 'ADMIN' : 'Patient'}</div>
              </div>
            </div>
            <button className="ba-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        <div className="ba-body">

  {/* BACK BUTTON */}
  <div style={{ marginBottom: "18px" }}>
    <button
      onClick={() => navigate("/dashboard")}
      style={{
        background: "none",
        border: "none",
        color: "#d97706",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer"
      }}
    >
      ← Back
    </button>
  </div>
          {/* STEPPER */}
          <div className="ba-stepper">
            {[['1','Select Service'],['2','Choose Date'],['3','Confirm']].map(([n, lbl], i) => (
              <>
                {i > 0 && <div key={`line-${i}`} className={`ba-step-line${step > i ? ' done' : ''}`} />}
                <div key={n} className={`ba-step${step === i+1 ? ' active' : step > i+1 ? ' done' : ''}`}>
                  <div className="ba-step-circle">{step > i+1 ? '✓' : n}</div>
                  <div className="ba-step-label">{lbl}</div>
                </div>
              </>
            ))}
          </div>

          {/* STEP 1 — SELECT SERVICE */}
          {step === 1 && (
            <div className="ba-card">
              <div className="ba-card-title">Select a Service</div>
              <div className="ba-service-grid">
                {SERVICES.map(svc => (
                  <div
                    key={svc.id}
                    className={`ba-service-item${service?.id === svc.id ? ' selected' : ''}`}
                    onClick={() => setService(svc)}
                  >
                    <div className="ba-service-icon">{svc.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div className="ba-service-name">{svc.name}</div>
                      <div className="ba-service-spec">{svc.specialist}</div>
                      <div className="ba-service-tag">{svc.tag}</div>
                    </div>
                    <div className="ba-service-rating">
                      {specialistRatings[svc.specialist] ? (
                        <>⭐ {specialistRatings[svc.specialist].rating.toFixed(1)} ({specialistRatings[svc.specialist].reviews})</>
                      ) : (
                        <>⭐ N/A</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — DATE & TIME */}
          {step === 2 && (
            <div className="ba-card">
              <div className="ba-card-title">Select Date & Time</div>
              <div className="ba-date-time">
                {/* Calendar */}
                <div>
                  <div className="ba-cal-header">
                    <button className="ba-cal-nav" onClick={prevMonth}>←</button>
                    <div className="ba-cal-title">{MONTH_NAMES[calMonth]} {calYear}</div>
                    <button className="ba-cal-nav" onClick={nextMonth}>→</button>
                  </div>
                  <div className="ba-cal-grid">
                    {DAY_NAMES.map(d => (
                      <div key={d} className="ba-cal-day-name">{d}</div>
                    ))}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`e${i}`} className="ba-cal-day empty" />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const dayOfWeek = (firstDay + day - 1) % 7;
                      const isSunday = dayOfWeek === 0;
                      const isPast = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                      return (
                        <div
                          key={day}
                          className={`ba-cal-day${isPast ? ' past' : ''}${isSunday ? ' past' : ''}${isToday ? ' today' : ''}${selectedDay === day ? ' selected' : ''}`}
                          onClick={() => { if (!isPast && !isSunday) { setSelectedDay(day); setTimeSlot(''); } }}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <div className="ba-slots-label">Select Time</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Morning Slots */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#a8956b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Morning</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        {MORNING_SLOTS.map(t => {
                          const isBooked = isSlotBooked(t);
                          const isLunchBreak = t === LUNCH_BREAK;
                          return (
                            <div
                              key={t}
                              className={`ba-slot${timeSlot === t ? ' selected' : ''}${isBooked || isLunchBreak ? ' disabled' : ''}`}
                              onClick={() => !isBooked && !isLunchBreak && setTimeSlot(t)}
                              title={isLunchBreak ? 'Lunch break' : isBooked ? 'This slot is unavailable' : ''}
                            >
                              {t}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Afternoon Slots */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#a8956b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Afternoon</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        {AFTERNOON_SLOTS.map(t => {
                          const isBooked = isSlotBooked(t);
                          return (
                            <div
                              key={t}
                              className={`ba-slot${timeSlot === t ? ' selected' : ''}${isBooked ? ' disabled' : ''}`}
                              onClick={() => !isBooked && setTimeSlot(t)}
                              title={isBooked ? 'This slot is unavailable' : ''}
                            >
                              {t}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — CONFIRM */}
          {step === 3 && (
            <>
              <div className="ba-summary">
                <div className="ba-summary-item">
                  <label>Service</label>
                  <span>{service?.emoji} {service?.name}</span>
                </div>
                <div className="ba-summary-item">
                  <label>Specialist</label>
                  <span>{service?.specialist}</span>
                </div>
                <div className="ba-summary-item">
                  <label>Date & Time</label>
                  <span>{selectedDate} · {timeSlot}</span>
                </div>
              </div>

              <div className="ba-card">
                <div className="ba-card-title">Reason for Visit</div>
                <label className="ba-field-label">Select Reason</label>
                <select className="ba-select" value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="">Select a reason...</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <label className="ba-field-label">Additional Notes (optional)</label>
                <textarea
                  className="ba-textarea"
                  placeholder="Enter any additional information..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {/* FOOTER BUTTONS */}
          <div className="ba-footer">
            {step > 1
              ? <button className="ba-btn-back" onClick={() => setStep(s => s - 1)}>← Back</button>
              : <button className="ba-btn-back" onClick={() => navigate('/dashboard')}>Cancel</button>
            }
            {step < 3
              ? <button className="ba-btn-next" disabled={step === 1 ? !canProceedStep1 : !canProceedStep2} onClick={() => setStep(s => s + 1)}>
                  Next →
                </button>
              : <button className="ba-btn-next" disabled={!canSubmit} onClick={handleSubmit}>
                  Confirm Booking ✓
                </button>
            }
          </div>
        </div>
      </div>

      {/* ── SUCCESS MODAL ── */}
      {submitted && (
        <div className="ba-modal-overlay">
          <div className="ba-modal">
            <div className="ba-modal-icon">📋✔️</div>
            <h2 className="ba-modal-title">Session Booked!</h2>
            <p className="ba-modal-text">
              Your <strong>{service?.name}</strong> with <strong>{service?.specialist}</strong> is submitted for
            </p>
            <div className="ba-modal-highlight">
              {selectedDate} at {timeSlot}. 
            </div>
            <h2>Please wait for the confirmation of the clinic.</h2><br></br>
            <div><button className="ba-modal-button" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button></div>
          </div>
        </div>
      )}
    </>
  );
}