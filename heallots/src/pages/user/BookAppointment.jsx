import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const SERVICES = [
  { id: 1, name: 'Traditional Hilot',   specialist: 'Manang Rosa',    emoji: '🤲', tag: 'Most Popular', rating: 4.9, reviews: 214 },
  { id: 2, name: 'Herbal Compress',     specialist: 'Mang Berting',   emoji: '🌿', tag: 'Best for Pain', rating: 4.8, reviews: 178 },
  { id: 3, name: 'Head & Neck Relief',  specialist: 'Ate Cora',       emoji: '💆', tag: 'Stress Relief',  rating: 4.9, reviews: 193 },
  { id: 4, name: 'Foot Reflexology',    specialist: 'Manang Lourdes', emoji: '🦶', tag: 'Walk-in',        rating: 4.7, reviews: 152 },
  { id: 5, name: 'Hot Oil Massage',     specialist: 'Mang Totoy',     emoji: '🛢️', tag: 'New',            rating: 4.8, reviews: 89  },
  { id: 6, name: 'Whole-Body Hilot',    specialist: 'Ate Nena',       emoji: '🧘', tag: 'Premium',        rating: 5.0, reviews: 301 },
];

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

const REASONS = [
  'Body pain / muscle aches',
  'Stress & fatigue relief',
  'Post-injury recovery',
  'Regular wellness session',
  'Sleep improvement',
  'Headache / migraine',
  'Other',
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['S','M','T','W','T','F','S'];

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

  const daysInMonth  = getDaysInMonth(calYear, calMonth);
  const firstDay     = getFirstDayOfMonth(calYear, calMonth);
  const selectedDate = selectedDay
    ? `${MONTH_NAMES[calMonth]} ${selectedDay}, ${calYear}`
    : null;

  const canProceedStep1 = !!service;
  const canProceedStep2 = !!selectedDay && !!timeSlot;
  const canSubmit       = !!reason;

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

  const handleSubmit = () => {
    // TODO: POST to backend
    setSubmitted(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (setIsLoggedIn) setIsLoggedIn(false);
    navigate('/', { replace: true });
  };

  const displayName = user?.fullName || user?.name || 'Patient';

  if (submitted) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
          .ba-wrap { min-height: 100vh; background: #fafaf8; font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; }
        `}</style>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🤲</div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, color: '#1c1408', marginBottom: 12 }}>
              Session Booked!
            </h2>
            <p style={{ color: '#78716c', fontSize: 16, lineHeight: 1.7, marginBottom: 8 }}>
              Your <strong>{service?.name}</strong> with <strong>{service?.specialist}</strong> is confirmed for
            </p>
            <p style={{ color: '#d97706', fontWeight: 700, fontSize: 18, marginBottom: 32 }}>
              {selectedDate} at {timeSlot}
            </p>
            <button onClick={() => navigate('/dashboard')}
              style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

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

        .ba-slot:hover { border-color: #d97706; background: #fef3c7; color: #b45309; }
        .ba-slot.selected { background: linear-gradient(135deg,#d97706,#b45309); border-color: #d97706; color: #fff; font-weight: 600; box-shadow: 0 3px 10px rgba(217,119,6,0.3); }

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
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
              <Link to="/book"         className={location.pathname === '/book'         ? 'active' : ''}>Book Session</Link>
              <Link to="/appointments" className={location.pathname === '/appointments' ? 'active' : ''}>My Appointments</Link>
            </nav>
            <div className="ba-user-badge">
              <div className="ba-avatar">{displayName.charAt(0).toUpperCase()}</div>
              <div className="ba-user-info">
                <div className="ba-user-name">{displayName}</div>
                <div className="ba-user-role">Patient</div>
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
                    <div className="ba-service-rating">⭐ {svc.rating}</div>
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
                      const isPast = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                      return (
                        <div
                          key={day}
                          className={`ba-cal-day${isPast ? ' past' : ''}${isToday ? ' today' : ''}${selectedDay === day ? ' selected' : ''}`}
                          onClick={() => { if (!isPast) { setSelectedDay(day); setTimeSlot(''); } }}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <div className="ba-slots-label">Available Time Slots</div>
                  <div className="ba-slots-grid">
                    {TIME_SLOTS.map(t => (
                      <div
                        key={t}
                        className={`ba-slot${timeSlot === t ? ' selected' : ''}`}
                        onClick={() => setTimeSlot(t)}
                      >
                        {t}
                      </div>
                    ))}
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
    </>
  );
}