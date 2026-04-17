import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({ setIsLoggedIn, setIsAdmin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8080/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setIsLoggedIn(true);
      const isAdmin = res.data.user?.role === 'ADMIN';
      setIsAdmin(isAdmin);
      navigate(isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      console.error('Login error:', err.response?.status, err.response?.data, err.message);
      if (err.response?.status === 401) setError('Invalid email or password.');
      else setError(`Server error: ${err.response?.data?.message || err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        .hl-auth-wrap { min-height: 100vh; display: flex; font-family: 'DM Sans', sans-serif; background: #fafaf8; }
        .hl-auth-left { width: 44%; background: linear-gradient(145deg, #0f172a 0%, #1c1408 55%, #2d1a04 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 48px; position: relative; overflow: hidden; border-right: 1px solid rgba(217,119,6,0.15); }
        .hl-auth-left::before { content: ''; position: absolute; bottom: -100px; left: -100px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(217,119,6,0.18), transparent 65%); }
        .hl-auth-left::after { content: ''; position: absolute; top: -60px; right: -60px; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(14,165,233,0.07), transparent 65%); }
        .hl-auth-brand { margin-bottom: 10px; position: relative; z-index: 1; }
        .hl-auth-brand-icon { height: 150px; width: auto; filter: brightness(0) invert(1) drop-shadow(0 0 8px rgba(217,119,6,0.7)); }
        .hl-auth-left-body { position: relative; z-index: 1; text-align: center; }
        .hl-auth-left-body h2 { font-family: 'Fraunces', serif; font-size: 36px; font-weight: 800; color: #fff; line-height: 1.15; margin-bottom: 16px; }
        .hl-auth-left-body h2 em { font-style: italic; color: #fbbf24; }
        .hl-auth-left-body p { font-size: 15px; color: #a8956b; line-height: 1.75; font-weight: 300; max-width: 300px; margin: 0 auto 40px; }
        .hl-auth-features { list-style: none; display: flex; flex-direction: column; gap: 14px; text-align: left; }
        .hl-auth-features li { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #c4a96b; }
        .hl-auth-features li .dot { width: 30px; height: 30px; background: rgba(217,119,6,0.2); border: 1px solid rgba(217,119,6,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
        .hl-auth-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 40px; background: #fafaf8; }
        .hl-auth-card { width: 100%; max-width: 420px; }
        .hl-auth-card-header { margin-bottom: 32px; }
        .hl-auth-card-header h3 { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 800; color: #1c1408; margin-bottom: 6px; }
        .hl-auth-card-header p { font-size: 14px; color: #78716c; }
        .hl-auth-error { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; font-size: 13px; color: #dc2626; font-weight: 500; }
        .hl-field { margin-bottom: 18px; }
        .hl-field label { display: block; font-size: 13px; font-weight: 600; color: #44291a; margin-bottom: 7px; letter-spacing: 0.2px; }
        .hl-field-wrap { position: relative; }
        .hl-field input { width: 100%; padding: 12px 16px; border: 1.5px solid #e8ddd0; border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #1c1408; background: #fff; outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
        .hl-field input:focus { border-color: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.12); }
        .hl-field input.has-toggle { padding-right: 46px; }
        .hl-toggle-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 17px; color: #000000; padding: 0; line-height: 1; }
        .hl-auth-submit { width: 100%; padding: 13px; background: linear-gradient(135deg, #d97706, #b45309); border: none; border-radius: 10px; color: #fff; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 16px rgba(217,119,6,0.4); margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .hl-auth-submit:hover:not(:disabled) { background: linear-gradient(135deg, #f59e0b, #d97706); transform: translateY(-1px); box-shadow: 0 6px 22px rgba(217,119,6,0.5); }
        .hl-auth-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        .hl-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .hl-auth-footer { text-align: center; margin-top: 24px; font-size: 13px; color: #78716c; }
        .hl-auth-footer a { color: #d97706; font-weight: 600; text-decoration: none; }
        .hl-auth-footer a:hover { text-decoration: underline; }
        @media (max-width: 768px) { .hl-auth-left { display: none; } .hl-auth-right { padding: 40px 24px; } }
      `}</style>

      <div className="hl-auth-wrap">
        <div className="hl-auth-left">
          <div className="hl-auth-brand">
            <img src="/logo.png" alt="Heal Lots" className="hl-auth-brand-icon" />
          </div>
          <div className="hl-auth-left-body">
            <h2>Healing through<br />the art of <em>Hilot</em></h2>
            <p>Sign in to book your session with our trusted local hilot specialists.</p>
            <ul className="hl-auth-features">
              <li><span className="dot">🤲</span> Skilled hilot practitioners</li>
              <li><span className="dot">🌿</span> Traditional Filipino methods</li>
              <li><span className="dot">📅</span> Easy appointment booking</li>
            </ul>
          </div>
        </div>
        <div className="hl-auth-right">
          <div className="hl-auth-card">
            <div className="hl-auth-card-header">
              <h3>Welcome back</h3>
              <p>Sign in to your Heal Lots account</p>
            </div>
            {error && <div className="hl-auth-error">⚠️ {error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="hl-field">
                <label>Email address</label>
                <div className="hl-field-wrap">
                  <input type="email" placeholder="Enter your email address" required
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="hl-field">
                <label>Password</label>
                <div className="hl-field-wrap">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                    required className="has-toggle" value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="hl-toggle-btn" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? '👁👁' : '◡.◡'}
                  </button>
                </div>
              </div>
              <button type="submit" className="hl-auth-submit" disabled={loading}>
                {loading ? <><div className="hl-spinner" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
            <div className="hl-auth-footer">
              Don't have an account? <Link to="/register">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
