import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Leaf, Flower2, Camera, Loader2, X, Check, AlertTriangle } from 'lucide-react';

const TRIMESTERS = [
  { value: 1, label: '1st Trimester', Icon: Leaf,    weeks: 'Weeks 1–12' },
  { value: 2, label: '2nd Trimester', Icon: Flower2, weeks: 'Weeks 13–26' },
  { value: 3, label: '3rd Trimester', Icon: Flower2, weeks: 'Weeks 27–40' },
];

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(44,62,80,0.45)',
    backdropFilter: 'blur(4px)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: 'var(--white)', borderRadius: 'var(--radius-xl)',
    width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(44,62,80,0.25)',
    animation: 'bounceIn 0.35s cubic-bezier(.36,.07,.19,.97) both',
  },
  header: {
    padding: '28px 32px 20px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--slate)' },
  closeBtn: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'var(--blush)', border: '1px solid var(--border)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: '24px 32px 32px' },
  avatarSection: {
    display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28,
    padding: '18px 20px', background: 'var(--blush)',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 30, flexShrink: 0, overflow: 'hidden',
    border: '3px solid var(--white)', boxShadow: '0 4px 12px rgba(177,0,231,0.3)',
  },
  uploadBtn: {
    padding: '8px 18px', borderRadius: 99,
    border: '1.5px solid var(--primary)', background: 'var(--primary-tint)',
    color: 'var(--primary-dark)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s ease',
    fontFamily: 'var(--font-body)', letterSpacing: '0.02em',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  avatarHint: { fontSize: 11, color: 'var(--slate-light)', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border)',
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  fieldWrap: { marginBottom: 14 },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: 'var(--slate-mid)', letterSpacing: '0.04em',
    textTransform: 'uppercase', marginBottom: 6,
  },
  input: (focused) => ({
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
    background: focused ? 'var(--blush)' : 'var(--cream)',
    fontSize: 14, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', transition: 'all 0.2s ease',
    boxShadow: focused ? '0 0 0 3px rgba(177,0,231,0.15)' : 'none',
  }),
  trimRow: { display: 'flex', gap: 8 },
  trimBtn: (selected) => ({
    flex: 1, padding: '10px 8px', borderRadius: 10,
    border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
    background: selected ? 'var(--primary-tint)' : 'var(--cream)',
    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
    fontFamily: 'var(--font-body)',
  }),
  trimBtnIconWrap: { display: 'flex', justifyContent: 'center', marginBottom: 4 },
  trimBtnLabel: (selected) => ({
    fontSize: 11, fontWeight: 600,
    color: selected ? 'var(--primary-dark)' : 'var(--slate-mid)',
  }),
  trimBtnWeeks: { fontSize: 10, color: 'var(--slate-light)' },
  saveBtn: (loading) => ({
    width: '100%', padding: '13px', borderRadius: 'var(--radius-md)',
    background: loading ? 'var(--primary-light)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
    color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: 14, fontWeight: 600, transition: 'all 0.2s ease',
    fontFamily: 'var(--font-body)', letterSpacing: '0.03em',
    boxShadow: loading ? 'none' : '0 4px 16px rgba(177,0,231,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }),
  spinner: {
    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  successMsg: {
    background: 'var(--success-light)', border: '1px solid #A8D5B8',
    borderRadius: 8, padding: '10px 14px', fontSize: 13,
    color: 'var(--success)', marginBottom: 16, animation: 'fadeIn 0.3s ease',
    display: 'flex', alignItems: 'center', gap: 7,
  },
  errorMsg: {
    background: 'var(--primary-tint)', border: '1px solid var(--primary-light)',
    borderRadius: 8, padding: '10px 14px', fontSize: 13,
    color: 'var(--primary-dark)', marginBottom: 16, animation: 'fadeIn 0.3s ease',
    display: 'flex', alignItems: 'center', gap: 7,
  },
};

export default function ProfileModal({ onClose }) {
  const { user, token, updateUser } = useAuth();
  const fileRef = useRef();

  const [form, setForm] = useState({
    full_name: user?.full_name || '', age: user?.age || '',
    trimester: user?.trimester || 1, due_date: user?.due_date || '',
    current_password: '', new_password: '',
  });
  const [focused,   setFocused]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');
  const [preview,   setPreview]   = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setLoading(true); setSuccess(''); setError('');
    try {
      const res = await fetch('http://localhost:5000/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        updateUser(data.user);
        setSuccess('Profile updated successfully!');
        setForm(p => ({ ...p, current_password: '', new_password: '' }));
      } else { setError(data.error || 'Update failed.'); }
    } catch { setError('Connection error.'); }
    finally { setLoading(false); }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('http://localhost:5000/auth/profile/picture', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (data.success) {
        updateUser({ ...user, profile_picture: data.filename });
        setSuccess('Profile picture updated!');
      } else { setError(data.error || 'Upload failed.'); }
    } catch { setError('Upload error.'); }
    finally { setUploading(false); }
  };

  const avatarSrc = preview || (user?.profile_picture ? `http://localhost:5000/auth/uploads/${user.profile_picture}` : null);

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.headerTitle}>Edit Profile</h2>
          <button style={s.closeBtn} onClick={onClose}>
            <X size={16} strokeWidth={2} color="var(--slate-mid)" />
          </button>
        </div>
        <div style={s.body}>
          {success && (
            <div style={s.successMsg}>
              <Check size={14} strokeWidth={2.5} /> {success}
            </div>
          )}
          {error && (
            <div style={s.errorMsg}>
              <AlertTriangle size={14} strokeWidth={2} /> {error}
            </div>
          )}

          {/* Avatar */}
          <div style={s.avatarSection}>
            <div style={s.avatarCircle}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 28, color: '#fff', fontWeight: 700 }}>
                    {user?.full_name?.[0]?.toUpperCase() || '?'}
                  </span>
              }
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--slate)', marginBottom: 6 }}>
                {user?.full_name}
              </div>
              <button style={s.uploadBtn} onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading
                  ? <><Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> Uploading…</>
                  : <><Camera size={13} strokeWidth={1.8} /> Change Photo</>
                }
              </button>
              <p style={s.avatarHint}>PNG, JPG or GIF · Max 5MB</p>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePictureChange} />
            </div>
          </div>

          {/* Personal info */}
          <div style={s.section}>
            <p style={s.sectionTitle}>Personal Information</p>
            <div style={s.fieldWrap}>
              <label style={s.label}>Full Name</label>
              <input value={form.full_name} style={s.input(focused === 'fn')}
                onFocus={() => setFocused('fn')} onBlur={() => setFocused(null)}
                onChange={e => set('full_name', e.target.value)} />
            </div>
            <div style={s.row2}>
              <div style={s.fieldWrap}>
                <label style={s.label}>Age</label>
                <input type="number" min={10} max={70} value={form.age}
                  style={s.input(focused === 'age')}
                  onFocus={() => setFocused('age')} onBlur={() => setFocused(null)}
                  onChange={e => set('age', e.target.value)} />
              </div>
              <div style={s.fieldWrap}>
                <label style={s.label}>Due Date</label>
                <input type="date" value={form.due_date}
                  style={s.input(focused === 'dd')}
                  onFocus={() => setFocused('dd')} onBlur={() => setFocused(null)}
                  onChange={e => set('due_date', e.target.value)} />
              </div>
            </div>
            <div style={s.fieldWrap}>
              <label style={s.label}>Current Trimester</label>
              <div style={s.trimRow}>
                {TRIMESTERS.map(t => (
                  <button key={t.value} style={s.trimBtn(form.trimester === t.value)}
                    onClick={() => set('trimester', t.value)}>
                    <div style={s.trimBtnIconWrap}>
                      <t.Icon
                        size={18}
                        color={form.trimester === t.value ? 'var(--primary-dark)' : 'var(--slate-light)'}
                        strokeWidth={1.8}
                      />
                    </div>
                    <span style={s.trimBtnLabel(form.trimester === t.value)}>{t.label}</span>
                    <div style={s.trimBtnWeeks}>{t.weeks}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Change password */}
          <div style={s.section}>
            <p style={s.sectionTitle}>Change Password <span style={{ color: 'var(--slate-light)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
            <div style={s.fieldWrap}>
              <label style={s.label}>Current Password</label>
              <input type="password" value={form.current_password} placeholder="Enter current password"
                style={s.input(focused === 'cp')}
                onFocus={() => setFocused('cp')} onBlur={() => setFocused(null)}
                onChange={e => set('current_password', e.target.value)} />
            </div>
            <div style={s.fieldWrap}>
              <label style={s.label}>New Password</label>
              <input type="password" value={form.new_password} placeholder="Enter new password"
                style={s.input(focused === 'np')}
                onFocus={() => setFocused('np')} onBlur={() => setFocused(null)}
                onChange={e => set('new_password', e.target.value)} />
            </div>
          </div>

          <button style={s.saveBtn(loading)} onClick={handleSave} disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {loading
              ? <><div style={s.spinner} /> Saving…</>
              : <><Check size={15} strokeWidth={2.5} /> Save Changes</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}