import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

/* ── Category config ────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'Exercise',    icon: '🏃', color: '#5A8A72', bg: '#EBF4EF', border: '#A8D5B8' },
  { value: 'Nutrition',   icon: '🥗', color: '#D4924A', bg: '#FDF3E7', border: '#F5C97B' },
  { value: 'Mindfulness', icon: '🧘', color: '#9B59B6', bg: '#F5EEF8', border: '#D7B8E8' },
  { value: 'Sleep',       icon: '😴', color: '#546A7B', bg: '#EDF2F5', border: '#B8CDD6' },
  { value: 'Hydration',   icon: '💧', color: '#2980B9', bg: '#EBF5FB', border: '#AED6F1' },
  { value: 'Medical',     icon: '🩺', color: '#C0394F', bg: '#FBEEF1', border: '#F4C5CE' },
  { value: 'Personal',    icon: '🌸', color: '#E8667A', bg: '#FBEEF1', border: '#F4C5CE' },
  { value: 'Other',       icon: '⭐', color: '#8FA3B1', bg: '#F0F4F7', border: '#C5D4DC' },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

const CHECKLIST_ITEMS = [
  { key: 'vitamins_taken', label: 'Prenatal vitamins',   icon: '💊', desc: 'Daily essential' },
  { key: 'water_goal_met', label: 'Water intake goal',   icon: '💧', desc: '8+ glasses/day' },
  { key: 'stress_managed', label: 'Stress management',   icon: '🧘', desc: 'Breathe & relax' },
  { key: 'exercise_done',  label: 'Light exercise',      icon: '🚶', desc: '20–30 min walk' },
];

/* ── Styles ─────────────────────────────────────────────────── */
const s = {
  page: {
    maxWidth: 1150, margin: '0 auto',
    padding: '40px 32px 80px',
    fontFamily: 'var(--font-body)',
  },
  pageHeader: { marginBottom: 36, animation: 'fadeUp 0.5s ease both' },
  eyebrow: {
    display: 'inline-block', background: 'var(--rose-light)', color: 'var(--rose-dark)',
    fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
    border: '1px solid var(--rose-mid)',
  },
  pageTitle: {
    fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600,
    color: 'var(--slate)', letterSpacing: '-0.4px', marginBottom: 6, lineHeight: 1.2,
  },
  pageSub: { fontSize: 15, color: 'var(--slate-mid)' },

  /* Stats row */
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14, marginBottom: 28,
    animation: 'fadeUp 0.5s ease 0.05s both',
  },
  statCard: (color) => ({
    background: 'var(--white)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', padding: '18px 20px',
    boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden',
  }),
  statAccent: (color) => ({
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: color, borderRadius: '10px 10px 0 0',
  }),
  statIcon: { fontSize: 22, marginBottom: 8, marginTop: 6 },
  statVal: {
    fontFamily: 'var(--font-display)', fontSize: 26,
    fontWeight: 600, color: 'var(--slate)', lineHeight: 1, marginBottom: 4,
  },
  statLabel: { fontSize: 11, color: 'var(--slate-light)', fontWeight: 500 },

  /* Main layout */
  layout: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 20, alignItems: 'start',
  },
  fullRow: { gridColumn: '1 / -1' },

  card: (delay = 0) => ({
    background: 'var(--white)', borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)', padding: '26px 28px',
    boxShadow: 'var(--shadow-sm)',
    animation: `fadeUp 0.5s ease ${delay}ms both`,
  }),
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: {
    fontFamily: 'var(--font-display)', fontSize: 19,
    fontWeight: 600, color: 'var(--slate)',
  },
  cardSub: { fontSize: 12, color: 'var(--slate-light)', marginBottom: 20 },

  /* Daily checklist */
  checkItem: (done) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', borderRadius: 12, marginBottom: 8,
    background: done ? '#EBF4EF' : 'var(--blush)',
    border: `1.5px solid ${done ? '#A8D5B8' : 'var(--border)'}`,
    cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none',
  }),
  checkBox: (done) => ({
    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
    background: done ? '#5A8A72' : 'transparent',
    border: `2px solid ${done ? '#5A8A72' : 'var(--border)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, color: '#fff', transition: 'all 0.2s ease',
  }),
  checkIcon: { fontSize: 18, flexShrink: 0 },
  checkInfo: { flex: 1 },
  checkLabel: (done) => ({
    fontSize: 14, fontWeight: 600, color: done ? '#2D7A4F' : 'var(--slate)',
    textDecoration: done ? 'line-through' : 'none', transition: 'all 0.2s',
  }),
  checkDesc: { fontSize: 11, color: 'var(--slate-light)', marginTop: 1 },

  /* Sleep & water */
  metricsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 },
  metricCard: (color, bg, border) => ({
    background: bg, borderRadius: 12, padding: '14px 16px',
    border: `1px solid ${border}`,
  }),
  metricLabel: (color) => ({
    fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: 8,
  }),
  metricInputRow: { display: 'flex', alignItems: 'center', gap: 8 },
  metricInput: (focused) => ({
    flex: 1, padding: '9px 12px', borderRadius: 10,
    border: `1.5px solid ${focused ? 'var(--rose)' : 'var(--border)'}`,
    background: focused ? 'var(--blush)' : 'var(--white)',
    fontSize: 15, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', fontWeight: 600,
    transition: 'all 0.2s',
  }),
  metricUnit: (color) => ({
    fontSize: 12, fontWeight: 600, color, whiteSpace: 'nowrap',
  }),
  saveMetricsBtn: {
    marginTop: 14, padding: '9px 20px', borderRadius: 99,
    background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
    color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13,
    fontWeight: 600, transition: 'all 0.2s', fontFamily: 'var(--font-body)',
    boxShadow: '0 3px 12px rgba(192,57,79,0.25)',
  },
  savedBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 12, fontWeight: 600, color: '#2D7A4F',
    background: '#EBF4EF', padding: '5px 12px', borderRadius: 99,
    border: '1px solid #A8D5B8', marginTop: 10,
    animation: 'fadeIn 0.3s ease',
  },

  /* Goals */
  addGoalBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 99,
    background: 'var(--rose-light)', border: '1.5px solid var(--rose-mid)',
    color: 'var(--rose-dark)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
  },
  goalCard: (cfg) => ({
    background: 'var(--blush)', borderRadius: 14, padding: '16px',
    border: '1px solid var(--border)', marginBottom: 10,
    transition: 'all 0.2s ease',
  }),
  goalTop: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  goalCatBadge: (cfg) => ({
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: cfg.bg, border: `1px solid ${cfg.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
  }),
  goalTitle: { fontSize: 14, fontWeight: 700, color: 'var(--slate)', flex: 1, lineHeight: 1.4 },
  goalMeta: { fontSize: 11, color: 'var(--slate-light)', marginTop: 2 },
  goalProgressRow: { display: 'flex', alignItems: 'center', gap: 10 },
  goalBarTrack: { flex: 1, height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' },
  goalBarFill: (pct, color) => ({
    height: '100%', borderRadius: 99, background: color,
    width: `${Math.min(pct, 100)}%`, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
  }),
  goalPct: (color) => ({
    fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: 'right',
  }),
  goalControls: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 },
  progressInput: {
    width: 70, padding: '5px 8px', borderRadius: 8,
    border: '1.5px solid var(--border)', background: 'var(--white)',
    fontSize: 13, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', textAlign: 'center',
  },
  updateBtn: (cfg) => ({
    padding: '5px 12px', borderRadius: 99,
    background: cfg.bg, border: `1.5px solid ${cfg.border}`,
    color: cfg.color, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
  }),
  deleteGoalBtn: {
    marginLeft: 'auto', width: 28, height: 28, borderRadius: 8, border: 'none',
    background: 'var(--rose-light)', color: 'var(--rose-dark)',
    cursor: 'pointer', fontSize: 12, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
  completeBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
    background: '#EBF4EF', color: '#2D7A4F', border: '1px solid #A8D5B8',
    letterSpacing: '0.04em',
  },

  /* Add goal form */
  addGoalForm: {
    background: 'var(--blush)', borderRadius: 14, padding: '18px',
    border: '1.5px solid var(--rose-mid)', marginBottom: 14,
    animation: 'fadeIn 0.3s ease',
  },
  formRow2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  fLabel: {
    display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)',
    letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 5,
  },
  fInput: (focused) => ({
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: `1.5px solid ${focused ? 'var(--rose)' : 'var(--border)'}`,
    background: focused ? 'var(--white)' : 'var(--blush)',
    fontSize: 13, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', transition: 'all 0.18s',
  }),
  catGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12,
  },
  catBtn: (selected, cfg) => ({
    padding: '7px 4px', borderRadius: 8, textAlign: 'center',
    border: `1.5px solid ${selected ? cfg.color : 'var(--border)'}`,
    background: selected ? cfg.bg : 'var(--white)',
    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
  }),
  catBtnEmoji: { fontSize: 16, display: 'block', marginBottom: 2 },
  catBtnLabel: (selected, color) => ({
    fontSize: 9, fontWeight: 600, color: selected ? color : 'var(--slate-light)',
    letterSpacing: '0.03em',
  }),
  formActions: { display: 'flex', gap: 8 },
  cancelBtn: {
    flex: 1, padding: '9px', borderRadius: 10, border: '1.5px solid var(--border)',
    background: 'transparent', color: 'var(--slate-mid)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  confirmBtn: {
    flex: 2, padding: '9px', borderRadius: 10,
    background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
    boxShadow: '0 3px 12px rgba(192,57,79,0.25)',
    transition: 'all 0.2s',
  },
};

/* ── Main component ─────────────────────────────────────────── */
export default function GoalTracker() {
  const { authFetch } = useAuth();

  const [checklist,  setChecklist]  = useState(null);
  const [goals,      setGoals]      = useState([]);
  const [stats,      setStats]      = useState(null);
  const [sleepVal,   setSleepVal]   = useState('');
  const [waterVal,   setWaterVal]   = useState('');
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [metricsSaved,  setMetricsSaved]  = useState(false);
  const [focused,    setFocused]    = useState(null);
  const [showAddForm,setShowAddForm]= useState(false);
  const [progEdits,  setProgEdits]  = useState({});  // goalId → string value

  const [newGoal, setNewGoal] = useState({
    title: '', category: 'Exercise', target_value: '100', current_progress: '0',
  });
  const [addingGoal, setAddingGoal] = useState(false);
  const [addFormFocused, setAddFormFocused] = useState(null);

  /* ── Fetch ─────────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    const [cl, gl, st] = await Promise.all([
      authFetch('/goals/checklist/today'),
      authFetch('/goals/'),
      authFetch('/goals/stats'),
    ]);
    if (cl.success) {
      setChecklist(cl.checklist);
      setSleepVal(cl.checklist.sleep_hours ?? '');
      setWaterVal(cl.checklist.water_liters ?? '');
    }
    if (gl.success) setGoals(gl.goals);
    if (st.success) setStats(st.stats);
  }, [authFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Toggle checklist ─────────────────────────────────────── */
  const toggleCheck = async (key) => {
    if (!checklist) return;
    const newVal = !checklist[key];
    setChecklist(p => ({ ...p, [key]: newVal }));
    await authFetch('/goals/checklist/today', {
      method: 'PUT', body: JSON.stringify({ [key]: newVal }),
    });
  };

  /* ── Save metrics ─────────────────────────────────────────── */
  const saveMetrics = async () => {
    setSavingMetrics(true);
    const payload = {};
    if (sleepVal !== '') payload.sleep_hours  = parseFloat(sleepVal) || 0;
    if (waterVal !== '') payload.water_liters = parseFloat(waterVal) || 0;
    const res = await authFetch('/goals/checklist/today', {
      method: 'PUT', body: JSON.stringify(payload),
    });
    if (res.success) {
      setMetricsSaved(true);
      setTimeout(() => setMetricsSaved(false), 2500);
    }
    setSavingMetrics(false);
  };

  /* ── Add goal ─────────────────────────────────────────────── */
  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) return;
    setAddingGoal(true);
    const res = await authFetch('/goals/', {
      method: 'POST',
      body: JSON.stringify({
        ...newGoal,
        target_value:     parseInt(newGoal.target_value) || 100,
        current_progress: parseInt(newGoal.current_progress) || 0,
      }),
    });
    if (res.success) {
      setGoals(p => [res.goal, ...p]);
      setNewGoal({ title: '', category: 'Exercise', target_value: '100', current_progress: '0' });
      setShowAddForm(false);
    }
    setAddingGoal(false);
  };

  /* ── Update progress ──────────────────────────────────────── */
  const handleUpdateProgress = async (goal) => {
    const val = parseInt(progEdits[goal.id] ?? goal.current_progress);
    if (isNaN(val)) return;
    const clamped = Math.max(0, Math.min(val, goal.target_value));
    const res = await authFetch(`/goals/${goal.id}`, {
      method: 'PUT', body: JSON.stringify({ current_progress: clamped }),
    });
    if (res.success) {
      setGoals(p => p.map(g => g.id === goal.id ? res.goal : g));
      setProgEdits(p => { const n = { ...p }; delete n[goal.id]; return n; });
    }
  };

  /* ── Delete goal ──────────────────────────────────────────── */
  const handleDeleteGoal = async (id) => {
    await authFetch(`/goals/${id}`, { method: 'DELETE' });
    setGoals(p => p.filter(g => g.id !== id));
  };

  /* ── Derived ──────────────────────────────────────────────── */
  const checkDone  = checklist ? CHECKLIST_ITEMS.filter(i => checklist[i.key]).length : 0;
  const checkTotal = CHECKLIST_ITEMS.length;
  const checkPct   = Math.round((checkDone / checkTotal) * 100);
  const completedGoals = goals.filter(g => g.current_progress >= g.target_value).length;

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.pageHeader}>
        <span style={s.eyebrow}>Goal Tracker</span>
        <h1 style={s.pageTitle}>Wellness Goals 🎯</h1>
        <p style={s.pageSub}>Daily habits, sleep tracking, and custom weekly goals — all in one place.</p>
      </div>

      {/* Stats row */}
      <div style={s.statsRow}>
        {[
          { icon: '✅', label: 'Today\'s Habits',   val: `${checkDone}/${checkTotal}`,         color: '#5A8A72' },
          { icon: '🎯', label: 'Active Goals',       val: goals.length,                         color: '#D4924A' },
          { icon: '🏆', label: 'Goals Completed',    val: completedGoals,                       color: '#C0394F' },
          { icon: '😴', label: 'Avg Sleep (7 days)', val: stats ? `${stats.avg_sleep}h` : '—', color: '#546A7B' },
        ].map((st, i) => (
          <div key={i} style={s.statCard(st.color)}>
            <div style={s.statAccent(st.color)} />
            <div style={{ ...s.statIcon }}>{st.icon}</div>
            <div style={s.statVal}>{st.val}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={s.layout}>

        {/* Daily checklist */}
        <div style={s.card(100)}>
          <div style={s.cardHeader}>
            <div>
              <h2 style={s.cardTitle}>Daily Habits</h2>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
              background: checkPct === 100 ? '#EBF4EF' : 'var(--blush)',
              color: checkPct === 100 ? '#2D7A4F' : 'var(--slate-mid)',
              border: `1px solid ${checkPct === 100 ? '#A8D5B8' : 'var(--border)'}`,
            }}>
              {checkPct === 100 ? '🎉 Perfect day!' : `${checkDone}/${checkTotal}`}
            </span>
          </div>
          <p style={s.cardSub}>Resets daily at midnight</p>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', marginBottom: 18, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, width: `${checkPct}%`,
              background: 'linear-gradient(90deg, var(--rose), var(--rose-dark))',
              transition: 'width 0.5s ease',
            }} />
          </div>

          {CHECKLIST_ITEMS.map(item => {
            const done = checklist?.[item.key] || false;
            return (
              <div key={item.key} style={s.checkItem(done)} onClick={() => toggleCheck(item.key)}>
                <div style={s.checkBox(done)}>{done && '✓'}</div>
                <span style={s.checkIcon}>{item.icon}</span>
                <div style={s.checkInfo}>
                  <div style={s.checkLabel(done)}>{item.label}</div>
                  <div style={s.checkDesc}>{item.desc}</div>
                </div>
              </div>
            );
          })}

          {/* Sleep & water */}
          <div style={s.metricsRow}>
            <div style={s.metricCard('#546A7B', '#EDF2F5', '#B8CDD6')}>
              <div style={s.metricLabel('#546A7B')}>😴 Sleep</div>
              <div style={s.metricInputRow}>
                <input
                  type="number" min={0} max={24} step={0.5}
                  placeholder="7.5"
                  value={sleepVal}
                  style={s.metricInput(focused === 'sleep')}
                  onFocus={() => setFocused('sleep')}
                  onBlur={() => setFocused(null)}
                  onChange={e => setSleepVal(e.target.value)}
                />
                <span style={s.metricUnit('#546A7B')}>hrs</span>
              </div>
            </div>
            <div style={s.metricCard('#2980B9', '#EBF5FB', '#AED6F1')}>
              <div style={s.metricLabel('#2980B9')}>💧 Water</div>
              <div style={s.metricInputRow}>
                <input
                  type="number" min={0} max={10} step={0.1}
                  placeholder="2.0"
                  value={waterVal}
                  style={s.metricInput(focused === 'water')}
                  onFocus={() => setFocused('water')}
                  onBlur={() => setFocused(null)}
                  onChange={e => setWaterVal(e.target.value)}
                />
                <span style={s.metricUnit('#2980B9')}>litres</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              style={s.saveMetricsBtn}
              onClick={saveMetrics}
              disabled={savingMetrics}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {savingMetrics ? 'Saving…' : 'Save Today\'s Log'}
            </button>
            {metricsSaved && <span style={s.savedBadge}>✓ Saved!</span>}
          </div>
        </div>

        {/* Weekly goals */}
        <div style={s.card(180)}>
          <div style={s.cardHeader}>
            <div>
              <h2 style={s.cardTitle}>Weekly Goals</h2>
            </div>
            <button
              style={s.addGoalBtn}
              onClick={() => setShowAddForm(p => !p)}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--rose)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--rose-light)'; e.currentTarget.style.color = 'var(--rose-dark)'; }}
            >
              {showAddForm ? '✕ Cancel' : '+ Add Goal'}
            </button>
          </div>
          <p style={s.cardSub}>{goals.length} goal{goals.length !== 1 ? 's' : ''} · {completedGoals} completed</p>

          {/* Add goal form */}
          {showAddForm && (
            <div style={s.addGoalForm}>
              <div style={s.formRow2}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.fLabel}>Goal Title</label>
                  <input
                    placeholder="e.g. Walk 30 min daily"
                    value={newGoal.title}
                    style={s.fInput(addFormFocused === 'title')}
                    onFocus={() => setAddFormFocused('title')}
                    onBlur={() => setAddFormFocused(null)}
                    onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={s.fLabel}>Target</label>
                  <input
                    type="number" min={1} max={1000}
                    placeholder="100"
                    value={newGoal.target_value}
                    style={s.fInput(addFormFocused === 'target')}
                    onFocus={() => setAddFormFocused('target')}
                    onBlur={() => setAddFormFocused(null)}
                    onChange={e => setNewGoal(p => ({ ...p, target_value: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={s.fLabel}>Starting At</label>
                  <input
                    type="number" min={0}
                    placeholder="0"
                    value={newGoal.current_progress}
                    style={s.fInput(addFormFocused === 'prog')}
                    onFocus={() => setAddFormFocused('prog')}
                    onBlur={() => setAddFormFocused(null)}
                    onChange={e => setNewGoal(p => ({ ...p, current_progress: e.target.value }))}
                  />
                </div>
              </div>

              <label style={s.fLabel}>Category</label>
              <div style={s.catGrid}>
                {CATEGORIES.map(cat => (
                  <div
                    key={cat.value}
                    style={s.catBtn(newGoal.category === cat.value, cat)}
                    onClick={() => setNewGoal(p => ({ ...p, category: cat.value }))}
                  >
                    <span style={s.catBtnEmoji}>{cat.icon}</span>
                    <span style={s.catBtnLabel(newGoal.category === cat.value, cat.color)}>
                      {cat.value}
                    </span>
                  </div>
                ))}
              </div>

              <div style={s.formActions}>
                <button style={s.cancelBtn} onClick={() => setShowAddForm(false)}>Cancel</button>
                <button
                  style={s.confirmBtn}
                  onClick={handleAddGoal}
                  disabled={addingGoal || !newGoal.title.trim()}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  {addingGoal ? 'Adding…' : '🎯 Add Goal'}
                </button>
              </div>
            </div>
          )}

          {/* Goals list */}
          {goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--slate-light)', fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎯</div>
              No goals yet. Add your first weekly goal above.
            </div>
          ) : (
            goals.map(goal => {
              const cfg = CAT_MAP[goal.category] || CAT_MAP['Other'];
              const pct = Math.round((goal.current_progress / goal.target_value) * 100);
              const done = goal.current_progress >= goal.target_value;
              const editVal = progEdits[goal.id] ?? String(goal.current_progress);

              return (
                <div key={goal.id} style={s.goalCard(cfg)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose-mid)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={s.goalTop}>
                    <div style={s.goalCatBadge(cfg)}>{cfg.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={s.goalTitle}>{goal.title}</span>
                        {done && <span style={s.completeBadge}>🏆 DONE</span>}
                      </div>
                      <div style={s.goalMeta}>
                        <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.value || goal.category}</span>
                        {' · '}{goal.current_progress} / {goal.target_value}
                      </div>
                    </div>
                    <button
                      style={s.deleteGoalBtn}
                      onClick={() => handleDeleteGoal(goal.id)}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--rose)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--rose-light)'; e.currentTarget.style.color = 'var(--rose-dark)'; }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={s.goalProgressRow}>
                    <div style={s.goalBarTrack}>
                      <div style={s.goalBarFill(pct, done ? '#5A8A72' : cfg.color)} />
                    </div>
                    <span style={s.goalPct(done ? '#2D7A4F' : cfg.color)}>{pct}%</span>
                  </div>

                  {!done && (
                    <div style={s.goalControls}>
                      <span style={{ fontSize: 12, color: 'var(--slate-light)' }}>Update progress:</span>
                      <input
                        type="number" min={0} max={goal.target_value}
                        value={editVal}
                        style={s.progressInput}
                        onChange={e => setProgEdits(p => ({ ...p, [goal.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateProgress(goal)}
                      />
                      <span style={{ fontSize: 12, color: 'var(--slate-light)' }}>/ {goal.target_value}</span>
                      <button
                        style={s.updateBtn(cfg)}
                        onClick={() => handleUpdateProgress(goal)}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                      >
                        Update
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Weekly stats summary */}
        {stats && (
          <div style={{ ...s.card(260), ...s.fullRow }}>
            <h2 style={s.cardTitle}>7-Day Wellness Summary</h2>
            <p style={s.cardSub}>How consistent you've been this week</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
              {[
                { label: 'Vitamins',  val: `${stats.vitamins_days}/7`,  icon: '💊', color: '#D4924A', pct: (stats.vitamins_days / 7) * 100 },
                { label: 'Water Goal',val: `${stats.water_days}/7`,     icon: '💧', color: '#2980B9', pct: (stats.water_days / 7) * 100 },
                { label: 'Stress Mgmt',val:`${stats.stress_days}/7`,    icon: '🧘', color: '#9B59B6', pct: (stats.stress_days / 7) * 100 },
                { label: 'Exercise',  val: `${stats.exercise_days}/7`,  icon: '🏃', color: '#5A8A72', pct: (stats.exercise_days / 7) * 100 },
                { label: 'Avg Sleep', val: `${stats.avg_sleep}h`,       icon: '😴', color: '#546A7B', pct: Math.min((stats.avg_sleep / 9) * 100, 100) },
                { label: 'Avg Water', val: `${stats.avg_water}L`,       icon: '🚰', color: '#1A8FC1', pct: Math.min((stats.avg_water / 3) * 100, 100) },
              ].map((item, i) => (
                <div key={i} style={{
                  textAlign: 'center', padding: '16px 10px',
                  background: 'var(--blush)', borderRadius: 12,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.color, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                    {item.val}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--slate-light)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
                    {item.label}
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99, background: item.color,
                      width: `${item.pct}%`, transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}