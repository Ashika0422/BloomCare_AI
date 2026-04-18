import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Flower2, Bot, Pill, BookOpen, Eye, EyeOff, AlertTriangle, ArrowRight } from 'lucide-react';

const GRAD_HEADER = 'linear-gradient(160deg, #210217 0%, #5f0742 40%, #be0e83 100%)';
const GRAD_SOFT   = 'linear-gradient(135deg, #8A00F3 0%, #D300D0 100%)';
const SHADOW_BTN  = '0 4px 20px rgba(110, 1, 244, 0.38)';
const FOCUS_RING  = '0 0 0 3px rgba(177, 0, 231, 0.18)';
const PRIMARY     = '#B100E7';
const PRIMARY_TINT= '#F5E6FF';
const PRIMARY_LIGHT='#E8CCFF';
const BORDER_COLOR= 'rgba(237,18,164,0.15)';

const s = {
  page: { minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-body)' },
  left: {
    flex: '0 0 46%', background: GRAD_HEADER,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center',
    padding: '60px 52px', position: 'relative', overflow: 'hidden',
  },
  leftOrb: (w, op) => ({
    position: 'absolute', width: w, height: w, borderRadius: '50%',
    background: `rgba(255,255,255,${op})`,
  }),
  brand: { position: 'relative', zIndex: 1, textAlign: 'center' },
  brandIcon: {
    width: 80, height: 80, borderRadius: '50%',
    background: 'rgba(255,255,255,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  brandName: {
    fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 600,
    color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 12,
  },
  brandTagline: {
    fontSize: 15, color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.7, maxWidth: 280, margin: '0 auto 36px',
  },
  featureList: { listStyle: 'none', padding: 0, margin: 0, textAlign: 'left', width: '100%', maxWidth: 280 },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
    color: 'rgba(255,255,255,0.9)', fontSize: 14,
  },
  featureDot: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'rgba(255,255,255,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  right: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '60px 52px', background: '#FEFAFB',
  },
  form: { width: '100%', maxWidth: 400 },
  eyebrow: {
    display: 'inline-block', background: PRIMARY_TINT, color: '#6E01F4',
    fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
    border: `1px solid ${PRIMARY_LIGHT}`,
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600,
    color: 'var(--slate)', letterSpacing: '-0.4px', marginBottom: 6, lineHeight: 1.2,
  },
  subtitle: { fontSize: 14, color: 'var(--slate-light)', marginBottom: 36 },
  fieldWrap: { marginBottom: 20 },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--slate-mid)',
    letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 7,
  },
  inputWrap: { position: 'relative' },
  input: (focused, error) => ({
    width: '100%', padding: '13px 16px', borderRadius: 'var(--radius-md)',
    border: `1.5px solid ${error ? '#8A00F3' : focused ? PRIMARY : BORDER_COLOR}`,
    background: focused ? '#F5E6FF' : '#fdfaf7',
    fontSize: 15, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', transition: 'all 0.2s ease',
    boxShadow: focused ? FOCUS_RING : 'none',
  }),
  eye: {
    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
    cursor: 'pointer', color: 'var(--slate-light)',
    background: 'none', border: 'none', padding: 0,
    display: 'flex', alignItems: 'center',
  },
  submitBtn: (loading) => ({
    width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
    background: loading ? PRIMARY_LIGHT : GRAD_SOFT,
    color: '#fff', border: 'none', fontSize: 15, fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.03em',
    marginTop: 8, transition: 'all 0.2s ease',
    boxShadow: loading ? 'none' : SHADOW_BTN,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }),
  spinner: {
    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    margin: '24px 0', color: 'var(--slate-light)', fontSize: 13,
  },
  dividerLine: { flex: 1, height: 1, background: 'rgba(237,18,164,0.12)' },
  switchText: { textAlign: 'center', fontSize: 14, color: 'var(--slate-mid)', marginTop: 4 },
  link: {
    color: '#6E01F4', fontWeight: 600, cursor: 'pointer',
    background: 'none', border: 'none', padding: 0,
    fontSize: 14, fontFamily: 'var(--font-body)', textDecoration: 'underline',
  },
  globalError: {
    background: PRIMARY_TINT, border: `1px solid ${PRIMARY_LIGHT}`,
    borderRadius: 'var(--radius-sm)', padding: '12px 16px',
    color: '#6E01F4', fontSize: 13, marginBottom: 20, animation: 'fadeIn 0.3s ease',
    display: 'flex', alignItems: 'center', gap: 8,
  },
};

const FEATURES = [
  { Icon: Flower2, text: 'Track your pregnancy journey' },
  { Icon: Bot,     text: 'AI-powered health risk analysis' },
  { Icon: Pill,    text: 'Medicine reminders & goal tracking' },
  { Icon: BookOpen,text: 'Daily journal & mood diary' },
];

export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [focused, setFocused] = useState(null);
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.username || !form.password) { setError('Please enter both username and password.'); return; }
    setLoading(true); setError('');
    try {
      const res = await login(form.username, form.password);
      if (!res.success) setError(res.error || 'Login failed.');
    } catch { setError('Cannot connect to server. Make sure Flask is running.'); }
    finally { setLoading(false); }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div style={s.fieldWrap}>
      <label style={s.label}>{label}</label>
      <div style={s.inputWrap}>
        <input
          type={key === 'password' ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={form[key]}
          style={s.input(focused === key, false)}
          onFocus={() => setFocused(key)}
          onBlur={() => setFocused(null)}
          onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        {key === 'password' && (
          <button style={s.eye} type="button" onClick={() => setShowPw(p => !p)}>
            {showPw
              ? <EyeOff size={16} strokeWidth={1.8} />
              : <Eye size={16} strokeWidth={1.8} />
            }
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={{ ...s.leftOrb(320, 0.05), top: -80, left: -80 }} />
        <div style={{ ...s.leftOrb(200, 0.07), bottom: 40, right: -60 }} />
        <div style={{ ...s.leftOrb(100, 0.04), bottom: 160, left: 40 }} />
        <div style={s.brand}>
          <div style={s.brandIcon}>
            <Flower2 size={40} color="#fff" strokeWidth={1.6} />
          </div>
          <h1 style={s.brandName}>BloomCare<br />AI</h1>
          <p style={s.brandTagline}>
            Your intelligent companion for a healthier, safer pregnancy journey.
          </p>
          <ul style={s.featureList}>
            {FEATURES.map(f => (
              <li key={f.text} style={s.featureItem}>
                <span style={s.featureDot}>
                  <f.Icon size={14} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.form}>
          <span style={s.eyebrow}>Welcome Back</span>
          <h2 style={s.title}>Sign in to your<br />account</h2>
          <p style={s.subtitle}>Continue your pregnancy health journey</p>
          {error && (
            <div style={s.globalError}>
              <AlertTriangle size={14} strokeWidth={2} />
              {error}
            </div>
          )}
          {field('username', 'Username or Email', 'text', 'Enter your username or email')}
          {field('password', 'Password', 'password', 'Enter your password')}
          <button
            style={s.submitBtn(loading)}
            onClick={handleSubmit}
            disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {loading
              ? <><div style={s.spinner} /> Signing in…</>
              : <> Sign In <ArrowRight size={16} strokeWidth={2} /></>
            }
          </button>
          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span>New to BloomCare?</span>
            <span style={s.dividerLine} />
          </div>
          <p style={s.switchText}>
            Don't have an account?{' '}
            <button style={s.link} onClick={onSwitchToRegister}>Create one free</button>
          </p>
        </div>
      </div>
    </div>
  );
}