import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './auth/ProfileModal';
import {
  Home, BookOpen, Stethoscope, MessageCircle,
  Pill, Target, Shield, LogOut, Edit,
  ChevronDown, Leaf, Flower2, User,
} from 'lucide-react';

/* ── Trimester config — Icon instead of emoji ──────────────── */
const TRIM_INFO = {
  1: { label: '1st Trimester', color: '#f141b6', bg: '#fde7f6', border: '#f8a0db', Icon: Leaf },
  2: { label: '2nd Trimester', color: '#be0e83', bg: '#fbd0ed', border: '#f471c8', Icon: Flower2 },
  3: { label: '3rd Trimester', color: '#8e0b62', bg: '#fbd0ed', border: '#f141b6', Icon: Flower2 },
};

const GRAD_SOFT = 'linear-gradient(135deg, #f141b6 0%, #be0e83 100%)';
const PRIMARY   = '#ed12a4';

/* ── Nav links — Icon component instead of emoji string ────── */
const BASE_LINKS = [
  { id: 'home',      label: 'Home',      Icon: Home },
  { id: 'journal',   label: 'Journal',   Icon: BookOpen },
  { id: 'risk',      label: 'Risk',      Icon: Stethoscope },
  { id: 'chat',      label: 'AI Chat',   Icon: MessageCircle },
  { id: 'medicines', label: 'Medicines', Icon: Pill },
  { id: 'goals',     label: 'Goals',     Icon: Target },
];
const ADMIN_LINK = { id: 'admin', label: 'Admin', Icon: Shield };

const s = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: '#F3C4FB',
    backdropFilter: 'blur(18px)',
    borderBottom: '1px solid rgba(237,18,164,0.12)',
  },
  inner: {
    maxWidth: 1280, margin: '0 auto',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px', height: 62,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', flexShrink: 0, textDecoration: 'none',
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: '50%',
    background: GRAD_SOFT,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 3px 12px rgba(237,18,164,0.3)',
  },
  logoText: {
    fontFamily: 'var(--font-display)', fontSize: 18,
    fontWeight: 600, color: 'var(--slate)', letterSpacing: '-0.3px',
  },
  logoSub: {
    fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', display: 'block', marginTop: -1,
    background: GRAD_SOFT,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  centre: {
    display: 'flex', gap: 2, overflowX: 'auto',
    scrollbarWidth: 'none', flex: 1, margin: '0 16px',
  },
  navLink: (active, isAdmin) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 13px', borderRadius: 99, whiteSpace: 'nowrap',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
    background: active
      ? (isAdmin ? '#2C3E50' : GRAD_SOFT)
      : 'transparent',
    color: active ? '#fff' : 'var(--slate-mid)',
    transition: 'all 0.18s ease', letterSpacing: '0.01em',
    fontFamily: 'var(--font-body)',
    boxShadow: active && !isAdmin ? '0 2px 10px rgba(237,18,164,0.25)' : 'none',
  }),
  right: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  trimBadge: (info) => ({
    display: 'flex', alignItems: 'center', gap: 5,
    background: info.bg, color: info.color,
    fontSize: 11, fontWeight: 600, padding: '4px 11px',
    borderRadius: 99, border: `1px solid ${info.border}`,
    whiteSpace: 'nowrap',
  }),
  userBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 10px 4px 4px', borderRadius: 99,
    border: '1.5px solid rgba(237,18,164,0.2)',
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
    border: '1px solid rgba(237,18,164,0.15)', minWidth: 195,
    boxShadow: '0 8px 32px rgba(237,18,164,0.14)',
    zIndex: 200, overflow: 'hidden', animation: 'fadeIn 0.15s ease',
  },
  dropItem: (danger, admin) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', cursor: 'pointer', fontSize: 13,
    fontWeight: 500, transition: 'background 0.15s',
    color: danger ? '#be0e83' : admin ? '#2C3E50' : 'var(--slate)',
    background: 'transparent', border: 'none', width: '100%',
    textAlign: 'left', fontFamily: 'var(--font-body)',
  }),
  divider: { height: 1, background: 'rgba(237,18,164,0.1)', margin: '3px 0' },
};

export default function Navbar({ currentPage, onNavigate }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);

  const tInfo     = TRIM_INFO[user?.trimester] || TRIM_INFO[1];
  const TrimIcon  = tInfo.Icon;
  const avatarSrc = user?.profile_picture
    ? `http://localhost:5000/auth/uploads/${user.profile_picture}`
    : null;

  const navLinks = [...BASE_LINKS, ADMIN_LINK];

  return (
    <>
      <nav style={s.nav}>
        <div style={s.inner}>

          {/* ── Logo ─────────────────────────────────────── */}
          <div style={s.logo} onClick={() => onNavigate('home')}>
            <div style={s.logoIcon}>
              {/* Flower icon instead of 🌸 emoji */}
              <Flower2 size={18} color="#fff" strokeWidth={1.8} />
            </div>
            <div>
              <span style={s.logoText}>BloomCare</span>
              <span style={s.logoSub}>AI · Health</span>
            </div>
          </div>

          {/* ── Nav links with Lucide icons ───────────────── */}
          <div style={s.centre}>
            {navLinks.map(l => {
              const isAdminLink = l.id === 'admin';
              const NavIcon     = l.Icon;
              return (
                <button
                  key={l.id}
                  style={s.navLink(currentPage === l.id, isAdminLink)}
                  onClick={() => onNavigate(l.id)}
                  onMouseEnter={e => {
                    if (currentPage !== l.id)
                      e.currentTarget.style.background = isAdminLink ? '#EDF2F5' : '#F5E6FF';
                  }}
                  onMouseLeave={e => {
                    if (currentPage !== l.id)
                      e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Real icon instead of emoji */}
                  <NavIcon
                    size={15}
                    strokeWidth={currentPage === l.id ? 2.2 : 1.8}
                    style={{ flexShrink: 0 }}
                  />
                  {l.label}
                </button>
              );
            })}
          </div>

          {/* ── Right: trimester badge + user menu ────────── */}
          <div style={s.right}>

            {/* Trimester badge — real icon */}
            <div style={s.trimBadge(tInfo)}>
              <TrimIcon size={12} strokeWidth={2} />
              {tInfo.label}
            </div>

            {/* User dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                style={s.userBtn}
                onClick={() => setShowDropdown(p => !p)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(237,18,164,0.2)'; }}
              >
                <div style={s.avatar}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>{user?.full_name?.[0]?.toUpperCase() || '?'}</span>
                  }
                </div>
                <span style={s.userName}>{user?.full_name?.split(' ')[0]}</span>
                {/* ChevronDown instead of ▾ */}
                <ChevronDown size={13} color="var(--slate-light)" />
              </div>

              {showDropdown && (
                <div style={s.dropdown} onMouseLeave={() => setShowDropdown(false)}>
                  {/* User info header */}
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(237,18,164,0.1)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {user?.full_name}
                      {user?.is_admin && (
                        <span style={{ fontSize: 9, background: '#2C3E50', color: '#fff', padding: '1px 6px', borderRadius: 99 }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--slate-light)', marginTop: 1 }}>
                      @{user?.username}
                    </div>
                  </div>

                  {/* Edit Profile — Edit icon */}
                  <button style={s.dropItem(false, false)}
                    onClick={() => { setShowProfile(true); setShowDropdown(false); }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F5E6FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <Edit size={14} strokeWidth={1.8} />
                    Edit Profile
                  </button>

                  {/* My Dashboard — Home icon */}
                  <button style={s.dropItem(false, false)}
                    onClick={() => { onNavigate('home'); setShowDropdown(false); }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F5E6FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <Home size={14} strokeWidth={1.8} />
                    My Dashboard
                  </button>

                  {/* Admin Panel — Shield icon (admin only) */}
                  {user?.is_admin && (
                    <button style={s.dropItem(false, true)}
                      onClick={() => { onNavigate('admin'); setShowDropdown(false); }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#EDF2F5'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <Shield size={14} strokeWidth={1.8} />
                      Admin Panel
                    </button>
                  )}

                  <div style={s.divider} />

                  {/* Sign Out — LogOut icon */}
                  <button style={s.dropItem(true, false)}
                    onClick={() => { logout(); setShowDropdown(false); }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fde7f6'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <LogOut size={14} strokeWidth={1.8} />
                    Sign Out
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