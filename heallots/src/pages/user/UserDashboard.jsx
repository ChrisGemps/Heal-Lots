import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

export default function UserDashboard({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState('all');

  const raw = localStorage.getItem('user');
  const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Patient';
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
          status: appt.status || 'Pending',
          createdAt: appt.createdAt,
        }));
        
        // Sort by creation date (newest first)
        transformedAppointments.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
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

  // Fetch reviews from backend
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/reviews');
        console.log('Successfully fetched reviews:', response.data);
        setReviews(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setReviews([]);
      }
    };
    
    fetchReviews();
  }, []);

  // Helper function to determine if appointment is upcoming
  const isUpcoming = (dateString) => {
    try {
      const appointmentDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return appointmentDate >= today;
    } catch (e) {
      return true;
    }
  };

  // Show only upcoming appointments on dashboard
  const upcomingAppointments = appointments.filter(a => isUpcoming(a.date)).slice(0, 3);

  // Calculate review stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : 0;

  // Filter reviews based on selected rating and sort by newest first
  const filteredReviews = (selectedRating === 'all' 
    ? reviews 
    : reviews.filter(r => r.rating === parseInt(selectedRating))
  ).sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA;
  });

  const statusColors = {
    Pending: { bg: '#fef3c7', color: '#b45309' },
    Scheduled: { bg: '#fef3c7', color: '#b45309' },
    Approved: { bg: '#dcfce7', color: '#15803d' },
    Completed: { bg: '#dcfce7', color: '#15803d' },
    Cancelled: { bg: '#fee2e2', color: '#dc2626' },
  };

  const serviceEmoji = {
    'Traditional Hilot': '🤲🏻',
    'Herbal Compress': '🌿',
    'Head & Neck Relief': '💆🏻‍♀️',
    'Foot Reflexology': '🦶🏼',
    'Hot Oil Massage': '🫙',
    'Whole-Body Hilot': '🧘🏻',
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (setIsLoggedIn) setIsLoggedIn(false);
    navigate('/', { replace: true });
    window.location.reload();
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
          box-shadow: 0 2px 8px rgba(217,119,6,0.4); overflow: hidden; cursor: pointer;
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

        /* ── REVIEWS ── */
        .ud-reviews-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-top: 48px;
          margin-bottom: 18px;
        }

        .ud-reviews-title {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 700;
          color: #1c1408;
          flex-shrink: 0;
        }

        .ud-reviews-stats {
          display: flex;
          align-items: center;
          gap: 32px;
          background: transparent;
          padding: 0;
          border-radius: 0;
          border: none;
        }

        .ud-reviews-stat {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .ud-reviews-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #d97706;
          line-height: 1;
        }

        .ud-reviews-stat-label {
          font-size: 10px;
          color: #a8956b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-top: 6px;
        }

        /* ── REVIEWS FILTER TABS ── */
        .ud-reviews-container {
          background: #fff;
          border: 1.5px solid #f0e6d3;
          border-radius: 16px;
          overflow: hidden;
          margin-top: 0;
        }

        .ud-reviews-tabs {
          display: flex;
          align-items: center;
          border-bottom: 1.5px solid #f0e6d3;
          overflow-x: auto;
          padding: 0 24px;
          background: #fff;
        }

        .ud-reviews-tab {
          background: none;
          border: none;
          padding: 14px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #78716c;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          text-transform: capitalize;
        }

        .ud-reviews-tab:hover {
          color: #d97706;
        }

        .ud-reviews-tab.active {
          color: #d97706;
        }

        .ud-reviews-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1.5px;
          left: 0;
          right: 0;
          height: 3px;
          background: #d97706;
        }

        .ud-tab-count {
          font-size: 12px;
          color: #a8956b;
          margin-left: 6px;
          font-weight: 500;
        }

        .ud-reviews-list {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 500px;
          overflow-y: auto;
        }

        .ud-reviews-list::-webkit-scrollbar {
          width: 6px;
        }

        .ud-reviews-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .ud-reviews-list::-webkit-scrollbar-thumb {
          background: #d4cfc5;
          border-radius: 3px;
        }

        .ud-reviews-list::-webkit-scrollbar-thumb:hover {
          background: #c4bfb5;
        }

        .ud-review-item {
          display: flex;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f5ede0;
          animation: fadeIn 0.2s ease-in;
        }

        .ud-review-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ud-review-avatar-small {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          font-weight: 600;
          color: #b45309;
          overflow: hidden;
        }

        .ud-review-avatar-small img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .ud-review-content { flex: 1; }

        .ud-review-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
          gap: 12px;
        }

        .ud-review-specialist {
          font-size: 14px;
          font-weight: 600;
          color: #1c1408;
        }

        .ud-review-rating-stars {
          font-size: 12px;
          letter-spacing: 1px;
          flex-shrink: 0;
        }

        .ud-review-service {
          font-size: 12px;
          color: #78716c;
          margin-bottom: 6px;
        }

        .ud-review-text {
          font-size: 13px;
          color: #1c1408;
          line-height: 1.4;
          font-weight: 400;
          margin-bottom: 8px;
        }

        .ud-review-date {
          font-size: 11px;
          color: #a8956b;
        }

        .ud-no-reviews {
          padding: 60px 24px;
          text-align: center;
          color: #a8956b;
        }

        .ud-no-reviews-message {
          font-size: 15px;
          font-weight: 500;
          color: #78716c;
        }

        .ud-no-reviews-subtext {
          font-size: 13px;
          margin-top: 8px;
          color: #b8aca2;
        }

        @media (max-width: 768px) {
          .ud-reviews-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .ud-reviews-stats { gap: 24px; }
          .ud-reviews-tab { padding: 12px 12px; font-size: 12px; }
          .ud-reviews-list { max-height: 450px; }
        }

        @media (max-width: 480px) {
          .ud-reviews-header { width: 100%; }
          .ud-reviews-stats { justify-content: flex-start; }
          .ud-reviews-tab { padding: 10px 8px; font-size: 11px; }
          .ud-tab-count { display: none; }
          .ud-review-item { gap: 10px; }
          .ud-review-avatar-small { width: 36px; height: 36px; font-size: 14px; }
        }

        .ud-admin-btn {
          background: #bbab81;
          border: none;
          color: #1c1408; border-radius: 20px; padding: 8px 18px;
          font-size: 12px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.18s;
          letter-spacing: 0.5px; text-transform: uppercase;
        }
        .ud-admin-btn:hover { background: #f59e0b; box-shadow: 0 4px 12px rgba(217,119,6,0.3); }

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
              {user?.role === 'ADMIN' && (
                <button className="ud-admin-btn" onClick={() => navigate('/admin')} title="Go to Admin Panel">
                  ADMIN dashboard
                </button>
              )}
              <Link to="/dashboard"    className={location.pathname === '/dashboard'    ? 'active' : ''}>Dashboard</Link>
              <Link to="/book"         className={location.pathname === '/book'         ? 'active' : ''}>Book Session</Link>
              <Link to="/appointments" className={location.pathname === '/appointments' ? 'active' : ''}>My Appointments</Link>
            </nav>
            <div className="ud-user-badge">
              <div className="ud-avatar" onClick={() => navigate('/profile')} title="View Profile">
                {photo ? <img src={photo} alt="Profile" /> : displayName.charAt(0).toUpperCase()}
              </div>
              <div className="ud-user-info">
                <div className="ud-user-name">{displayName}</div>
                <div className="ud-user-role">{user?.role === 'ADMIN' ? 'ADMIN' : 'Patient'}</div>
              </div>
            </div>
            <button className="ud-logout-btn" onClick={handleLogout}>Sign Out</button>
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
            <h2>Recent Bookings</h2>
            <button className="ud-view-all" onClick={() => navigate('/appointments')}>
              View All →
            </button>
          </div>

          <div className="ud-appt-card">
            {upcomingAppointments.length === 0 ? (
              <div className="ud-empty">
                <div className="ud-empty-icon">🌿</div>
                <p>No upcoming sessions. Book your first hilot today!</p>
              </div>
            ) : (
              upcomingAppointments.map((appt, idx) => (
                <div className="ud-appt-row" key={idx}>
                  <div className="ud-appt-avatar">{serviceEmoji[appt.service] || '🤲🏻'}</div>
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

        {/* REVIEWS SECTION */}
        <div className="ud-reviews-header">
          <h2 className="ud-reviews-title">Community Reviews</h2>
          <div className="ud-reviews-stats">
            <div className="ud-reviews-stat">
              <div className="ud-reviews-stat-value">{averageRating}</div>
              <div className="ud-reviews-stat-label">Avg Rating</div>
            </div>
            <div className="ud-reviews-stat">
              <div className="ud-reviews-stat-value">{totalReviews}</div>
              <div className="ud-reviews-stat-label">Total Reviews</div>
            </div>
          </div>
        </div>

        {/* REVIEWS CONTAINER WITH TABS */}
        <div className="ud-reviews-container">
          {totalReviews === 0 ? (
            <div className="ud-no-reviews">
              <div className="ud-no-reviews-message">No reviews yet</div>
              <div className="ud-no-reviews-subtext">Book a session and share your experience</div>
            </div>
          ) : (
            <>
              {/* FILTER TABS */}
              <div className="ud-reviews-tabs">
                <button
                  className={`ud-reviews-tab ${selectedRating === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedRating('all')}
                >
                  All
                  <span className="ud-tab-count">({totalReviews})</span>
                </button>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter(r => r.rating === star).length;
                  return (
                    <button
                      key={star}
                      className={`ud-reviews-tab ${selectedRating === star.toString() ? 'active' : ''}`}
                      onClick={() => setSelectedRating(star.toString())}
                    >
                      {star}⭐
                      <span className="ud-tab-count">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* REVIEWS LIST */}
              <div className="ud-reviews-list">
                {filteredReviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 24px', color: '#a8956b' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>No {selectedRating === 'all' ? 'reviews' : `${selectedRating}-star reviews`}</div>
                  </div>
                ) : (
                  filteredReviews.map((review, idx) => (
                    <div key={idx} className="ud-review-item">
                      <div className="ud-review-avatar-small">
                        {buildPhotoUrl(review.patientProfilePictureUrl) ? (
                          <img src={buildPhotoUrl(review.patientProfilePictureUrl)} alt={review.patientName} />
                        ) : (
                          review.patientName?.charAt(0).toUpperCase() || '👤'
                        )}
                      </div>
                      <div className="ud-review-content">
                        <div className="ud-review-header">
                          <div className="ud-review-specialist"><i>Specialist:</i> {review.specialistName}</div>
                          <div className="ud-review-rating-stars">{'⭐'.repeat(review.rating)}</div>
                        </div>
                        <div className="ud-review-service"><i>Service:</i> {review.serviceName}</div>
                        <div className="ud-review-text">{review.reviewText || '(No comment provided)'}</div>
                        <div className="ud-review-date">
                          {review.patientName} • {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        </div>  
      </div>
    </>
  );
}