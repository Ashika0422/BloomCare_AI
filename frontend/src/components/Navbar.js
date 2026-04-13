import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './auth/ProfileModal';

/* ── New palette ─────────────────────────────────────────────── */
const TRIM_INFO = {
  1: { label: '1st Trimester', color: '#8A00F3', bg: '#F0E6FF', border: '#C89EF5', emoji: '🌱' },
  2: { label: '2nd Trimester', color: '#BC00DD', bg: '#F5E0FF', border: '#DBA0F0', emoji: '🌷' },
  3: { label: '3rd Trimester', color: '#E500A3', bg: '#FFE6F7', border: '#F0A0D8', emoji: '🌸' },
};

const GRAD_SOFT   = 'linear-gradient(135deg, #8A00F3 0%, #D300D0 100%)';
const PRIMARY     = '#B100E7';
const PRIMARY_TINT= '#F5E6FF';
const SHADOW_BTN  = '0 4px 18px rgba(110, 1, 244, 0.3)';

const BASE_LINKS = [
  { id: 'home',      label: '🏠 Home' },
  { id: 'journal',   label: '📔 Journal' },
  { id: 'risk',      label: '🩺 Risk' },
  { id: 'chat',      label: '💬 AI Chat' },
  { id: 'medicines', label: '💊 Medicines' },
  { id: 'goals',     label: '🎯 Goals' },
];
const ADMIN_LINK = { id: 'admin', label: '🛡 Admin' };

const s = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(253,244,255,0.94)',     /* blush tinted */
    backdropFilter: 'blur(18px)',
    borderBottom: '1px solid rgba(177,0,231,0.12)',
  },
  inner: {
    maxWidth: 1280, margin: '0 auto',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px', height: 62,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', flexShrink: 0,
  },
  logoIcon: {
    width: 34, height: 34, borderRadius: '50%',
    background: GRAD_SOFT,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 17, boxShadow: '0 3px 12px rgba(110,1,244,0.3)',
  },
  logoText: {
    fontFamily: 'var(--font-display)', fontSize: 18,
    fontWeight: 600, color: 'var(--slate)', letterSpacing: '-0.3px',
  },
  logoSub: {
    fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', display: 'block', marginTop: -1,
    background: GRAD_SOFT, WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  centre: {
    display: 'flex', gap: 2, overflowX: 'auto',
    scrollbarWidth: 'none', flex: 1, margin: '0 16px',
  },
  navLink: (active, isAdmin) => ({
    padding: '6px 12px', borderRadius: 99, whiteSpace: 'nowrap',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
    background: active
      ? (isAdmin ? '#2C3E50' : GRAD_SOFT)
      : 'transparent',
    color: active ? '#fff' : 'var(--slate-mid)',
    transition: 'all 0.18s ease', letterSpacing: '0.01em',
    fontFamily: 'var(--font-body)',
    boxShadow: active && !isAdmin ? '0 2px 10px rgba(110,1,244,0.25)' : 'none',
  }),
  right: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  trimBadge: (info) => ({
    display: 'flex', alignItems: 'center', gap: 4,
    background: info.bg, color: info.color,
    fontSize: 11, fontWeight: 600, padding: '3px 10px',
    borderRadius: 99, border: `1px solid ${info.border}`,
    whiteSpace: 'nowrap',
  }),
  userBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 10px 4px 4px', borderRadius: 99,
    border: '1.5px solid rgba(177,0,231,0.2)',
    background: 'var(--white)', cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: GRAD_SOFT,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, color: '#fff', fontWeight: 700,
    overflow: 'hidden', flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--slate)' },
  dropdown: {
    position: 'absolute', top: 48, right: 0,
    background: 'var(--white)', borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(177,0,231,0.15)', minWidth: 190,
    boxShadow: '0 8px 32px rgba(110,1,244,0.14)',
    zIndex: 200, overflow: 'hidden', animation: 'fadeIn 0.15s ease',
  },
  dropItem: (danger, admin) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, transition: 'background 0.15s',
    color: danger ? '#8A00F3' : admin ? '#2C3E50' : 'var(--slate)',
    background: 'transparent', border: 'none', width: '100%',
    textAlign: 'left', fontFamily: 'var(--font-body)',
  }),
  divider: { height: 1, background: 'rgba(177,0,231,0.1)', margin: '3px 0' },
};

export default function Navbar({ currentPage, onNavigate }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);

  const tInfo     = TRIM_INFO[user?.trimester] || TRIM_INFO[1];
  const avatarSrc = user?.profile_picture
    ? `http://localhost:5000/auth/uploads/${user.profile_picture}`
    : null;

  const navLinks = [...BASE_LINKS, ADMIN_LINK];

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
            {navLinks.map(l => {
              const isAdminLink = l.id === 'admin';
              return (
                <button
                  key={l.id}
                  style={s.navLink(currentPage === l.id, isAdminLink)}
                  onClick={() => onNavigate(l.id)}
                  onMouseEnter={e => {
                    if (currentPage !== l.id)
                      e.target.style.background = isAdminLink ? '#EDF2F5' : PRIMARY_TINT;
                  }}
                  onMouseLeave={e => {
                    if (currentPage !== l.id) e.target.style.background = 'transparent';
                  }}
                >
                  {l.label}
                </button>
              );
            })}
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
                onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(177,0,231,0.2)'; }}
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
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(177,0,231,0.1)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {user?.full_name}
                      {user?.is_admin && (
                        <span style={{
                          fontSize: 9, background: '#2C3E50', color: '#fff',
                          padding: '1px 6px', borderRadius: 99, letterSpacing: '0.04em',
                        }}>ADMIN</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--slate-light)' }}>@{user?.username}</div>
                  </div>

                  {[
                    { label: '✏️ Edit Profile', action: () => { setShowProfile(true); setShowDropdown(false); }, danger: false, admin: false, hover: '#F5E6FF' },
                    { label: '🏠 My Dashboard', action: () => { onNavigate('home'); setShowDropdown(false); }, danger: false, admin: false, hover: '#F5E6FF' },
                    ...(user?.is_admin ? [{ label: '🛡 Admin Panel', action: () => { onNavigate('admin'); setShowDropdown(false); }, danger: false, admin: true, hover: '#EDF2F5' }] : []),
                  ].map(item => (
                    <button key={item.label} style={s.dropItem(item.danger, item.admin)}
                      onClick={item.action}
                      onMouseEnter={e => { e.currentTarget.style.background = item.hover; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      {item.label}
                    </button>
                  ))}

                  <div style={s.divider} />

                  <button style={s.dropItem(true, false)}
                    onClick={() => { logout(); setShowDropdown(false); }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F5E6FF'; }}
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