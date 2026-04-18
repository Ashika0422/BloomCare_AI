import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Bell, BellOff, Clock, Repeat, Calendar, Zap,
  PauseCircle, PlayCircle, Trash2, Plus, Pill, Check, AlertTriangle,
} from 'lucide-react';

const FREQUENCIES = ['Daily', 'Twice Daily', 'Every Other Day', 'Weekly', 'As Needed'];
const DAYS        = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FREQ_CFG = {
  'Daily':           { Icon: Repeat,   color: '#5A8A72', bg: '#EBF4EF', border: '#A8D5B8' },
  'Twice Daily':     { Icon: Repeat,   color: '#D4924A', bg: '#FDF3E7', border: '#F5C97B' },
  'Every Other Day': { Icon: Calendar, color: '#546A7B', bg: '#EDF2F5', border: '#B8CDD6' },
  'Weekly':          { Icon: Calendar, color: '#be0e83', bg: '#fbd0ed', border: '#f471c8' },
  'As Needed':       { Icon: Zap,      color: '#f141b6', bg: '#fde7f6', border: '#f8a0db' },
};

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

function scheduleNotification(medicine) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;
  const [hours, minutes] = medicine.time_to_take.split(':').map(Number);
  const now = new Date(); const fire = new Date();
  fire.setHours(hours, minutes, 0, 0);
  if (fire <= now) fire.setDate(fire.getDate() + 1);
  const delay = fire.getTime() - now.getTime();
  const timerId = setTimeout(() => {
    new Notification(`Time to take ${medicine.medicine_name}`, {
      body: medicine.notes ? `Note: ${medicine.notes}` : 'Tap to mark as taken.',
      icon: '/favicon.ico', tag: `med-${medicine.id}`, requireInteraction: true,
    });
  }, delay);
  return timerId;
}

const s = {
  page: { maxWidth: 1150, margin: '0 auto', padding: '40px 32px 80px', fontFamily: 'var(--font-body)' },
  pageHeader: { marginBottom: 36, animation: 'fadeUp 0.5s ease both' },
  eyebrow: { display: 'inline-block', background: 'var(--primary-tint)', color: 'var(--primary-dark)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, border: '1px solid var(--primary-light)' },
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, color: 'var(--slate)', letterSpacing: '-0.4px', marginBottom: 6, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 12 },
  pageSub: { fontSize: 15, color: 'var(--slate-mid)' },
  notifBanner: (granted) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderRadius: 'var(--radius-md)', marginBottom: 24, background: granted ? '#EBF4EF' : '#FDF3E7', border: `1px solid ${granted ? '#A8D5B8' : '#F5C97B'}`, animation: 'fadeUp 0.4s ease 0.05s both' }),
  notifLeft: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 },
  notifText: (granted) => ({ color: granted ? '#2D7A4F' : '#9A6B1A', fontWeight: 500 }),
  notifBtn: (granted) => ({ padding: '7px 18px', borderRadius: 99, background: granted ? 'transparent' : '#D4924A', color: granted ? '#9A6B1A' : '#fff', border: `1.5px solid ${granted ? '#F5C97B' : '#D4924A'}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)' }),
  layout: { display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'start' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 20 },
  card: (delay = 0) => ({ background: 'var(--white)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '28px 30px', boxShadow: 'var(--shadow-sm)', animation: `fadeUp 0.5s ease ${delay}ms both` }),
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--slate)', marginBottom: 4 },
  cardSub: { fontSize: 13, color: 'var(--slate-light)', marginBottom: 22 },
  todayProgress: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  progressLabel: { fontSize: 13, color: 'var(--slate-mid)', fontWeight: 500 },
  progressPct: { fontSize: 13, fontWeight: 700, color: 'var(--success)' },
  progressBar: { height: 6, borderRadius: 99, background: 'var(--border)', marginBottom: 20, overflow: 'hidden' },
  progressFill: (pct) => ({ height: '100%', borderRadius: 99, width: `${pct}%`, background: 'linear-gradient(90deg, #5A8A72, #3D6B54)', transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }),
  todayMed: (taken) => ({ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, marginBottom: 10, background: taken ? '#EBF4EF' : 'var(--blush)', border: `1.5px solid ${taken ? '#A8D5B8' : 'var(--border)'}`, transition: 'all 0.2s ease' }),
  todayCheck: (taken) => ({ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: taken ? '#5A8A72' : 'transparent', border: `2px solid ${taken ? '#5A8A72' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }),
  todayMedName: (taken) => ({ flex: 1, fontSize: 15, fontWeight: 600, color: taken ? '#2D7A4F' : 'var(--slate)', textDecoration: taken ? 'line-through' : 'none', transition: 'all 0.2s' }),
  todayMedTime: { fontSize: 12, color: 'var(--slate-light)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 },
  freqPill: (cfg) => ({ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }),
  emptyToday: { textAlign: 'center', padding: '36px 20px', color: 'var(--slate-light)', fontSize: 14 },
  medRow: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px', borderRadius: 14, marginBottom: 10, background: 'var(--blush)', border: '1px solid var(--border)', transition: 'all 0.2s ease' },
  medIconWrap: (cfg) => ({ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  medInfo: { flex: 1, minWidth: 0 },
  medName: { fontSize: 15, fontWeight: 700, color: 'var(--slate)', marginBottom: 3 },
  medMeta: { fontSize: 12, color: 'var(--slate-light)', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 4 },
  medActions: { display: 'flex', gap: 6, flexShrink: 0 },
  iconBtn: (color, bg) => ({ width: 30, height: 30, borderRadius: 8, border: 'none', background: bg, color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }),
  formCard: { background: 'var(--white)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '28px 30px', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 82, animation: 'fadeUp 0.5s ease 0.15s both' },
  fieldWrap: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--slate-mid)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 7 },
  input: (focused, error) => ({ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${error ? 'var(--primary)' : focused ? 'var(--primary)' : 'var(--border)'}`, background: focused ? 'var(--blush)' : '#fdfaf7', fontSize: 14, color: 'var(--slate)', outline: 'none', fontFamily: 'var(--font-body)', transition: 'all 0.2s', boxShadow: focused ? '0 0 0 3px rgba(237,18,164,0.15)' : 'none' }),
  freqGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 },
  freqBtn: (selected, cfg) => ({ padding: '8px 6px', borderRadius: 10, textAlign: 'center', border: `1.5px solid ${selected ? cfg.color : 'var(--border)'}`, background: selected ? cfg.bg : 'var(--blush)', cursor: 'pointer', transition: 'all 0.18s ease', fontFamily: 'var(--font-body)', boxShadow: selected ? `0 0 0 2px ${cfg.color}22` : 'none' }),
  freqBtnLabel: (selected, color) => ({ fontSize: 10, fontWeight: 600, color: selected ? color : 'var(--slate-light)', letterSpacing: '0.03em' }),
  daysRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  dayBtn: (selected) => ({ width: 36, height: 36, borderRadius: '50%', border: selected ? 'none' : '1.5px solid var(--border)', background: selected ? 'var(--primary)' : 'var(--blush)', color: selected ? '#fff' : 'var(--slate-mid)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s ease', fontFamily: 'var(--font-body)' }),
  errorText: { fontSize: 11, color: 'var(--primary-dark)', marginTop: 4, fontWeight: 500 },
  submitBtn: (loading) => ({ width: '100%', padding: '13px', borderRadius: 'var(--radius-md)', marginTop: 4, background: loading ? 'var(--primary-light)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, letterSpacing: '0.03em', transition: 'all 0.2s', fontFamily: 'var(--font-body)', boxShadow: loading ? 'none' : '0 4px 18px rgba(237,18,164,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }),
  spinner: { width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  successMsg: { background: '#EBF4EF', border: '1px solid #A8D5B8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2D7A4F', marginBottom: 16, animation: 'fadeIn 0.3s ease', display: 'flex', alignItems: 'center', gap: 8 },
  errMsg: { background: 'var(--primary-tint)', border: '1px solid var(--primary-light)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--primary-dark)', marginBottom: 16, animation: 'fadeIn 0.3s ease', display: 'flex', alignItems: 'center', gap: 8 },
};

export default function MedicineTracker() {
  const { authFetch } = useAuth();
  const [todayMeds, setTodayMeds] = useState([]);
  const [allMeds,   setAllMeds]   = useState([]);
  const [takenMap,  setTakenMap]  = useState({});
  const [notifPerm, setNotifPerm] = useState(Notification?.permission || 'default');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState('');
  const [formErr,   setFormErr]   = useState('');
  const [fieldErrs, setFieldErrs] = useState({});
  const [focused,   setFocused]   = useState(null);
  const timerRefs = useRef({});
  const [form, setForm] = useState({ medicine_name: '', time_to_take: '', frequency: 'Daily', days_of_week: [], notes: '' });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`bb_taken_${today}`);
    if (saved) { try { setTakenMap(JSON.parse(saved)); } catch {} }
  }, []);

  const fetchData = useCallback(async () => {
    const [t, a] = await Promise.all([authFetch('/medicines/today'), authFetch('/medicines/')]);
    if (t.success) setTodayMeds(t.today);
    if (a.success) setAllMeds(a.medicines);
  }, [authFetch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (notifPerm !== 'granted') return;
    Object.values(timerRefs.current).forEach(clearTimeout);
    timerRefs.current = {};
    allMeds.filter(m => m.is_active).forEach(m => {
      const tid = scheduleNotification(m);
      if (tid) timerRefs.current[m.id] = tid;
    });
    return () => Object.values(timerRefs.current).forEach(clearTimeout);
  }, [allMeds, notifPerm]);

  const toggleTaken = (id) => {
    const newMap = { ...takenMap, [id]: !takenMap[id] };
    setTakenMap(newMap);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`bb_taken_${today}`, JSON.stringify(newMap));
  };

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifPerm(granted ? 'granted' : 'denied');
    if (granted) { setSuccess('Notifications enabled!'); setTimeout(() => setSuccess(''), 3000); }
  };

  const setField = (key, val) => { setForm(p => ({ ...p, [key]: val })); setFieldErrs(p => ({ ...p, [key]: null })); setFormErr(''); };
  const toggleDay = (day) => { setForm(p => ({ ...p, days_of_week: p.days_of_week.includes(day) ? p.days_of_week.filter(d => d !== day) : [...p.days_of_week, day] })); };

  const handleAdd = async () => {
    const errs = {};
    if (!form.medicine_name.trim()) errs.medicine_name = 'Required';
    if (!form.time_to_take) errs.time_to_take = 'Required';
    if (form.frequency === 'Weekly' && !form.days_of_week.length) errs.days_of_week = 'Pick at least one day';
    if (Object.keys(errs).length) { setFieldErrs(errs); return; }
    setLoading(true); setFormErr('');
    const res = await authFetch('/medicines/', { method: 'POST', body: JSON.stringify({ ...form, days_of_week: form.frequency === 'Weekly' ? form.days_of_week : [] }) });
    setLoading(false);
    if (res.success) { setForm({ medicine_name: '', time_to_take: '', frequency: 'Daily', days_of_week: [], notes: '' }); setSuccess('Medicine added successfully!'); setTimeout(() => setSuccess(''), 3000); fetchData(); }
    else { setFormErr(res.errors?.join(' · ') || res.error || 'Failed to add medicine.'); }
  };

  const handleDelete = async (id) => { await authFetch(`/medicines/${id}`, { method: 'DELETE' }); fetchData(); };
  const handleToggleActive = async (id) => { await authFetch(`/medicines/${id}/toggle`, { method: 'PATCH' }); fetchData(); };

  const takenCount = todayMeds.filter(m => takenMap[m.id]).length;
  const totalToday = todayMeds.length;
  const pct        = totalToday ? Math.round((takenCount / totalToday) * 100) : 0;

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <span style={s.eyebrow}>Medicine Tracker</span>
        <h1 style={s.pageTitle}>
          <Pill size={28} color="var(--primary)" strokeWidth={1.6} />
          Your Medications
        </h1>
        <p style={s.pageSub}>Track, manage and get reminded about your prenatal medicines.</p>
      </div>

      {/* Notification banner */}
      <div style={s.notifBanner(notifPerm === 'granted')}>
        <div style={s.notifLeft}>
          {notifPerm === 'granted'
            ? <Bell size={18} color="#2D7A4F" strokeWidth={1.8} />
            : <BellOff size={18} color="#9A6B1A" strokeWidth={1.8} />
          }
          <span style={s.notifText(notifPerm === 'granted')}>
            {notifPerm === 'granted'
              ? "Browser notifications are enabled — you'll be reminded at medicine time."
              : 'Enable browser notifications to get medicine reminders automatically.'}
          </span>
        </div>
        {notifPerm !== 'granted' && (
          <button style={s.notifBtn(false)} onClick={handleRequestNotif}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            Enable Reminders
          </button>
        )}
      </div>

      <div style={s.layout}>
        <div style={s.leftCol}>
          {/* Today */}
          <div style={s.card(100)}>
            <h2 style={s.cardTitle}>Today's Medicines</h2>
            <p style={s.cardSub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            {totalToday > 0 && (
              <>
                <div style={s.todayProgress}>
                  <span style={s.progressLabel}>{takenCount} of {totalToday} taken</span>
                  <span style={s.progressPct}>{pct === 100 ? 'All done!' : `${pct}%`}</span>
                </div>
                <div style={s.progressBar}><div style={s.progressFill(pct)} /></div>
              </>
            )}
            {todayMeds.length === 0 ? (
              <div style={s.emptyToday}>
                <Pill size={40} color="var(--border)" strokeWidth={1.2} style={{ display: 'block', margin: '0 auto 10px' }} />
                No medicines scheduled for today.
              </div>
            ) : todayMeds.map(med => {
              const taken = !!takenMap[med.id];
              const cfg   = FREQ_CFG[med.frequency] || FREQ_CFG['Daily'];
              return (
                <div key={med.id} style={s.todayMed(taken)}
                  onMouseEnter={e => { if (!taken) e.currentTarget.style.borderColor = '#A8D5B8'; }}
                  onMouseLeave={e => { if (!taken) e.currentTarget.style.borderColor = 'var(--border)'; }}>
                  <div style={s.todayCheck(taken)} onClick={() => toggleTaken(med.id)}>
                    {taken && <Check size={14} color="#fff" strokeWidth={2.5} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={s.todayMedName(taken)}>{med.medicine_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={s.todayMedTime}><Clock size={11} strokeWidth={1.8} /> {med.time_to_take}</span>
                      <span style={s.freqPill(cfg)}><cfg.Icon size={9} strokeWidth={2} />{med.frequency}</span>
                    </div>
                  </div>
                  {taken && <span style={{ fontSize: 11, fontWeight: 700, color: '#2D7A4F', background: '#EBF4EF', padding: '2px 9px', borderRadius: 99, border: '1px solid #A8D5B8', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={10} strokeWidth={2.5} /> Taken</span>}
                </div>
              );
            })}
          </div>

          {/* All medicines */}
          <div style={s.card(200)}>
            <h2 style={s.cardTitle}>All Medicines</h2>
            <p style={s.cardSub}>{allMeds.length} medicine{allMeds.length !== 1 ? 's' : ''} in your tracker</p>
            {allMeds.length === 0 ? (
              <div style={s.emptyToday}>
                <Pill size={40} color="var(--border)" strokeWidth={1.2} style={{ display: 'block', margin: '0 auto 10px' }} />
                No medicines added yet.
              </div>
            ) : allMeds.map(med => {
              const cfg = FREQ_CFG[med.frequency] || FREQ_CFG['Daily'];
              return (
                <div key={med.id} style={{ ...s.medRow, opacity: med.is_active ? 1 : 0.55 }}>
                  <div style={s.medIconWrap(cfg)}>
                    <cfg.Icon size={18} color={cfg.color} strokeWidth={1.8} />
                  </div>
                  <div style={s.medInfo}>
                    <div style={s.medName}>{med.medicine_name}</div>
                    <div style={s.medMeta}>
                      <Clock size={11} strokeWidth={1.8} /> {med.time_to_take}
                      &nbsp;·&nbsp;<span style={{ color: cfg.color, fontWeight: 600 }}>{med.frequency}</span>
                      {!med.is_active && <span style={{ color: 'var(--primary)', marginLeft: 6 }}>· Paused</span>}
                    </div>
                  </div>
                  <div style={s.medActions}>
                    <button style={s.iconBtn(med.is_active ? '#9A6B1A' : '#2D7A4F', med.is_active ? '#FDF3E7' : '#EBF4EF')}
                      title={med.is_active ? 'Pause' : 'Resume'} onClick={() => handleToggleActive(med.id)}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                      {med.is_active
                        ? <PauseCircle size={15} strokeWidth={1.8} />
                        : <PlayCircle size={15} strokeWidth={1.8} />
                      }
                    </button>
                    <button style={s.iconBtn('#f141b6', '#fde7f6')} title="Delete" onClick={() => handleDelete(med.id)}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                      <Trash2 size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add form */}
        <div style={s.formCard}>
          <h2 style={{ ...s.cardTitle, marginBottom: 4 }}>Add Medicine</h2>
          <p style={s.cardSub}>Set up a new prescription or supplement</p>
          {success && <div style={s.successMsg}><Check size={14} strokeWidth={2.5} />{success}</div>}
          {formErr  && <div style={s.errMsg}><AlertTriangle size={14} strokeWidth={2} />{formErr}</div>}

          <div style={s.fieldWrap}>
            <label style={s.label}>Medicine Name</label>
            <input value={form.medicine_name} placeholder="e.g. Folic Acid 400mcg"
              style={s.input(focused === 'name', !!fieldErrs.medicine_name)}
              onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
              onChange={e => setField('medicine_name', e.target.value)} />
            {fieldErrs.medicine_name && <span style={s.errorText}>{fieldErrs.medicine_name}</span>}
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Time to Take</label>
            <input type="time" value={form.time_to_take}
              style={s.input(focused === 'time', !!fieldErrs.time_to_take)}
              onFocus={() => setFocused('time')} onBlur={() => setFocused(null)}
              onChange={e => setField('time_to_take', e.target.value)} />
            {fieldErrs.time_to_take && <span style={s.errorText}>{fieldErrs.time_to_take}</span>}
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Frequency</label>
            <div style={s.freqGrid}>
              {FREQUENCIES.map(f => {
                const cfg = FREQ_CFG[f];
                const sel = form.frequency === f;
                return (
                  <div key={f} style={s.freqBtn(sel, cfg)} onClick={() => setField('frequency', f)}>
                    <cfg.Icon size={16} color={sel ? cfg.color : 'var(--slate-light)'} strokeWidth={1.8} style={{ display: 'block', margin: '0 auto 4px' }} />
                    <span style={s.freqBtnLabel(sel, cfg.color)}>{f}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {form.frequency === 'Weekly' && (
            <div style={s.fieldWrap}>
              <label style={s.label}>Days of Week</label>
              <div style={s.daysRow}>
                {DAYS.map(d => (
                  <button key={d} style={s.dayBtn(form.days_of_week.includes(d))} onClick={() => toggleDay(d)}>{d}</button>
                ))}
              </div>
              {fieldErrs.days_of_week && <span style={s.errorText}>{fieldErrs.days_of_week}</span>}
            </div>
          )}

          <div style={s.fieldWrap}>
            <label style={s.label}>Notes <span style={{ color: 'var(--slate-light)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <input value={form.notes} placeholder='"Take with food"'
              style={s.input(focused === 'notes', false)}
              onFocus={() => setFocused('notes')} onBlur={() => setFocused(null)}
              onChange={e => setField('notes', e.target.value)} />
          </div>

          <button style={s.submitBtn(loading)} onClick={handleAdd} disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {loading
              ? <><div style={s.spinner} /> Adding…</>
              : <><Plus size={15} strokeWidth={2.5} /> Add Medicine</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}