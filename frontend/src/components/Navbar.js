import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './auth/ProfileModal';

const TRIMESTER_INFO = {
  1: { label: '1st Trimester', color: '#5A8A72', bg: '#EBF4EF', emoji: '🌱' },
  2: { label: '2nd Trimester', color: '#D4924A', bg: '#FDF3E7', emoji: '🌷' },
  3: { label: '3rd Trimester', color: '#C0394F', bg: '#FBEEF1', emoji: '🌸' },
};

const NAV_LINKS = [
  { id: 'home',      label: '🏠 Home' },
  { id: 'journal',   label: '📔 Journal' },
  { id: 'risk',      label: '🩺 Risk Analysis' },
  { id: 'chat',      label: '💬 AI Chat' },
  { id: 'medicines', label: '💊 Medicines' },
  { id: 'goals',     label: '🎯 Goals' },
];

const s = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(253,246,248,0.94)',
    backdropFilter: 'blur(18px)',
    borderBottom: '1px solid var(--border)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px', height: 62,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0,
  },
  logoIcon: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
  },
  logoText: {
    fontFamily: 'var(--font-display)', fontSize: 18,
    fontWeight: 600, color: 'var(--slate)', letterSpacing: '-0.3px',
  },
  logoSub: {
    fontSize: 9, color: 'var(--rose)', fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    display: 'block', marginTop: -1,
  },
  centre: {
    display: 'flex', gap: 2, overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  navLink: (active) => ({
    padding: '6px 13px', borderRadius: 99, whiteSpace: 'nowrap',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
    background: active ? 'var(--rose)' : 'transparent',
    color:      active ? '#fff'       : 'var(--slate-mid)',
    transition: 'all 0.18s ease', letterSpacing: '0.01em',
    fontFamily: 'var(--font-body)',
  }),
  right: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  trimBadge: (info) => ({
    display: 'flex', alignItems: 'center', gap: 4,
    background: info.bg, color: info.color,
    fontSize: 11, fontWeight: 600, padding: '3px 9px',
    borderRadius: 99, border: `1px solid ${info.color}33`,
    whiteSpace: 'nowrap',
  }),
  userBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 10px 4px 4px',
    borderRadius: 99, border: '1.5px solid var(--border)',
    background: 'var(--white)', cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, color: '#fff', fontWeight: 700, overflow: 'hidden', flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--slate)' },
  dropdown: {
    position: 'absolute', top: 48, right: 0,
    background: 'var(--white)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', minWidth: 180,
    boxShadow: 'var(--shadow-md)', zIndex: 200,
    overflow: 'hidden', animation: 'fadeIn 0.15s ease',
  },
  dropItem: (danger) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', cursor: 'pointer',
    fontSize: 13, color: danger ? 'var(--rose-dark)' : 'var(--slate)',
    fontWeight: 500, transition: 'background 0.15s',
    background: 'transparent', border: 'none', width: '100%',
    textAlign: 'left', fontFamily: 'var(--font-body)',
  }),
  divider: { height: 1, background: 'var(--border)', margin: '3px 0' },
};

export default function Navbar({ currentPage, onNavigate }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);

  const tInfo    = TRIMESTER_INFO[user?.trimester] || TRIMESTER_INFO[1];
  const avatarSrc = user?.profile_picture
    ? `http://localhost:5000/auth/uploads/${user.profile_picture}`
    : null;

  return (
    <>
      <nav style={s.nav}>
        <div style={s.inner}>
          {/* Logo */}
          <div style={s.logo} onClick={() => onNavigate('home')}>
            <div style={s.logoIcon}>🌸</div>
            <div>
              <span style={s.logoText}>BabyBloom</span>
              <span style={s.logoSub}>AI · Health</span>
            </div>
          </div>

          {/* Nav links */}
          <div style={s.centre}>
            {NAV_LINKS.map(l => (
              <button
                key={l.id}
                style={s.navLink(currentPage === l.id)}
                onClick={() => onNavigate(l.id)}
                onMouseEnter={e => { if (currentPage !== l.id) e.target.style.background = 'var(--rose-light)'; }}
                onMouseLeave={e => { if (currentPage !== l.id) e.target.style.background = 'transparent'; }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div style={s.right}>
            <div style={s.trimBadge(tInfo)}>
              {tInfo.emoji} {tInfo.label}
            </div>

            <div style={{ position: 'relative' }}>
              <div
                style={s.userBtn}
                onClick={() => setShowDropdown(p => !p)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={s.avatar}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>{user?.full_name?.[0]?.toUpperCase() || '?'}</span>
                  }
                </div>
                <span style={s.userName}>{user?.full_name?.split(' ')[0]}</span>
                <span style={{ fontSize: 10, color: 'var(--slate-light)' }}>▾</span>
              </div>

              {showDropdown && (
                <div style={s.dropdown} onMouseLeave={() => setShowDropdown(false)}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)' }}>{user?.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate-light)' }}>@{user?.username}</div>
                  </div>
                  <button style={s.dropItem(false)}
                    onClick={() => { setShowProfile(true); setShowDropdown(false); }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--blush)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    ✏️ Edit Profile
                  </button>
                  <button style={s.dropItem(false)}
                    onClick={() => { onNavigate('home'); setShowDropdown(false); }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--blush)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    🏠 My Dashboard
                  </button>
                  <div style={s.divider} />
                  <button style={s.dropItem(true)}
                    onClick={() => { logout(); setShowDropdown(false); }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--rose-light)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}