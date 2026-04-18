import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Leaf, Flower2, User, Heart, Baby, Eye, EyeOff, AlertTriangle, Check, ArrowRight, ArrowLeft } from 'lucide-react';

/* ── Trimester data ─────────────────────────────────────── */
const TRIMESTERS = [
  {
    value: 1, label: 'First Trimester', weeks: 'Weeks 1–12', Icon: Leaf,
    desc: 'Early development. Morning sickness and fatigue are common.',
    color: '#f141b6', bg: '#fde7f6', border: '#f8a0db',
  },
  {
    value: 2, label: 'Second Trimester', weeks: 'Weeks 13–26', Icon: Flower2,
    desc: 'Baby bump appears. Energy often returns. Kicks begin!',
    color: '#be0e83', bg: '#fbd0ed', border: '#f471c8',
  },
  {
    value: 3, label: 'Third Trimester', weeks: 'Weeks 27–40', Icon: Flower2,
    desc: 'Final stretch. Baby grows rapidly. Birth preparation begins.',
    color: '#8e0b62', bg: '#fbd0ed', border: '#f141b6',
  },
];

/* ── Steps config ───────────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Account',   Icon: User },
  { id: 2, label: 'Personal',  Icon: Heart },
  { id: 3, label: 'Pregnancy', Icon: Baby },
];

/* ── Styles ─────────────────────────────────────────────── */
const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'stretch', fontFamily: 'var(--font-body)' },
  left: {
    flex: '0 0 38%',
    background: 'linear-gradient(160deg, #210217 0%, #5f0742 40%, #be0e83 100%)',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', padding: '60px 48px',
    position: 'relative', overflow: 'hidden',
  },
  orb: (w, h, t, l, b, r, op) => ({
    position: 'absolute', width: w, height: h, borderRadius: '50%',
    background: `rgba(255,255,255,${op})`,
    ...(t !== null ? { top: t } : {}),
    ...(b !== null ? { bottom: b } : {}),
    ...(l !== null ? { left: l } : {}),
    ...(r !== null ? { right: r } : {}),
  }),
  leftContent: { position: 'relative', zIndex: 1 },
  brandRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 },
  brandIconWrap: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(255,255,255,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brandName: {
    fontFamily: 'var(--font-display)', fontSize: 26,
    fontWeight: 600, color: '#fff', letterSpacing: '-0.3px',
  },
  progressTitle: {
    fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20,
  },
  stepList: { listStyle: 'none', padding: 0, margin: 0 },
  stepItem: (active, done) => ({
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px', borderRadius: 12, marginBottom: 6,
    background: active ? 'rgba(255,255,255,0.15)' : done ? 'rgba(255,255,255,0.07)' : 'transparent',
    transition: 'background 0.3s ease',
  }),
  stepCircle: (active, done) => ({
    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: done ? 'rgba(255,255,255,0.9)' : active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
    color: done ? '#8A00F3' : '#fff',
    border: active ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
    transition: 'all 0.3s ease',
  }),
  stepText: (active) => ({
    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
    fontSize: 14, fontWeight: active ? 600 : 400, transition: 'all 0.3s',
  }),
  stepSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
  rightPanel: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 52px', background: 'var(--cream)', overflowY: 'auto',
  },
  formWrap: { width: '100%', maxWidth: 440 },
  stepHeader: { marginBottom: 32, animation: 'fadeUp 0.4s ease both' },
  eyebrow: {
    display: 'inline-block',
    background: 'var(--primary-tint)', color: 'var(--primary-dark)',
    fontSize: 11, fontWeight: 600, padding: '4px 12px',
    borderRadius: 99, letterSpacing: '0.1em', textTransform: 'uppercase',
    marginBottom: 12, border: '1px solid var(--primary-light)',
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600,
    color: 'var(--slate)', letterSpacing: '-0.4px', lineHeight: 1.2, marginBottom: 6,
  },
  sub: { fontSize: 14, color: 'var(--slate-light)' },
  fieldWrap: { marginBottom: 18 },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: 'var(--slate-mid)', letterSpacing: '0.05em',
    textTransform: 'uppercase', marginBottom: 7,
  },
  inputWrap: { position: 'relative' },
  input: (focused, error) => ({
    width: '100%', padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: `1.5px solid ${error ? 'var(--primary)' : focused ? 'var(--primary)' : 'var(--border)'}`,
    background: focused ? 'var(--blush)' : '#fdfaf7',
    fontSize: 14, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', transition: 'all 0.2s ease',
    boxShadow: focused ? '0 0 0 3px rgba(237,18,164,0.12)' : 'none',
  }),
  eye: {
    position: 'absolute', right: 12, top: '50%',
    transform: 'translateY(-50%)', cursor: 'pointer',
    background: 'none', border: 'none', padding: 0,
    color: 'var(--slate-light)', display: 'flex', alignItems: 'center',
  },
  errorText: { fontSize: 11, color: 'var(--primary-dark)', marginTop: 4, fontWeight: 500 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  trimesterGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  trimCard: (selected, cfg) => ({
    border: `2px solid ${selected ? cfg.color : 'var(--border)'}`,
    borderRadius: 'var(--radius-md)', padding: '14px 18px',
    background: selected ? cfg.bg : 'var(--white)',
    cursor: 'pointer', transition: 'all 0.2s ease',
    display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: selected ? `0 0 0 3px ${cfg.color}22` : 'none',
  }),
  trimIconWrap: (cfg, selected) => ({
    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
    background: selected ? cfg.color : cfg.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `1px solid ${cfg.border}`,
  }),
  trimInfo: { flex: 1 },
  trimLabel: (selected, color) => ({
    fontSize: 14, fontWeight: 700,
    color: selected ? color : 'var(--slate)', marginBottom: 2,
  }),
  trimWeeks: { fontSize: 11, color: 'var(--slate-light)', marginBottom: 3 },
  trimDesc: { fontSize: 12, color: 'var(--slate-mid)', lineHeight: 1.4 },
  trimCheck: (selected, color) => ({
    width: 22, height: 22, borderRadius: '50%',
    background: selected ? color : 'var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.2s ease',
  }),
  btnRow: { display: 'flex', gap: 12, marginTop: 28 },
  backBtn: {
    flex: '0 0 auto', padding: '13px 22px',
    borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)',
    background: 'transparent', color: 'var(--slate-mid)',
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.2s ease', fontFamily: 'var(--font-body)',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  nextBtn: (loading) => ({
    flex: 1, padding: '13px 22px',
    borderRadius: 'var(--radius-md)',
    background: loading ? 'var(--primary-light)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
    color: '#fff', border: 'none',
    fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
    letterSpacing: '0.03em', transition: 'all 0.2s ease',
    boxShadow: loading ? 'none' : '0 4px 18px rgba(237,18,164,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--font-body)',
  }),
  spinner: {
    width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  switchText: { textAlign: 'center', fontSize: 14, color: 'var(--slate-mid)', marginTop: 20 },
  link: {
    color: 'var(--primary-dark)', fontWeight: 600, cursor: 'pointer',
    background: 'none', border: 'none', padding: 0,
    fontSize: 14, fontFamily: 'var(--font-body)', textDecoration: 'underline',
  },
  globalError: {
    background: 'var(--primary-tint)', border: '1px solid var(--primary-light)',
    borderRadius: 'var(--radius-sm)', padding: '12px 16px',
    color: 'var(--primary-dark)', fontSize: 13, marginBottom: 18,
    animation: 'fadeIn 0.3s ease', lineHeight: 1.5,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  pwStrength: (score) => ({
    height: 4, borderRadius: 99, marginTop: 6,
    background: score === 0 ? 'var(--border)' : score <= 1 ? 'var(--primary)' : score === 2 ? 'var(--warning)' : '#5A8A72',
    width: `${Math.max(score * 25, 4)}%`, transition: 'all 0.3s ease',
  }),
  pwHint: (score) => ({
    fontSize: 11, marginTop: 4,
    color: score <= 1 ? 'var(--primary-dark)' : score === 2 ? 'var(--warning)' : 'var(--success)',
  }),
};

function pwScore(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const PW_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

export default function RegisterPage({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [apiError,setApiError]= useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [focused, setFocused] = useState(null);
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    full_name: '', age: '', trimester: null, due_date: '',
  });

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: null }));
    setApiError('');
  };

  const validateStep = (n) => {
    const errs = {};
    if (n === 1) {
      if (!form.username.trim() || form.username.length < 3) errs.username = 'At least 3 characters required.';
      if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Enter a valid email address.';
      if (!form.password || form.password.length < 6) errs.password = 'At least 6 characters required.';
    }
    if (n === 2) {
      if (!form.full_name.trim()) errs.full_name = 'Full name is required.';
      const age = parseInt(form.age);
      if (!form.age || isNaN(age) || age < 10 || age > 70) errs.age = 'Age must be between 10 and 70.';
    }
    if (n === 3) {
      if (!form.trimester) errs.trimester = 'Please select your current trimester.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step < 3) { setStep(s => s + 1); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true); setApiError('');
    try {
      const res = await register({ ...form, age: parseInt(form.age), trimester: form.trimester });
      if (!res.success) {
        const msg = res.errors ? res.errors.join(' · ') : res.error;
        setApiError(msg || 'Registration failed.');
      }
    } catch { setApiError('Cannot connect to server. Make sure Flask is running on port 5000.'); }
    finally { setLoading(false); }
  };

  const score = pwScore(form.password);

  const inp = (key, label, type, placeholder, opts = {}) => (
    <div style={{ ...s.fieldWrap, ...(opts.style || {}) }}>
      <label style={s.label}>{label}</label>
      <div style={s.inputWrap}>
        <input
          type={key === 'password' ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={form[key]}
          min={opts.min} max={opts.max}
          style={s.input(focused === key, !!errors[key])}
          onFocus={() => setFocused(key)}
          onBlur={() => setFocused(null)}
          onChange={e => set(key, e.target.value)}
        />
        {key === 'password' && (
          <button style={s.eye} type="button" onClick={() => setShowPw(p => !p)}>
            {showPw ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
          </button>
        )}
      </div>
      {key === 'password' && form.password && (
        <>
          <div style={s.pwStrength(score)} />
          <span style={s.pwHint(score)}>Password strength: {PW_LABELS[score]}</span>
        </>
      )}
      {errors[key] && <span style={s.errorText}>{errors[key]}</span>}
    </div>
  );

  const stepContent = {
    1: (
      <>
        <div style={s.stepHeader}>
          <span style={s.eyebrow}>Step 1 of 3</span>
          <h2 style={s.title}>Create your<br />account</h2>
          <p style={s.sub}>Choose a username and secure password</p>
        </div>
        {inp('username', 'Username', 'text', 'Choose a username')}
        {inp('email',    'Email Address', 'email', 'your@email.com')}
        {inp('password', 'Password', 'password', 'Min. 6 characters')}
      </>
    ),
    2: (
      <>
        <div style={s.stepHeader}>
          <span style={s.eyebrow}>Step 2 of 3</span>
          <h2 style={s.title}>About you</h2>
          <p style={s.sub}>Help us personalise your experience</p>
        </div>
        {inp('full_name', 'Full Name', 'text', 'Your full name')}
        <div style={s.row2}>
          {inp('age', 'Age', 'number', '25', { min: 10, max: 70 })}
          <div style={s.fieldWrap}>
            <label style={s.label}>Due Date <span style={{ color: 'var(--slate-light)' }}>(optional)</span></label>
            <input
              type="date" value={form.due_date}
              style={s.input(focused === 'due_date', false)}
              onFocus={() => setFocused('due_date')} onBlur={() => setFocused(null)}
              onChange={e => set('due_date', e.target.value)}
            />
          </div>
        </div>
      </>
    ),
    3: (
      <>
        <div style={s.stepHeader}>
          <span style={s.eyebrow}>Step 3 of 3</span>
          <h2 style={s.title}>Your pregnancy<br />stage</h2>
          <p style={s.sub}>Select your current trimester</p>
        </div>
        <div style={s.trimesterGrid}>
          {TRIMESTERS.map(t => {
            const sel = form.trimester === t.value;
            return (
              <div
                key={t.value}
                style={s.trimCard(sel, t)}
                onClick={() => set('trimester', t.value)}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = t.color; }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={s.trimIconWrap(t, sel)}>
                  <t.Icon size={22} color={sel ? '#fff' : t.color} strokeWidth={1.8} />
                </div>
                <div style={s.trimInfo}>
                  <div style={s.trimLabel(sel, t.color)}>{t.label}</div>
                  <div style={s.trimWeeks}>{t.weeks}</div>
                  <div style={s.trimDesc}>{t.desc}</div>
                </div>
                <div style={s.trimCheck(sel, t.color)}>
                  {sel && <Check size={13} color="#fff" strokeWidth={2.5} />}
                </div>
              </div>
            );
          })}
        </div>
        {errors.trimester && <span style={{ ...s.errorText, display: 'block', marginTop: 8 }}>{errors.trimester}</span>}
      </>
    ),
  };

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.orb(280, 280, -60, -60, null, null, 0.04)} />
        <div style={s.orb(160, 160, null, null, 30, -50, 0.06)} />
        <div style={s.orb(90, 90, null, null, 160, 30, 0.03)} />
        <div style={s.leftContent}>
          <div style={s.brandRow}>
            <div style={s.brandIconWrap}>
              <Flower2 size={22} color="#fff" strokeWidth={1.8} />
            </div>
            <span style={s.brandName}>BloomCare AI</span>
          </div>
          <p style={s.progressTitle}>Your progress</p>
          <ul style={s.stepList}>
            {STEPS.map(st => {
              const active = step === st.id;
              const done   = step > st.id;
              return (
                <li key={st.id} style={s.stepItem(active, done)}>
                  <div style={s.stepCircle(active, done)}>
                    {done
                      ? <Check size={16} strokeWidth={2.5} />
                      : <st.Icon size={15} strokeWidth={1.8} />
                    }
                  </div>
                  <div>
                    <div style={s.stepText(active)}>{st.label}</div>
                    <div style={s.stepSub}>
                      {done ? 'Completed' : active ? 'In progress…' : 'Coming up'}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.rightPanel}>
        <div style={s.formWrap}>
          {apiError && (
            <div style={s.globalError}>
              <AlertTriangle size={14} strokeWidth={2} />
              {apiError}
            </div>
          )}
          {stepContent[step]}
          <div style={s.btnRow}>
            {step > 1 && (
              <button
                style={s.backBtn}
                onClick={() => setStep(s => s - 1)}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--blush)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <ArrowLeft size={15} strokeWidth={2} /> Back
              </button>
            )}
            <button
              style={s.nextBtn(loading)}
              onClick={handleNext}
              disabled={loading}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {loading
                ? <><div style={s.spinner} /> Creating account…</>
                : step === 3
                  ? <><Flower2 size={15} strokeWidth={1.8} /> Create My Account</>
                  : <>Continue <ArrowRight size={15} strokeWidth={2} /></>
              }
            </button>
          </div>
          <p style={s.switchText}>
            Already have an account?{' '}
            <button style={s.link} onClick={onSwitchToLogin}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}