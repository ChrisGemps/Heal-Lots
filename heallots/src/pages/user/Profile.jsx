import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

export default function Profile({ setIsLoggedIn }) {
  const navigate   = useNavigate();
  const location   = useLocation();

  const raw  = localStorage.getItem('user');
  const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Patient';

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const [photo, setPhoto] = useState(() => localStorage.getItem('userPhoto') || null);
  const [photoError, setPhotoError] = useState('');

  const [pwForm, setPwForm] = useState({ current: '', newPass: '', confirm: '' });
  const [pwEditing,  setPwEditing]  = useState(false);
  const [pwSaving,   setPwSaving]   = useState(false);
  const [pwSuccess,  setPwSuccess]  = useState(false);
  const [pwError,    setPwError]    = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value });

  const handlePwSave = async () => {
    setPwError('');
    if (!pwForm.current) { setPwError('Please enter your current password.'); return; }
    if (pwForm.newPass.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (pwForm.newPass !== pwForm.confirm) { setPwError('New passwords do not match.'); return; }
    setPwSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:8080/api/user/change-password', {
        currentPassword: pwForm.current,
        newPassword:     pwForm.newPass,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPwSuccess(true);
      setPwEditing(false);
      setPwForm({ current: '', newPass: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 400 || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong')) {
        setPwError('Current password is incorrect.');
      } else {
        setPwError(msg || 'Failed to update password. Please try again.');
      }
    } finally {
      setPwSaving(false);
    }
  };

  const pwStrength = () => {
    const p = pwForm.newPass;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: '#ef4444', width: '25%' };
    if (p.length < 8) return { label: 'Weak',      color: '#f97316', width: '50%' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Fair', color: '#eab308', width: '70%' };
    return { label: 'Strong', color: '#22c55e', width: '100%' };
  };
  const pwStr = pwStrength();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setPhotoError('Photo must be under 3MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload a valid image file.');
      return;
    }
    setPhotoError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPhoto(dataUrl);
      localStorage.setItem('userPhoto', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    localStorage.removeItem('userPhoto');
  };

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
    birthday: user?.birthday || '',
    gender:   user?.gender   || '',
    address:  user?.address  || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:8080/api/user/profile', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = { ...user, ...form };
      localStorage.setItem('user', JSON.stringify(updated));
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (setIsLoggedIn) setIsLoggedIn(false);
    navigate('/', { replace: true });
  };

  const formatBirthday = (val) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return val; }
  };

  const formatGender = (val) => {
    if (!val) return '—';
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  const getAge = (birthday) => {
    if (!birthday) return null;
    const diff = Date.now() - new Date(birthday).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const age = getAge(user?.birthday || form.birthday);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .pf-wrap {
          min-height: 100vh;
          background: #fafaf8;
          font-family: 'DM Sans', sans-serif;
          color: #1c1408;
        }

        /* ── TOPBAR ── */
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
        .ud-topbar-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .ud-topbar-logo  { height: 55px; width: auto; filter: brightness(0) invert(1) drop-shadow(0 0 5px rgba(217,119,6,0.5)); }
        .ud-topbar-right { display: flex; align-items: center; gap: 16px; }
        .ud-topbar-nav   { display: flex; align-items: center; gap: 4px; }
        .ud-topbar-nav a {
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          color: #a8956b; text-decoration: none; padding: 7px 14px;
          border-radius: 8px; transition: all 0.18s;
        }
        .ud-topbar-nav a:hover, .ud-topbar-nav a.active { color: #fbbf24; background: rgba(217,119,6,0.12); }
        .ud-user-badge  { display: flex; align-items: center; gap: 10px; }
        .ud-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #d97706, #b45309);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: #fff;
          box-shadow: 0 2px 8px rgba(217,119,6,0.4);
          cursor: pointer;
          transition: box-shadow 0.18s;
        }
        .ud-avatar:hover { box-shadow: 0 4px 14px rgba(217,119,6,0.6); }
        .ud-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .ud-user-info { line-height: 1.2; }
        .ud-user-name { font-size: 14px; font-weight: 600; color: #e2c98a; }
        .ud-user-role { font-size: 12px; color: #a8956b; }
        .ud-logout-btn {
          background: rgba(217,119,6,0.12); border: 1px solid rgba(217,119,6,0.3);
          color: #fbbf24; border-radius: 8px; padding: 7px 16px;
          font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.18s;
        }
        .ud-logout-btn:hover { background: rgba(217,119,6,0.22); border-color: rgba(217,119,6,0.5); }

        /* ── MAIN ── */
        .pf-main {
          max-width: 860px;
          margin: 0 auto;
          padding: 40px 24px 64px;
        }

        /* ── PAGE HEADER ── */
        .pf-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .pf-page-header-left h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 800;
          color: #1c1408;
          line-height: 1.15;
          margin-bottom: 4px;
        }
        .pf-page-header-left p {
          font-size: 14px;
          color: #78716c;
          font-weight: 300;
        }
        .pf-edit-btn {
          background: linear-gradient(135deg, #d97706, #b45309);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 3px 12px rgba(217,119,6,0.35);
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .pf-edit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(217,119,6,0.45); }
        .pf-cancel-btn {
          background: transparent;
          color: #78716c;
          border: 1.5px solid #e8ddd0;
          border-radius: 10px;
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pf-cancel-btn:hover { border-color: #d97706; color: #d97706; }
        .pf-btn-group { display: flex; gap: 10px; }

        /* ── ALERTS ── */
        .pf-success {
          display: flex; align-items: center; gap: 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e;
          border-radius: 10px; padding: 13px 16px; margin-bottom: 22px;
          font-size: 14px; color: #15803d; font-weight: 500;
          animation: fadeIn 0.3s ease;
        }
        .pf-error {
          display: flex; align-items: center; gap: 10px;
          background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626;
          border-radius: 10px; padding: 13px 16px; margin-bottom: 22px;
          font-size: 14px; color: #dc2626; font-weight: 500;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        /* ── HERO CARD ── */
        .pf-hero-card {
          background: linear-gradient(135deg, #0f172a 0%, #1c1408 100%);
          border-radius: 20px;
          padding: 32px 36px;
          display: flex;
          align-items: center;
          gap: 28px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(217,119,6,0.2);
        }
        .pf-hero-card::before {
          content: '';
          position: absolute;
          right: -60px; bottom: -60px;
          width: 260px; height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(217,119,6,0.14), transparent 65%);
          pointer-events: none;
        }
        .pf-hero-avatar {
          width: 80px; height: 80px;
          background: linear-gradient(135deg, #d97706, #b45309);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif;
          font-size: 34px; font-weight: 700; color: #fff;
          box-shadow: 0 6px 20px rgba(217,119,6,0.45);
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          cursor: pointer;
          overflow: hidden;
        }
        .pf-hero-avatar img {
          width: 100%; height: 100%;
          object-fit: cover; border-radius: 50%;
        }
        .pf-avatar-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.55);
          border-radius: 50%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          font-size: 18px;
          gap: 2px;
          cursor: pointer;
        }
        .pf-avatar-overlay span {
          font-size: 10px; font-weight: 700;
          color: #fff; letter-spacing: 0.5px;
          font-family: 'DM Sans', sans-serif;
        }
        .pf-hero-avatar:hover .pf-avatar-overlay { opacity: 1; }
        .pf-photo-actions {
          display: flex; align-items: center; gap: 10px;
          margin-top: 12px;
        }
        .pf-photo-upload-btn {
          background: rgba(217,119,6,0.15);
          border: 1px solid rgba(217,119,6,0.35);
          color: #fbbf24;
          border-radius: 8px; padding: 7px 14px;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.18s;
          display: flex; align-items: center; gap: 6px;
        }
        .pf-photo-upload-btn:hover { background: rgba(217,119,6,0.25); }
        .pf-photo-remove-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: #a8956b;
          border-radius: 8px; padding: 7px 14px;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.18s;
        }
        .pf-photo-remove-btn:hover { border-color: #ef4444; color: #ef4444; }
        .pf-photo-hint {
          font-size: 12px; color: #a8956b; margin-top: 6px; font-weight: 300;
        }
        .pf-pw-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; font-size: 16px;
          color: #a8956b; padding: 0; line-height: 1;
        }
        .pf-pw-toggle:hover { color: #d97706; }
        .pf-strength-bar  { margin-top: 7px; height: 4px; background: #e8ddd0; border-radius: 99px; overflow: hidden; }
        .pf-strength-fill { height: 100%; border-radius: 99px; transition: width 0.3s, background 0.3s; }
        .pf-strength-label { font-size: 11px; font-weight: 600; margin-top: 4px; }
        .pf-pw-success {
          display: flex; align-items: center; gap: 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e;
          border-radius: 10px; padding: 13px 16px; margin-bottom: 16px;
          font-size: 14px; color: #15803d; font-weight: 500;
          animation: fadeIn 0.3s ease;
        }
        .pf-pw-error {
          display: flex; align-items: center; gap: 10px;
          background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626;
          border-radius: 10px; padding: 13px 16px; margin-bottom: 16px;
          font-size: 14px; color: #dc2626; font-weight: 500;
        }
        .pf-photo-error {
          font-size: 12px; color: #ef4444; margin-top: 6px; font-weight: 500;
        }
        .pf-hero-info { position: relative; z-index: 1; }
        .pf-hero-name {
          font-family: 'Fraunces', serif;
          font-size: 26px; font-weight: 800;
          color: #fff; line-height: 1.15;
          margin-bottom: 6px;
        }
        .pf-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .pf-hero-chip {
          font-size: 13px;
          color: #a8956b;
          background: rgba(217,119,6,0.1);
          border: 1px solid rgba(217,119,6,0.2);
          border-radius: 100px;
          padding: 4px 12px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* ── SECTION CARD ── */
        .pf-card {
          background: #fff;
          border: 1.5px solid #f0e6d3;
          border-radius: 18px;
          padding: 28px 32px;
          margin-bottom: 20px;
        }
        .pf-card-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.4px;
          color: #d97706;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pf-card-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #f0e6d3;
        }

        /* ── FIELD GRID ── */
        .pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 28px; }
        .pf-grid-full { grid-column: 1 / -1; }

        /* ── VIEW MODE ── */
        .pf-field-view label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #a8956b;
          margin-bottom: 5px;
        }
        .pf-field-view .pf-value {
          font-size: 15px;
          font-weight: 500;
          color: #1c1408;
          line-height: 1.5;
        }
        .pf-value-empty { color: #c4a96b; font-style: italic; font-weight: 300; }

        /* ── EDIT MODE ── */
        .pf-field-edit label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #44291a;
          margin-bottom: 7px;
        }
        .pf-field-edit input,
        .pf-field-edit select,
        .pf-field-edit textarea {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e8ddd0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1c1408;
          background: #fff;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
          appearance: none;
        }
        .pf-field-edit select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a8956b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          padding-right: 36px; cursor: pointer;
        }
        .pf-field-edit textarea { resize: vertical; min-height: 72px; }
        .pf-field-edit input:focus,
        .pf-field-edit select:focus,
        .pf-field-edit textarea:focus { border-color: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.12); }

        /* ── SAVE BTN ── */
        .pf-save-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #d97706, #b45309);
          border: none; border-radius: 10px;
          color: #fff; font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(217,119,6,0.4);
          margin-top: 8px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .pf-save-btn:hover:not(:disabled) { background: linear-gradient(135deg, #f59e0b, #d97706); transform: translateY(-1px); }
        .pf-save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .pf-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .pf-grid { grid-template-columns: 1fr; }
          .ud-topbar { padding: 0 20px; }
          .ud-user-info { display: none; }
          .pf-hero-card { flex-direction: column; align-items: flex-start; gap: 16px; padding: 24px 20px; }
          .pf-card { padding: 22px 20px; }
          .pf-page-header { flex-direction: column; align-items: flex-start; gap: 14px; }
        }
      `}</style>

      <div className="pf-wrap">

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
              <div className="ud-avatar" onClick={() => navigate('/profile')} title="View Profile">
                {photo
                  ? <img src={photo} alt="Profile" />
                  : displayName.charAt(0).toUpperCase()
                }
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
        <div className="pf-main">

          {/* PAGE HEADER */}
          <div className="pf-page-header">
            <div className="pf-page-header-left">
              <h1>My Profile</h1>
              <p>View and manage your personal information</p>
            </div>
            {!editing ? (
              <button className="pf-edit-btn" onClick={() => { setEditing(true); setError(''); setSuccess(false); }}>
                ✏️ Edit Profile
              </button>
            ) : (
              <div className="pf-btn-group">
                <button className="pf-cancel-btn" onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
              </div>
            )}
          </div>

          {/* ALERTS */}
          {success && <div className="pf-success">✅ Profile updated successfully!</div>}
          {error   && <div className="pf-error">⚠️ {error}</div>}

          {/* HERO CARD */}
          <div className="pf-hero-card">
            <div className="pf-hero-avatar" onClick={() => document.getElementById('pf-photo-input').click()}>
              {photo
                ? <img src={photo} alt="Profile" />
                : displayName.charAt(0).toUpperCase()
              }
              <div className="pf-avatar-overlay">
                📷
                <span>Change</span>
              </div>
            </div>
            <input
              id="pf-photo-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            <div className="pf-hero-info">
              <div className="pf-hero-name">{form.fullName || displayName}</div>
              <div className="pf-photo-actions">
                <button className="pf-photo-upload-btn" onClick={() => document.getElementById('pf-photo-input').click()}>
                {photo ? 'Change Photo' : 'Upload Photo'}
                </button>
                {photo && (
                  <button className="pf-photo-remove-btn" onClick={handleRemovePhoto}>
                    Remove
                  </button>
                )}
              </div>
              {photoError && <div className="pf-photo-error">⚠️ {photoError}</div>}
              {!photoError && <div className="pf-photo-hint">JPG, PNG · Max 3MB · Click avatar to change</div>}
              <div className="pf-hero-meta" style={{marginTop:'10px'}}>
                {form.email    && <span className="pf-hero-chip">Email: {form.email}</span>}
                {age           && <span className="pf-hero-chip">Age: {age} yrs old</span>}
                {form.gender   && <span className="pf-hero-chip">Gender: {form.gender === 'male' ? '♂️' : '♀️'} {formatGender(form.gender)}</span>}
                <span className="pf-hero-chip">Status: Patient</span>
              </div>
            </div>
          </div>

          {/* ACCOUNT INFO */}
          <div className="pf-card">
            <div className="pf-card-title">Account Info</div>
            <div className="pf-grid">

              {/* Full Name */}
              {editing ? (
                <div className="pf-field-edit">
                  <label>Full Name</label>
                  <input name="fullName" type="text" value={form.fullName}
                    placeholder="Pedro dela Cruz" onChange={handleChange} />
                </div>
              ) : (
                <div className="pf-field-view">
                  <label>Full Name</label>
                  <div className="pf-value">{form.fullName || <span className="pf-value-empty">Not set</span>}</div>
                </div>
              )}

              {/* Email */}
              {editing ? (
                <div className="pf-field-edit">
                  <label>Email Address</label>
                  <input name="email" type="email" value={form.email}
                    placeholder="heallots@gmail.com" onChange={handleChange} />
                </div>
              ) : (
                <div className="pf-field-view">
                  <label>Email Address</label>
                  <div className="pf-value">{form.email || <span className="pf-value-empty">Not set</span>}</div>
                </div>
              )}

            </div>
          </div>

          {/* PERSONAL INFO */}
          <div className="pf-card">
            <div className="pf-card-title">Personal Info</div>
            <div className="pf-grid">

              {/* Phone */}
              {editing ? (
                <div className="pf-field-edit">
                  <label>Phone Number</label>
                  <input name="phone" type="tel" value={form.phone}
                    placeholder="09XX XXX XXXX" onChange={handleChange} />
                </div>
              ) : (
                <div className="pf-field-view">
                  <label>Phone Number</label>
                  <div className="pf-value">{form.phone || <span className="pf-value-empty">Not set</span>}</div>
                </div>
              )}

              {/* Birthday */}
              {editing ? (
                <div className="pf-field-edit">
                  <label>Birthday</label>
                  <input name="birthday" type="date" value={form.birthday} onChange={handleChange} />
                </div>
              ) : (
                <div className="pf-field-view">
                  <label>Birthday</label>
                  <div className="pf-value">
                    {form.birthday
                      ? `${formatBirthday(form.birthday)}${age ? ` (${age} years old)` : ''}`
                      : <span className="pf-value-empty">Not set</span>
                    }
                  </div>
                </div>
              )}

              {/* Gender */}
              {editing ? (
                <div className="pf-field-edit">
                  <label>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              ) : (
                <div className="pf-field-view">
                  <label>Gender</label>
                  <div className="pf-value">{formatGender(form.gender) !== '—' ? formatGender(form.gender) : <span className="pf-value-empty">Not set</span>}</div>
                </div>
              )}

              {/* Address — full width */}
              {editing ? (
                <div className="pf-field-edit pf-grid-full">
                  <label>Address</label>
                  <textarea name="address" value={form.address}
                    placeholder="Street, Barangay, City, Province" onChange={handleChange} />
                </div>
              ) : (
                <div className="pf-field-view pf-grid-full">
                  <label>Address</label>
                  <div className="pf-value">{form.address || <span className="pf-value-empty">Not set</span>}</div>
                </div>
              )}

            </div>

            {/* Save button shown inside card when editing */}
            {editing && (
              <button className="pf-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="pf-spinner" /> Saving...</> : ' Save Changes'}
              </button>
            )}
          </div>

          {/* PASSWORD */}
          <div className="pf-card">
            <div className="pf-card-title">Security</div>

            {pwSuccess && <div className="pf-pw-success">✅ Password updated successfully!</div>}
            {pwEditing && pwError && <div className="pf-pw-error">⚠️ {pwError}</div>}

            {!pwEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="pf-field-view">
                    <label>Password</label>
                    <div className="pf-value" style={{ letterSpacing: '3px', fontSize: '18px' }}>••••••••</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#a8956b', marginTop: '4px', fontWeight: 300 }}>
                    Last changed: unknown
                  </div>
                </div>
                <button className="pf-edit-btn" style={{ flexShrink: 0 }}
                  onClick={() => { setPwEditing(true); setPwError(''); setPwSuccess(false); }}>
                  🔑 Change Password
                </button>
              </div>
            ) : (
              <div>
                {/* Current Password */}
                <div className="pf-field-edit" style={{ marginBottom: '14px' }}>
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      name="current"
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={pwForm.current}
                      onChange={handlePwChange}
                      style={{ paddingRight: '42px' }}
                    />
                    <button type="button" className="pf-pw-toggle" onClick={() => setShowCurrent(p => !p)}>
                      {showCurrent ? '👁👁' : '◡.◡'}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="pf-field-edit" style={{ marginBottom: '6px' }}>
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      name="newPass"
                      type={showNew ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={pwForm.newPass}
                      onChange={handlePwChange}
                      style={{ paddingRight: '42px' }}
                    />
                    <button type="button" className="pf-pw-toggle" onClick={() => setShowNew(p => !p)}>
                      {showNew ? '👁👁' : '◡.◡'}
                    </button>
                  </div>
                  {pwStr && (
                    <>
                      <div className="pf-strength-bar">
                        <div className="pf-strength-fill" style={{ width: pwStr.width, background: pwStr.color }} />
                      </div>
                      <div className="pf-strength-label" style={{ color: pwStr.color }}>{pwStr.label}</div>
                    </>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="pf-field-edit" style={{ marginBottom: '20px', marginTop: '14px' }}>
                  <label>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      name="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={pwForm.confirm}
                      onChange={handlePwChange}
                      style={{ paddingRight: '42px' }}
                    />
                    <button type="button" className="pf-pw-toggle" onClick={() => setShowConfirm(p => !p)}>
                      {showConfirm ? '👁👁' : '◡.◡'}
                    </button>
                  </div>
                  {pwForm.confirm && pwForm.newPass && (
                    <div style={{
                      fontSize: '12px', fontWeight: 600, marginTop: '5px',
                      color: pwForm.confirm === pwForm.newPass ? '#22c55e' : '#ef4444'
                    }}>
                      {pwForm.confirm === pwForm.newPass ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}
                </div>

                <div className="pf-btn-group">
                  <button className="pf-save-btn" onClick={handlePwSave} disabled={pwSaving} style={{ flex: 1 }}>
                    {pwSaving ? <><div className="pf-spinner" /> Updating...</> : ' Update Password'}
                  </button>
                  <button className="pf-cancel-btn"
                    onClick={() => { setPwEditing(false); setPwError(''); setPwForm({ current: '', newPass: '', confirm: '' }); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}