import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const services = [
  { icon: '🤲🏻', title: 'Traditional Hilot',  desc: 'Ancient Filipino healing massage using oils and skilled hands to restore energy flow.', tag: 'Most Popular', color: '#fef3c7', accent: '#d97706' },
  { icon: '🌿', title: 'Herbal Compress',    desc: 'Warm herbal bundle massage that soothes sore muscles and relieves tension.',            tag: 'Best for Pain', color: '#dcfce7', accent: '#16a34a' },
  { icon: '💆🏻‍♀️', title: 'Head & Neck Relief', desc: 'Focused pressure techniques on the head, neck, and shoulders for deep relaxation.',     tag: 'Stress Relief', color: '#ede9fe', accent: '#7c3aed' },
  { icon: '🦶🏼', title: 'Foot Reflexology',   desc: 'Traditional pressure-point therapy on the feet to heal the whole body.',               tag: 'Walk-in',       color: '#fce7f3', accent: '#db2777' },
  { icon: '🫙', title: 'Hot Oil Massage',    desc: 'Deep-tissue massage with warm coconut or essential oils for full-body relief.',         tag: 'New',           color: '#ffedd5', accent: '#ea580c' },
  { icon: '🧘🏻', title: 'Whole-Body Hilot',   desc: 'Full-body session combining multiple hilot techniques for total wellness.',             tag: 'Premium',       color: '#e0f2fe', accent: '#0284c7' },
];

const stats = [
  { value: '2,000+', label: 'Sessions Done' },
  { value: '6',    label: 'Local Specialists' },
  { value: '100%',   label: 'Traditional Methods' },
  { value: '10+',    label: 'Years of Practice' },
];

export default function Home({ isLoggedIn, setIsLoggedIn }) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .hl-home { font-family: 'DM Sans', sans-serif; background: #fafaf8; min-height: 100vh; color: #1c1408; }
        .hl-hero { position: relative; overflow: hidden; background: linear-gradient(145deg, #0f172a 0%, #1c1408 55%, #2d1a04 100%); padding: 88px 40px 108px; text-align: center; }
        .hl-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 70% 60% at 50% 110%, rgba(217,119,6,0.22) 0%, transparent 70%), radial-gradient(circle at 85% 15%, rgba(251,191,36,0.08) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(14,165,233,0.07) 0%, transparent 40%); pointer-events: none; }
        .hl-hero::after { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(217,119,6,0.03) 80px, rgba(217,119,6,0.03) 81px); pointer-events: none; }
        .hl-hero-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(217,119,6,0.15); border: 1px solid rgba(217,119,6,0.35); color: #fbbf24; font-size: 13px; font-weight: 500; padding: 6px 16px; border-radius: 100px; margin-bottom: 28px; letter-spacing: 0.5px; position: relative; z-index: 1; }
        .hl-hero-pill span { width: 7px; height: 7px; background: #f59e0b; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
        .hl-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(42px, 6vw, 72px); font-weight: 900; line-height: 1.05; color: #ffffff; margin-bottom: 20px; position: relative; z-index: 1; }
        .hl-hero h1 em { font-style: italic; color: #fbbf24; }
        .hl-hero p { font-size: 18px; color: #a8956b; max-width: 520px; margin: 0 auto 40px; line-height: 1.75; font-weight: 300; position: relative; z-index: 1; }
        .hl-hero-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
        .hl-btn-primary { background: linear-gradient(135deg, #d97706, #b45309); color: #fff; border: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(217,119,6,0.45); }
        .hl-btn-primary:hover { background: linear-gradient(135deg, #f59e0b, #d97706); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(217,119,6,0.55); }
        .hl-btn-outline { background: transparent; color: #e2c98a; border: 1px solid rgba(217,119,6,0.35); padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .hl-btn-outline:hover { background: rgba(217,119,6,0.1); border-color: rgba(217,119,6,0.6); }
        .hl-stats { display: grid; grid-template-columns: repeat(4, 1fr); background: #ffffff; border-bottom: 1px solid #f0e6d3; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
        .hl-stat { padding: 28px 20px; text-align: center; border-right: 1px solid #f0e6d3; }
        .hl-stat:last-child { border-right: none; }
        .hl-stat-value { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 700; color: #d97706; line-height: 1; margin-bottom: 6px; }
        .hl-stat-label { font-size: 13px; color: #78716c; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .hl-section { padding: 80px 40px; max-width: 1100px; margin: 0 auto; }
        .hl-section-header { text-align: center; margin-bottom: 52px; }
        .hl-section-tag { display: inline-block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #d97706; margin-bottom: 14px; }
        .hl-section-header h2 { font-family: 'Fraunces', serif; font-size: clamp(30px, 4vw, 44px); font-weight: 700; color: #1c1408; margin-bottom: 14px; line-height: 1.15; }
        .hl-section-header p { font-size: 16px; color: #78716c; max-width: 480px; margin: 0 auto; line-height: 1.7; }
        .hl-services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .hl-card { background: #ffffff; border-radius: 18px; padding: 28px; border: 1.5px solid #f0e6d3; cursor: pointer; transition: all 0.25s ease; position: relative; overflow: hidden; }
        .hl-card:hover { transform: translateY(-4px); border-color: transparent; }
        .hl-card-icon-wrap { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 18px; transition: transform 0.25s; }
        .hl-card:hover .hl-card-icon-wrap { transform: scale(1.1); }
        .hl-card-tag { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 100px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .hl-card h3 { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: #1c1408; margin-bottom: 8px; }
        .hl-card p { font-size: 14px; color: #78716c; line-height: 1.6; margin-bottom: 20px; }
        .hl-card-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; border: none; background: none; cursor: pointer; padding: 0; transition: gap 0.2s; }
        .hl-card:hover .hl-card-btn { gap: 10px; }
        .hl-contact { background: linear-gradient(145deg, #0f172a 0%, #1c1408 100%); padding: 80px 40px; position: relative; overflow: hidden; border-top: 1px solid rgba(217,119,6,0.2); }
        .hl-contact::before { content: ''; position: absolute; right: -80px; bottom: -80px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(217,119,6,0.12), transparent 70%); pointer-events: none; }
        .hl-contact-inner { max-width: 1100px; margin: 0 auto; }
        .hl-contact-header { text-align: center; margin-bottom: 52px; }
        .hl-contact-header .hl-section-tag { color: #fbbf24; }
        .hl-contact-header h2 { font-family: 'Fraunces', serif; font-size: clamp(28px, 4vw, 40px); font-weight: 700; color: #ffffff; margin-bottom: 10px; }
        .hl-contact-header p { font-size: 15px; color: #a8956b; }
        .hl-contact-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .hl-contact-card { background: rgba(217,119,6,0.07); border: 1px solid rgba(217,119,6,0.18); border-radius: 16px; padding: 28px 24px; transition: background 0.2s, transform 0.2s; }
        .hl-contact-card:hover { background: rgba(217,119,6,0.13); transform: translateY(-3px); }
        .hl-contact-icon { width: 44px; height: 44px; background: rgba(217,119,6,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 16px; }
        .hl-contact-card h4 { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #fbbf24; margin-bottom: 8px; }
        .hl-contact-card p { font-family: 'DM Sans', sans-serif; font-size: 15px; color: #e2c98a; line-height: 1.6; font-weight: 400; }
        .hl-contact-card p span { display: block; color: #a8956b; font-size: 13px; margin-top: 2px; }

        /* ── USER TOPBAR (shown when logged in) ── */
        .hl-user-topbar {
          background: linear-gradient(135deg, #0f172a 0%, #1c1408 100%);
          border-bottom: 1px solid rgba(217,119,6,0.2);
          padding: 0 40px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
        }
        .hl-user-topbar-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .hl-user-topbar-logo  { height: 55px; width: auto; filter: brightness(0) invert(1) drop-shadow(0 0 5px rgba(217,119,6,0.5)); }
        .hl-user-topbar-right { display: flex; align-items: center; gap: 16px; }
        .hl-user-topbar-nav   { display: flex; align-items: center; gap: 4px; }
        .hl-user-topbar-nav a {
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          color: #a8956b; text-decoration: none; padding: 7px 14px;
          border-radius: 8px; transition: all 0.18s;
        }
        .hl-user-topbar-nav a:hover,
        .hl-user-topbar-nav a.active { color: #fbbf24; background: rgba(217,119,6,0.12); }
        .hl-user-badge { display: flex; align-items: center; gap: 10px; }
        .hl-user-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #d97706, #b45309);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: #fff;
          box-shadow: 0 2px 8px rgba(217,119,6,0.4);
          cursor: pointer; overflow: hidden;
        }
        .hl-user-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .hl-user-info  { line-height: 1.2; }
        .hl-user-name  { font-size: 14px; font-weight: 600; color: #e2c98a; }
        .hl-user-role  { font-size: 12px; color: #a8956b; }
        .hl-user-logout-btn {
          background: rgba(217,119,6,0.12); border: 1px solid rgba(217,119,6,0.3);
          color: #fbbf24; border-radius: 8px; padding: 7px 16px;
          font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.18s;
        }
        .hl-user-logout-btn:hover { background: rgba(217,119,6,0.22); border-color: rgba(217,119,6,0.5); }
        @media (max-width: 768px) {
          .hl-user-topbar { padding: 0 20px; }
          .hl-user-info { display: none; }
          .hl-user-topbar-nav a { padding: 7px 10px; font-size: 13px; }
        }
        @media (max-width: 768px) {
          .hl-stats { grid-template-columns: repeat(2, 1fr); }
          .hl-services-grid { grid-template-columns: 1fr; }
          .hl-section { padding: 52px 20px; }
          .hl-contact { padding: 52px 20px; }
          .hl-contact-grid { grid-template-columns: repeat(2, 1fr); }
          .hl-hero { padding: 64px 20px 84px; }
        }
      `}</style>

      {/* USER TOPBAR — shown when logged in, replaces public Navbar */}
      {isLoggedIn && (
        <div className="hl-user-topbar">
          <div className="hl-user-topbar-brand" onClick={() => navigate('/dashboard')}>
            <img src="/logo.png" alt="Heal Lots" className="hl-user-topbar-logo" />
          </div>
          <div className="hl-user-topbar-right">
            <nav className="hl-user-topbar-nav">
              <Link to="/dashboard"    className={location.pathname === '/dashboard'    ? 'active' : ''}>Dashboard</Link>
              <Link to="/book"         className={location.pathname === '/book'         ? 'active' : ''}>Book Session</Link>
              <Link to="/appointments" className={location.pathname === '/appointments' ? 'active' : ''}>My Appointments</Link>
            </nav>
            <div className="hl-user-badge">
              <div className="hl-user-avatar" onClick={() => navigate('/profile')} title="View Profile">
                {photo ? <img src={photo} alt="Profile" /> : displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hl-user-info">
                <div className="hl-user-name">{displayName}</div>
                <div className="hl-user-role">Patient</div>
              </div>
            </div>
            <button className="hl-user-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      )}

      <div className="hl-home">

        {/* HERO */}
        <section className="hl-hero">
          <div className="hl-hero-pill"><span /> Now accepting new patients</div>
          <h1>Heal Through the<br />Power of <em>Hilot</em></h1>
          <p>Traditional Filipino massage by skilled local specialists — restoring balance, easing pain, and bringing you back to wellness.</p>
          <div className="hl-hero-btns">
            <button className="hl-btn-primary" onClick={() => navigate(isLoggedIn ? '/book' : '/login')}>Book a Session</button>
            <button className="hl-btn-outline" onClick={() => navigate(isLoggedIn ? '/appointments' : '/login')}>My Appointments</button>
          </div>
        </section>

        {/* STATS */}
        <div className="hl-stats">
          {stats.map(s => (
            <div className="hl-stat" key={s.label}>
              <div className="hl-stat-value">{s.value}</div>
              <div className="hl-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* SERVICES — id="services" lets UserDashboard scroll here directly */}
        <section className="hl-section">
          <div className="hl-section-header">
            <div className="hl-section-tag">Our Services</div>
            <h2>What Healing Can<br />We Offer You Today?</h2>
            <p id="services">Each session is guided by experienced hilot practitioners using generations-old techniques.</p>
          </div>
          <div className="hl-services-grid">
            {services.map((svc, i) => (
              <div
                key={svc.title}
                className="hl-card"
                style={{
                  boxShadow: hoveredCard === i ? `0 16px 40px ${svc.accent}22` : '',
                  borderColor: hoveredCard === i ? svc.accent + '55' : '',
                }}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigate(isLoggedIn ? '/book' : '/login', isLoggedIn ? { state: { preselect: svc.title } } : undefined)}
              >
                <div className="hl-card-icon-wrap" style={{ background: svc.color }}>{svc.icon}</div>
                <div className="hl-card-tag" style={{ background: svc.color, color: svc.accent }}>{svc.tag}</div>
                <h3>{svc.title}</h3>
                <p>{svc.desc}</p>
                <button className="hl-card-btn" style={{ color: svc.accent }}>Book Now →</button>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: svc.accent, borderRadius: '0 0 18px 18px', opacity: hoveredCard === i ? 1 : 0, transition: 'opacity 0.25s' }} />
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section className="hl-contact">
          <div className="hl-contact-inner">
            <div className="hl-contact-header">
              <div className="hl-section-tag">Find Us</div>
              <h2>Contact & Clinic Info</h2>
              <p>Visit us or reach out — we're always happy to help.</p>
            </div>
            <div className="hl-contact-grid">
              <div className="hl-contact-card">
                <div className="hl-contact-icon">📞</div>
                <h4>Phone</h4>
                <p>+63 991 228 9562<span>Main line</span></p>
              </div>
              <div className="hl-contact-card">
                <div className="hl-contact-icon">📍</div>
                <h4>Address</h4>
                <p>67 Katres Street<span>Mandaue City, Cebu, Philippines</span></p>
              </div>
              <div className="hl-contact-card">
                <div className="hl-contact-icon">✉️</div>
                <h4>Email</h4>
                <p>heallots@gmail.com<span>We reply within 24 hours</span></p>
              </div>
              <div className="hl-contact-card">
                <div className="hl-contact-icon">🕐</div>
                <h4>Operating Hours</h4>
                <p>Mon – Sun: 8AM – 6PM<span>24/7 Upon Emergency</span></p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}