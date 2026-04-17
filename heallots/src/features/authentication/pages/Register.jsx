import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    phone: '', birthday: '', gender: '', address: '',
  });
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Strip non-digits, cap at 11 digits
      const digits = value.replace(/\D/g, '').slice(0, 11);
      // Auto-format: XXXX XXX XXXX
      let formatted = digits;
      if (digits.length > 7)      formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7);
      else if (digits.length > 4) formatted = digits.slice(0, 4) + ' ' + digits.slice(4);
      setForm({ ...form, phone: formatted });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/auth/register', {
        fullName: form.fullName,
        email:    form.email,
        password: form.password,
        phone:    form.phone,
        birthday: form.birthday,
        gender:   form.gender,
        address:  form.address,
      });
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err.response?.status, err.response?.data, err.message);
      // Use the actual error message from backend first
      const backendMessage = err.response?.data?.message;
      if (backendMessage) {
        setError(backendMessage);
      } else if (err.response?.status === 409) {
        setError('An account with this email already exists.');
      } else {
        setError(`Registration failed: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: '#ef4444', width: '25%' };
    if (p.length < 8) return { label: 'Weak',      color: '#f97316', width: '50%' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Fair', color: '#eab308', width: '70%' };
    return { label: 'Strong', color: '#22c55e', width: '100%' };
  };

  const strength = passwordStrength();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        .hl-auth-wrap { min-height: 100vh; display: flex; font-family: 'DM Sans', sans-serif; background: #fafaf8; }

        .hl-auth-left {
          width: 44%; background: linear-gradient(145deg, #0f172a 0%, #1c1408 55%, #2d1a04 100%);
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          padding: 60px 48px; position: relative; overflow: hidden;
          border-right: 1px solid rgba(217,119,6,0.15);
          position: sticky; top: 0; height: 100vh;
        }
        .hl-auth-left::before { content: ''; position: absolute; bottom: -100px; left: -100px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(217,119,6,0.18), transparent 65%); }
        .hl-auth-left::after  { content: ''; position: absolute; top: -60px; right: -60px; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(14,165,233,0.07), transparent 65%); }

        .hl-auth-brand { margin-bottom: 10px; position: relative; z-index: 1; }
        .hl-auth-brand-icon { height: 150px; width: auto; filter: brightness(0) invert(1) drop-shadow(0 0 8px rgba(217,119,6,0.7)); }

        .hl-auth-left-body { position: relative; z-index: 1; text-align: center; }
        .hl-auth-left-body h2 { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 800; color: #fff; line-height: 1.15; margin-bottom: 16px; }
        .hl-auth-left-body h2 em { font-style: italic; color: #fbbf24; }
        .hl-auth-left-body p { font-size: 15px; color: #a8956b; line-height: 1.75; font-weight: 300; max-width: 300px; margin: 0 auto 40px; }

        .hl-auth-features { list-style: none; display: flex; flex-direction: column; gap: 14px; text-align: left; }
        .hl-auth-features li { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #c4a96b; }
        .hl-auth-features li .dot { width: 30px; height: 30px; background: rgba(217,119,6,0.2); border: 1px solid rgba(217,119,6,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }

        .hl-auth-right { flex: 1; display: flex; justify-content: center; padding: 48px 40px; overflow-y: auto; background: #fafaf8; align-items: flex-start; }
        .hl-auth-card  { width: 100%; max-width: 460px; }

        .hl-auth-card-header { margin-bottom: 26px; }
        .hl-auth-card-header h3 { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 800; color: #1c1408; margin-bottom: 6px; }
        .hl-auth-card-header p  { font-size: 14px; color: #78716c; }

        .hl-section-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0 16px; }
        .hl-section-divider span { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #d97706; white-space: nowrap; }
        .hl-section-divider::before, .hl-section-divider::after { content: ''; flex: 1; height: 1px; background: #f0e6d3; }

        .hl-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .hl-auth-error { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626; border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; font-size: 13px; color: #dc2626; font-weight: 500; }

        .hl-field { margin-bottom: 14px; }
        .hl-field label { display: block; font-size: 13px; font-weight: 600; color: #44291a; margin-bottom: 7px; letter-spacing: 0.2px; }
        .hl-field-wrap { position: relative; }

        .hl-field input,
        .hl-field select,
        .hl-field textarea {
          width: 100%; padding: 11px 14px;
          border: 1.5px solid #e8ddd0; border-radius: 10px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #1c1408; background: #fff; outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
          appearance: none;
        }
        .hl-field select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a8956b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          padding-right: 36px; cursor: pointer;
        }
        .hl-field textarea { resize: vertical; min-height: 72px; }
        .hl-field input:focus,
        .hl-field select:focus,
        .hl-field textarea:focus { border-color: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.12); }
        .hl-field input.has-toggle { padding-right: 46px; }

        .hl-toggle-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 17px; color: #000000; padding: 0; line-height: 1; }

        .hl-strength-bar   { margin-top: 8px; height: 4px; background: #e8ddd0; border-radius: 99px; overflow: hidden; }
        .hl-strength-fill  { height: 100%; border-radius: 99px; transition: width 0.3s, background 0.3s; }
        .hl-strength-label { font-size: 11px; font-weight: 600; margin-top: 4px; }

        .hl-auth-submit { width: 100%; padding: 13px; background: linear-gradient(135deg, #d97706, #b45309); border: none; border-radius: 10px; color: #fff; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 16px rgba(217,119,6,0.4); margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .hl-auth-submit:hover:not(:disabled) { background: linear-gradient(135deg, #f59e0b, #d97706); transform: translateY(-1px); box-shadow: 0 6px 22px rgba(217,119,6,0.5); }
        .hl-auth-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .hl-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .hl-auth-footer { text-align: center; margin-top: 22px; font-size: 13px; color: #78716c; padding-bottom: 8px; }
        .hl-auth-footer a { color: #d97706; font-weight: 600; text-decoration: none; }
        .hl-auth-footer a:hover { text-decoration: underline; }

        @media (max-width: 768px) {
          .hl-auth-left { display: none; }
          .hl-auth-right { padding: 40px 24px; align-items: center; }
          .hl-field-row  { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hl-auth-wrap">

        {/* LEFT PANEL */}
        <div className="hl-auth-left">
          <div className="hl-auth-brand">
            <img src="/logo.png" alt="Heal Lots" className="hl-auth-brand-icon" />
          </div>
          <div className="hl-auth-left-body">
            <h2>Begin your<br /><em>Wellness</em> journey</h2>
            <p>Create an account and get access to trusted hilot specialists near you.</p>
            <ul className="hl-auth-features">
              <li><span className="dot">🤲</span> Skilled hilot practitioners</li>
              <li><span className="dot">🌿</span> Traditional Filipino methods</li>
              <li><span className="dot">📅</span> Easy appointment booking</li>
            </ul>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="hl-auth-right">
          <div className="hl-auth-card">
            <div className="hl-auth-card-header">
              <h3>Create account</h3>
              <p>Sign up for your Heal Lots account</p>
            </div>

            {error && <div className="hl-auth-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>

              {/* ── ACCOUNT INFO ── */}
              <div className="hl-section-divider"><span>Account Info</span></div>

              <div className="hl-field">
                <label>Full Name</label>
                <div className="hl-field-wrap">
                  <input name="fullName" type="text" placeholder="ex: Pedro dela Cruz"
                    required value={form.fullName} onChange={handleChange} />
                </div>
              </div>

              <div className="hl-field">
                <label>Email address</label>
                <div className="hl-field-wrap">
                  <input name="email" type="email" placeholder="ex: heallots@gmail.com"
                    required value={form.email} onChange={handleChange} />
                </div>
              </div>

              <div className="hl-field">
                <label>Password</label>
                <div className="hl-field-wrap">
                  <input name="password" type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters" required className="has-toggle"
                    value={form.password} onChange={handleChange} />
                  <button type="button" className="hl-toggle-btn" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? '👁.👁' : '◡.◡\u00A0'}
                  </button>
                </div>
                {strength && (
                  <>
                    <div className="hl-strength-bar">
                      <div className="hl-strength-fill" style={{ width: strength.width, background: strength.color }} />
                    </div>
                    <div className="hl-strength-label" style={{ color: strength.color }}>{strength.label}</div>
                  </>
                )}
              </div>

              <div className="hl-field">
                <label>Confirm Password</label>
                <div className="hl-field-wrap">
                  <input name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password" required className="has-toggle"
                    value={form.confirmPassword} onChange={handleChange} />
                  <button type="button" className="hl-toggle-btn" onClick={() => setShowConfirm(p => !p)}>
                    {showConfirm ? '👁.👁' : '◡.◡\u00A0'}
                  </button>
                </div>
              </div>

              {/* ── PERSONAL INFO ── */}
              <div className="hl-section-divider"><span>Personal Info</span></div>

              <div className="hl-field-row">
                <div className="hl-field">
                  <label>Phone Number</label>
                  <div className="hl-field-wrap">
                    <input
                      name="phone"
                      type="tel"
                      placeholder="0917 123 4567"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={13}
                    />
                  </div>
                </div>
                <div className="hl-field">
                  <label>Birthday</label>
                  <div className="hl-field-wrap">
                    <input name="birthday" type="date"
                      required value={form.birthday} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="hl-field">
                <label>Gender</label>
                <div className="hl-field-wrap">
                  <select name="gender" required value={form.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="hl-field">
                <label>Address</label>
                <div className="hl-field-wrap">
                  <textarea name="address" placeholder="Street, Barangay, City, Province"
                    required value={form.address} onChange={handleChange} />
                </div>
              </div>

              <button type="submit" className="hl-auth-submit" disabled={loading}>
                {loading ? <><div className="hl-spinner" /> Creating account...</> : 'Create Account'}
              </button>
            </form>

            <div className="hl-auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default Register;