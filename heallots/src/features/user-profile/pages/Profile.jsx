import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

export default function Profile({ setIsLoggedIn }) {
  const navigate   = useNavigate();
  const location   = useLocation();

  const raw  = localStorage.getItem('user');
  const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Patient';

  const getPhotoKey = () => `userPhoto_${user?.id}`;

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const [currentUser, setCurrentUser] = useState(user);

  // Helper: convert any stored profilePictureUrl format to a displayable URL
  const buildPhotoUrl = (val) => {
    if (!val) return null;
    if (val.startsWith('data:')) return val;               // base64 preview
    if (val.startsWith('http')) return val;                // already full URL
    // Filename from database — serve via backend endpoint
    return 'http://localhost:8080/api/user/profile-picture/' + val;
  };

  // Fetch latest user profile from backend on component mount
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get('http://localhost:8080/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) {
          setCurrentUser(response.data);
          // Update localStorage with latest user data
          localStorage.setItem('user', JSON.stringify(response.data));
          // Update form with latest data
          setForm({
            fullName: response.data?.fullName || '',
            email:    response.data?.email    || '',
            phone:    response.data?.phone    || '',
            birthday: response.data?.birthday || '',
            gender:   response.data?.gender   || '',
            address:  response.data?.address  || '',
          });
          // Update photo with latest profile picture URL from database
          if (response.data?.profilePictureUrl) {
            const photoUrl = buildPhotoUrl(response.data.profilePictureUrl);
            setPhoto(photoUrl);
            if (user?.id) {
              localStorage.setItem(getPhotoKey(), photoUrl);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch latest profile:', err);
        // Fall back to localStorage data
      }
    };
    fetchLatestProfile();
  }, []);

  const [photo, setPhoto] = useState(() => {
    // Prefer localStorage (already a full URL), fall back to DB value
    const stored  = localStorage.getItem(getPhotoKey());
    const fromDb  = currentUser?.profilePictureUrl || user?.profilePictureUrl;
    if (stored && !stored.startsWith('data:') && stored.startsWith('http')) return stored;
    const built = buildPhotoUrl(fromDb);
    // Sync localStorage so other pages can read it immediately
    if (built) localStorage.setItem(getPhotoKey(), built);
    return built || stored || null;
  });
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

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Photo must be under 5MB.'); return; }
    if (!file.type.startsWith('image/')) { setPhotoError('Please upload a valid image file.'); return; }
    setPhotoError('');
    setError('');

    // Show preview immediately via FileReader
    const reader = new FileReader();
    reader.onerror = () => setPhotoError('Failed to read file. Please try again.');
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setPhoto(dataUrl);
      localStorage.setItem(getPhotoKey(), dataUrl);

      // Upload to backend immediately
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(
          'http://localhost:8080/api/user/upload-profile-picture',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Backend now returns just the filename
        const filename = res.data?.profilePictureUrl || '';
        const fullUrl = filename
          ? 'http://localhost:8080/api/user/profile-picture/' + filename
          : dataUrl;

        // Persist full server URL everywhere
        setPhoto(fullUrl);
        localStorage.setItem(getPhotoKey(), fullUrl);
        const raw2 = localStorage.getItem('user');
        const u2   = raw2 && raw2 !== 'undefined' ? JSON.parse(raw2) : {};
        localStorage.setItem('user', JSON.stringify({ ...u2, profilePictureUrl: filename }));
      } catch (uploadErr) {
        console.error('Photo upload error:', uploadErr);
        // Keep base64 preview even if upload fails — will retry on Save
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    localStorage.removeItem(getPhotoKey());
  };

  const [form, setForm] = useState({
    fullName: currentUser?.fullName || user?.fullName || '',
    email:    currentUser?.email    || user?.email    || '',
    phone:    currentUser?.phone    || user?.phone    || '',
    birthday: currentUser?.birthday || user?.birthday || '',
    gender:   currentUser?.gender   || user?.gender   || '',
    address:  currentUser?.address  || user?.address  || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      
      // First, update profile data (without photo)
      const dataToSend = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        birthday: form.birthday,
        gender: form.gender,
        address: form.address,
      };
      
      const res = await axios.put('http://localhost:8080/api/user/profile', dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // If photo is still a base64 data URL (upload failed silently), retry upload now
      if (photo && photo.startsWith('data:')) {
        try {
          const response2 = await fetch(photo);
          const blob2 = await response2.blob();
          const formData2 = new FormData();
          formData2.append('file', blob2, 'profile-pic.jpg');
          const photoRes = await axios.post('http://localhost:8080/api/user/upload-profile-picture', formData2, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const filename = photoRes.data?.profilePictureUrl || '';
          const fullUrl2 = filename
            ? 'http://localhost:8080/api/user/profile-picture/' + filename
            : '';
          setPhoto(fullUrl2);
          localStorage.setItem(getPhotoKey(), fullUrl2);
          localStorage.setItem('user', JSON.stringify({ ...user, ...form, profilePictureUrl: filename }));
        } catch (photoErr) {
          console.error('Photo upload retry error:', photoErr);
        }
      } else {
        // Photo already uploaded or unchanged — just sync localStorage
        // Re-read user from localStorage to get the fresh profilePictureUrl
        const raw2 = localStorage.getItem('user');
        const u2 = raw2 && raw2 !== 'undefined' ? JSON.parse(raw2) : {};
        const filename = res.data?.profilePictureUrl || u2?.profilePictureUrl || '';
        const fullUrl3 = filename && !filename.startsWith('data:')
            ? 'http://localhost:8080/api/user/profile-picture/' + filename
          : filename || photo;
        localStorage.setItem(getPhotoKey(), fullUrl3 || '');
        localStorage.setItem('user', JSON.stringify({ ...u2, ...form, profilePictureUrl: filename }));
        if (fullUrl3) setPhoto(fullUrl3);
      }
      
      // Update form state with the response data
      setForm({
        fullName: res.data.fullName || form.fullName,
        email: res.data.email || form.email,
        phone: res.data.phone || form.phone,
        birthday: res.data.birthday || form.birthday,
        gender: res.data.gender || form.gender,
        address: res.data.address || form.address,
      });
      
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
    window.location.reload();
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

  const age = getAge(currentUser?.birthday || user?.birthday || form.birthday);

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
        .ud-admin-btn {
          background: #bbab81;
          border: none;
          color: #1c1408; border-radius: 20px; padding: 8px 18px;
          font-size: 12px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.18s;
          letter-spacing: 0.5px; text-transform: uppercase;
        }
        .ud-admin-btn:hover { background: #f59e0b; box-shadow: 0 4px 12px rgba(217,119,6,0.3); }

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
          cursor: pointer; font-size: 18px;
          color: #a8956b; padding: 0; line-height: 1;
          transition: color 0.18s, transform 0.18s;
        }
        .pf-pw-toggle:hover { color: #d97706; transform: translateY(-50%) scale(1.1); }
        .pf-pw-toggle:active { transform: translateY(-50%) scale(0.95); }
        
        /* Password Strength Indicator */
        .pf-strength-container {
          margin-top: 12px;
        }
        .pf-strength-bar {
          height: 6px;
          background: #e8ddd0;
          border-radius: 99px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }
        .pf-strength-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.3s ease, background 0.3s ease;
          box-shadow: 0 0 8px currentColor;
        }
        .pf-strength-label {
          font-size: 12px;
          font-weight: 700;
          margin-top: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .pf-pw-success {
          display: flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #f0fdf4, #f1fce4); border: 1px solid #bbf7d0;
          border-left: 4px solid #22c55e;
          border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;
          font-size: 14px; color: #15803d; font-weight: 600;
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Password Form Container */
        .pf-pw-form-content {
          background: linear-gradient(135deg, #fafaf8 0%, #f5f1e8 100%);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 0;
        }
        .pf-pw-field-group {
          margin-bottom: 16px;
        }
        .pf-pw-field-group:last-of-type {
          margin-bottom: 0;
        }
        
        /* Password Idle State */
        .pf-pw-idle-state {
          text-align: center;
          padding: 40px 24px;
          background: linear-gradient(135deg, #faf9f7 0%, #f3ede2 100%);
          border-radius: 12px;
          border: 2px dashed rgba(217,119,6,0.15);
        }
        .pf-pw-idle-state p {
          font-size: 14px;
          color: #78716c;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .pf-pw-idle-state .pf-edit-btn {
          padding: 12px 28px;
          font-size: 15px;
          box-shadow: 0 4px 14px rgba(217,119,6,0.3);
        }
        
        /* Password Input with Icon */
        .pf-pw-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .pf-pw-input-wrapper input {
          padding-right: 44px;
        }

        /* Form Groups */
        .pf-form-group {
          margin-bottom: 18px;
        }

        .pf-form-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #a8956b;
          margin-bottom: 8px;
        }

        .pf-form-group input,
        .pf-form-group select,
        .pf-form-group textarea {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e8ddd0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1c1408;
          background: #fff;
          outline: none;
          transition: border-color 0.18s;
        }

        .pf-form-group input:focus,
        .pf-form-group select:focus,
        .pf-form-group textarea:focus {
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
        }

        .pf-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .pf-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 16px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #fafaf8 0%, #f5f1e8 100%);
          border-radius: 10px;
          border: 1px solid rgba(217,119,6,0.08);
          transition: all 0.2s ease;
        }

        .pf-info-row:hover {
          background: linear-gradient(135deg, #f5f1e8 0%, #ede6da 100%);
          border-color: rgba(217,119,6,0.15);
          transform: translateX(4px);
        }

        .pf-info-row:last-child {
          margin-bottom: 0;
        }

        .pf-info-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #a8956b;
          font-weight: 700;
          min-width: 100px;
        }

        .pf-info-value {
          font-size: 15px;
          color: #1c1408;
          font-weight: 600;
          text-align: right;
          max-width: 60%;
        }

        .pf-card {
          background: #fff;
          border: 1.5px solid #f0e6d3;
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
          transition: all 0.3s ease;
        }

        .pf-card:hover {
          box-shadow: 0 8px 24px rgba(217,119,6,0.12);
          border-color: rgba(217,119,6,0.2);
        }

        .pf-card-title {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 700;
          color: #1c1408;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        /* Personal Info Form Content */
        .pf-info-form-content {
          background: linear-gradient(135deg, #fafaf8 0%, #f5f1e8 100%);
          border-radius: 12px;
          padding: 24px;
          margin: -28px -28px 0 -28px;
          border-top: 1px solid rgba(217,119,6,0.1);
        }
        
        .pf-info-editing-header {
          font-size: 12px;
          color: #d97706;
          background: rgba(217,119,6,0.08);
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          margin-bottom: 24px;
        }

        .pf-save-btn {
          background: linear-gradient(135deg, #d97706, #b45309);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 11px 24px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 3px 12px rgba(217,119,6,0.35);
        }

        .pf-save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(217,119,6,0.45);
        }

        .pf-save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .pf-hero-card {
            flex-direction: column;
            text-align: center;
            padding: 24px;
          }

          .pf-form-row {
            grid-template-columns: 1fr;
          }

          .pf-info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .ud-topbar {
            padding: 0 20px;
          }

          .ud-user-info {
            display: none;
          }
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
              <div className="ud-avatar" onClick={() => navigate('/profile')} title="View Profile" style={{ cursor: 'pointer' }}>
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
        <div className="pf-main">
          {/* PAGE HEADER */}
          <div className="pf-page-header">
            <div className="pf-page-header-left">
              <h1>My Profile</h1>
              <p>Manage your account information and preferences</p>
            </div>
            {!editing && (
              <button className="pf-edit-btn" onClick={() => setEditing(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {/* ALERTS */}
          {success && <div className="pf-success">✓ Changes saved successfully!</div>}
          {error && <div className="pf-error">✕ {error}</div>}

          {/* HERO CARD WITH PHOTO */}
          <div className="pf-hero-card">
            <div className="pf-hero-avatar">
              {photo ? (
                <img 
                  src={photo} 
                  alt="Profile"
                  onError={(e) => {
                    if (e.target && e.target.style) {
                      e.target.style.display = 'none';
                    }
                  }}
                />
              ) : null}
              {!photo && displayName.charAt(0).toUpperCase()}}
              <div className="pf-avatar-overlay">
                <span>Change</span>
                <span>Photo</span>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <div style={{ marginBottom: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#a8956b' }}>Welcome back</div>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px', lineHeight: 1.1 }}>{displayName}</h2>
              <p style={{ fontSize: '13px', color: '#a8956b', marginBottom: '12px' }}>Patient • Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'recently'}</p>
              {editing && (
                <div className="pf-photo-actions">
                  <label htmlFor="photo-input" className="pf-photo-upload-btn">
                    📤 Upload Photo
                    <input id="photo-input" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                  </label>
                  {photo && <button className="pf-photo-remove-btn" onClick={handleRemovePhoto}>Remove</button>}
                </div>
              )}
              {photoError && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px' }}>{photoError}</div>}
              <div className="pf-photo-hint">JPG, PNG or GIF • Max 5MB</div>
            </div>
          </div>

          {/* PROFILE INFORMATION CARD */}
          <div className="pf-card">
            <div className="pf-card-title">
              👤 Personal Information
              {editing && <span className="pf-info-editing-header">Editing Mode</span>}
            </div>

            {editing ? (
              <div className="pf-info-form-content">
                <div className="pf-form-row">
                  <div className="pf-form-group">
                    <label>👤 Full Name</label>
                    <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" />
                  </div>
                  <div className="pf-form-group">
                    <label>📧 Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email" />
                  </div>
                </div>
                <div className="pf-form-row">
                  <div className="pf-form-group">
                    <label>📱 Phone</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Enter your phone number" />
                  </div>
                  <div className="pf-form-group">
                    <label>🎂 Birthday</label>
                    <input type="date" name="birthday" value={form.birthday} onChange={handleChange} />
                  </div>
                </div>
                <div className="pf-form-row">
                  <div className="pf-form-group">
                    <label>⚥ Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange}>
                      <option value="">Select gender</option>
                      <option value="male">♂️ Male</option>
                      <option value="female">♀️ Female</option>
                      <option value="other">◎ Other</option>
                    </select>
                  </div>
                  <div className="pf-form-group">
                    <label>📍 Address</label>
                    <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Enter your address" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
                  <button className="pf-save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? '💾 Saving...' : '✓ Save Changes'}
                  </button>
                  <button className="pf-cancel-btn" onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div className="pf-info-row">
                  <span className="pf-info-label">👤 Full Name</span>
                  <span className="pf-info-value">{form.fullName || '—'}</span>
                </div>
                <div className="pf-info-row">
                  <span className="pf-info-label">📧 Email</span>
                  <span className="pf-info-value">{form.email || '—'}</span>
                </div>
                <div className="pf-info-row">
                  <span className="pf-info-label">📱 Phone</span>
                  <span className="pf-info-value">{form.phone || '—'}</span>
                </div>
                <div className="pf-info-row">
                  <span className="pf-info-label">🎂 Birthday</span>
                  <span className="pf-info-value">{formatBirthday(form.birthday)} {age && `(${age} years old)`}</span>
                </div>
                <div className="pf-info-row">
                  <span className="pf-info-label">⚥ Gender</span>
                  <span className="pf-info-value">{formatGender(form.gender)}</span>
                </div>
                <div className="pf-info-row">
                  <span className="pf-info-label">📍 Address</span>
                  <span className="pf-info-value">{form.address || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* PASSWORD CHANGE CARD */}
          <div className="pf-card">
            <div className="pf-card-title">
              🔐 Change Password
              {pwEditing && <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 600, background: 'rgba(217,119,6,0.1)', padding: '4px 12px', borderRadius: '6px' }}>EDITING</span>}
            </div>

            {pwSuccess && pwEditing === false && <div className="pf-pw-success">✅ Password changed successfully!</div>}

            {pwEditing ? (
              <div className="pf-pw-form-content">
                {pwError && <div className="pf-error" style={{ marginBottom: '20px' }}>⚠️ {pwError}</div>}

                <div className="pf-pw-field-group">
                  <div className="pf-form-group">
                    <label>Current Password</label>
                    <div className="pf-pw-input-wrapper">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        name="current"
                        value={pwForm.current}
                        onChange={handlePwChange}
                        placeholder="Enter your current password"
                      />
                      <button
                        className="pf-pw-toggle"
                        onClick={() => setShowCurrent(!showCurrent)}
                        type="button"
                        title={showCurrent ? 'Hide password' : 'Show password'}
                      >
                        {showCurrent ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pf-pw-field-group">
                  <div className="pf-form-group">
                    <label>New Password</label>
                    <div className="pf-pw-input-wrapper">
                      <input
                        type={showNew ? 'text' : 'password'}
                        name="newPass"
                        value={pwForm.newPass}
                        onChange={handlePwChange}
                        placeholder="Enter new password (min. 6 characters)"
                      />
                      <button
                        className="pf-pw-toggle"
                        onClick={() => setShowNew(!showNew)}
                        type="button"
                        title={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  {pwStr && (
                    <div className="pf-strength-container">
                      <div className="pf-strength-bar">
                        <div className="pf-strength-fill" style={{ width: pwStr.width, background: pwStr.color }}></div>
                      </div>
                      <div className="pf-strength-label" style={{ color: pwStr.color }}>
                        {pwStr.label === 'Too short' && '⚠️ Too short'}
                        {pwStr.label === 'Weak' && '📊 Weak'}
                        {pwStr.label === 'Fair' && '✓ Fair'}
                        {pwStr.label === 'Strong' && '✅ Strong'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pf-pw-field-group">
                  <div className="pf-form-group">
                    <label>Confirm New Password</label>
                    <div className="pf-pw-input-wrapper">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        name="confirm"
                        value={pwForm.confirm}
                        onChange={handlePwChange}
                        placeholder="Confirm new password"
                      />
                      <button
                        className="pf-pw-toggle"
                        onClick={() => setShowConfirm(!showConfirm)}
                        type="button"
                        title={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
                  <button className="pf-save-btn" onClick={handlePwSave} disabled={pwSaving}>
                    {pwSaving ? '⏳ Updating...' : '✓ Update Password'}
                  </button>
                  <button className="pf-cancel-btn" onClick={() => { setPwEditing(false); setPwForm({ current: '', newPass: '', confirm: '' }); setPwError(''); }} disabled={pwSaving}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="pf-pw-idle-state">
                <p>Keep your account secure by changing your password regularly. Choose a strong password with a mix of uppercase, numbers, and special characters.</p>
                <button className="pf-edit-btn" onClick={() => setPwEditing(true)}>
                  🔒 Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}