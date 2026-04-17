import { Link, useLocation } from "react-router-dom";

function Navbar({ isLoggedIn, isAdmin }) {
  const location = useLocation();

  const navLinks = [
    ...(isLoggedIn && isAdmin ? [{ to: "/admin", label: "Admin", pill: false }] : []),
    ...(!isLoggedIn ? [{ to: "/login", label: "Sign In", pill: true }] : []),
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

        .hl-navbar {
          background: linear-gradient(135deg, #0f172a 0%, #1c1408 100%);
          padding: 0 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 66px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.35);
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(217,119,6,0.2);
        }

        .hl-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .hl-brand:hover { opacity: 0.85; }

        .hl-logo {
          height: 55px;
          width: auto;
          flex-shrink: 0;
          filter: brightness(0) invert(1)
                  drop-shadow(0 0 6px rgba(217,119,6,0.6));
          transition: filter 0.2s;
        }

        .hl-brand:hover .hl-logo {
          filter: brightness(0) invert(1)
                  drop-shadow(0 0 12px rgba(251,191,36,0.9));
        }

        .hl-nav-links {
          list-style: none;
          display: flex;
          align-items: center;
          gap: 2px;
          margin: 0;
          padding: 0;
        }

        .hl-nav-links li a {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #a8956b;
          text-decoration: none;
          padding: 7px 14px;
          border-radius: 8px;
          transition: all 0.18s ease;
          letter-spacing: 0.1px;
          display: block;
        }

        .hl-nav-links li a:hover {
          color: #fbbf24;
          background: rgba(217,119,6,0.1);
        }

        .hl-nav-links li a.active {
          color: #fbbf24;
          background: rgba(217,119,6,0.15);
        }

        .hl-nav-links li a.pill {
          background: linear-gradient(135deg, #d97706, #b45309);
          color: #fff;
          font-weight: 600;
          padding: 7px 20px;
          box-shadow: 0 2px 12px rgba(217,119,6,0.4);
        }

        .hl-nav-links li a.pill:hover {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 4px 18px rgba(217,119,6,0.55);
          transform: translateY(-1px);
          color: #fff;
        }
      `}</style>

      <nav className="hl-navbar">
        <Link to="/" className="hl-brand">
          <img src="/logo.png" alt="Heal Lots" className="hl-logo" />
        </Link>

        <ul className="hl-nav-links">
          {navLinks.map(({ to, label, pill }) => (
            <li key={to}>
              <Link
                to={to}
                className={[
                  location.pathname === to ? "active" : "",
                  pill ? "pill" : "",
                ].filter(Boolean).join(" ")}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export default Navbar;
