import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

/* ── Trimester timeline data ───────────────────────────────── */
const TRIMESTER_DATA = {
  1: {
    emoji: '🌱', label: 'First Trimester', weeks: 'Weeks 1–12',
    color: '#5A8A72', light: '#EBF4EF', border: '#A8D5B8',
    milestones: ['Heart begins beating', 'Brain & spine forming', 'Fingers & toes developing', 'End of embryonic period'],
    tip: 'Take folic acid daily. Stay hydrated and rest when tired.',
    bg: 'linear-gradient(135deg, #EBF4EF 0%, #D4EDDA 100%)',
  },
  2: {
    emoji: '🌷', label: 'Second Trimester', weeks: 'Weeks 13–26',
    color: '#D4924A', light: '#FDF3E7', border: '#F5C97B',
    milestones: ['Baby can hear your voice', 'Movements felt (quickening)', 'Gender can be detected', 'Eyebrows & lashes appear'],
    tip: 'Gentle exercise like walking or swimming is beneficial. Monitor weight gain.',
    bg: 'linear-gradient(135deg, #FDF3E7 0%, #FAECD4 100%)',
  },
  3: {
    emoji: '🌸', label: 'Third Trimester', weeks: 'Weeks 27–40',
    color: '#8A00F3', light: '#F5E6FF', border: '#E8CCFF',
    milestones: ['Baby opens eyes', 'Lungs maturing', 'Rapid weight gain', 'Baby moves into head-down position'],
    tip: 'Prepare your birth plan. Attend all prenatal appointments.',
    bg: 'linear-gradient(135deg, #F5E6FF 0%, #EDD5FF 100%)',
  },
};

const MOOD_CONFIG = {
  Happy:    { emoji: '😊', color: '#5A8A72', bg: '#EBF4EF' },
  Excited:  { emoji: '🤩', color: '#D4924A', bg: '#FDF3E7' },
  Calm:     { emoji: '😌', color: '#546A7B', bg: '#EDF2F5' },
  Grateful: { emoji: '🙏', color: '#9B59B6', bg: '#F5EEF8' },
  Tired:    { emoji: '😴', color: '#8FA3B1', bg: '#F0F4F7' },
  Anxious:  { emoji: '😰', color: '#D4924A', bg: '#FDF3E7' },
  Sad:      { emoji: '😢', color: '#8A00F3', bg: '#F5E6FF' },
};

const RISK_CONFIG = {
  0: { label: 'Low Risk',  color: '#5A8A72', bg: '#EBF4EF', icon: '🟢' },
  1: { label: 'Mid Risk',  color: '#D4924A', bg: '#FDF3E7', icon: '🟡' },
  2: { label: 'High Risk', color: '#8A00F3', bg: '#F5E6FF', icon: '🔴' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function daysUntilDue(dueDateStr) {
  if (!dueDateStr) return null;
  const diff = new Date(dueDateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/* ── Styles ─────────────────────────────────────────────────── */
const s = {
  page: {
    maxWidth: 1200, margin: '0 auto',
    padding: '40px 32px 80px',
    fontFamily: 'var(--font-body)',
  },

  /* Hero greeting */
  hero: {
    borderRadius: 'var(--radius-xl)',
    padding: '36px 40px',
    marginBottom: 28,
    position: 'relative', overflow: 'hidden',
    animation: 'fadeUp 0.5s ease both',
  },
  heroOrb1: {
    position: 'absolute', width: 220, height: 220, borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)', top: -60, right: 60, pointerEvents: 'none',
  },
  heroOrb2: {
    position: 'absolute', width: 140, height: 140, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)', bottom: -40, right: 200, pointerEvents: 'none',
  },
  heroContent: { position: 'relative', zIndex: 1 },
  greeting: { fontSize: 14, fontWeight: 600, opacity: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 },
  heroName: {
    fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 600,
    lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.4px',
  },
  heroSub: { fontSize: 15, opacity: 0.8, lineHeight: 1.6, maxWidth: 480 },
  heroBadgeRow: { display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' },
  heroBadge: (bg, color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: bg, color,
    fontSize: 12, fontWeight: 600, padding: '5px 12px',
    borderRadius: 99, border: `1px solid ${color}33`,
  }),

  /* Stats row */
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16, marginBottom: 28,
    animation: 'fadeUp 0.5s ease 0.1s both',
  },
  statCard: {
    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '22px 24px',
    boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden',
  },
  statAccent: (color) => ({
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: color, borderRadius: '14px 14px 0 0',
  }),
  statIcon: { fontSize: 26, marginBottom: 10 },
  statVal: {
    fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600,
    color: 'var(--slate)', lineHeight: 1, marginBottom: 5,
  },
  statLabel: { fontSize: 12, color: 'var(--slate-light)', fontWeight: 500, letterSpacing: '0.02em' },

  /* Two-column layout */
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 20, marginBottom: 20,
  },
  grid3: {
    display: 'grid', gridTemplateColumns: '2fr 1fr',
    gap: 20, marginBottom: 20,
  },

  /* Cards */
  card: (delay = 0) => ({
    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '28px',
    boxShadow: 'var(--shadow-sm)',
    animation: `fadeUp 0.5s ease ${delay}ms both`,
  }),
  cardTitle: {
    fontFamily: 'var(--font-display)', fontSize: 19,
    fontWeight: 600, color: 'var(--slate)', marginBottom: 4, letterSpacing: '-0.2px',
  },
  cardSub: { fontSize: 12, color: 'var(--slate-light)', marginBottom: 20 },

  /* Trimester timeline */
  trimHeader: (cfg) => ({
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '16px 20px', borderRadius: 'var(--radius-md)',
    background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 20,
  }),
  trimEmoji: { fontSize: 36 },
  trimLabel: (color) => ({
    fontFamily: 'var(--font-display)', fontSize: 20,
    fontWeight: 600, color, marginBottom: 2,
  }),
  trimWeeks: { fontSize: 12, color: 'var(--slate-light)' },
  milestoneList: { display: 'flex', flexDirection: 'column', gap: 8 },
  milestone: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13, color: 'var(--slate)',
  },
  milestoneDot: (color) => ({
    width: 8, height: 8, borderRadius: '50%',
    background: color, flexShrink: 0,
  }),
  tipBox: (cfg) => ({
    marginTop: 18, padding: '12px 16px',
    background: cfg.light, borderRadius: 10,
    border: `1px solid ${cfg.border}`,
    fontSize: 13, color: cfg.color, lineHeight: 1.6,
  }),

  /* Checklist */
  checkItem: (done) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 14px', borderRadius: 10, marginBottom: 8,
    background: done ? 'var(--success-light)' : 'var(--blush)',
    border: `1px solid ${done ? '#A8D5B8' : 'var(--border)'}`,
    cursor: 'pointer', transition: 'all 0.2s ease',
    userSelect: 'none',
  }),
  checkBox: (done) => ({
    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
    background: done ? 'var(--success)' : 'transparent',
    border: `2px solid ${done ? 'var(--success)' : 'var(--border)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, color: '#fff', transition: 'all 0.2s ease',
  }),
  checkLabel: (done) => ({
    fontSize: 14, fontWeight: 500, flex: 1,
    color: done ? 'var(--success)' : 'var(--slate)',
    textDecoration: done ? 'line-through' : 'none',
    transition: 'all 0.2s',
  }),

  /* Numeric inputs */
  numRow: { display: 'flex', gap: 12, marginTop: 16 },
  numField: { flex: 1 },
  numLabel: { fontSize: 11, fontWeight: 600, color: 'var(--slate-mid)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  numInput: (focused) => ({
    width: '100%', padding: '10px 14px',
    borderRadius: 10, border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
    background: focused ? 'var(--blush)' : 'var(--cream)',
    fontSize: 15, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', transition: 'all 0.2s',
    boxShadow: focused ? '0 0 0 3px rgba(177,0,231,0.15)' : 'none',
  }),
  saveBtn: {
    marginTop: 16, padding: '10px 22px', borderRadius: 99,
    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, letterSpacing: '0.03em',
    transition: 'all 0.2s', fontFamily: 'var(--font-body)',
    boxShadow: '0 3px 14px rgba(177,0,231,0.3)',
  },

  /* Last risk */
  riskBanner: (cfg) => ({
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '18px 20px', borderRadius: 'var(--radius-md)',
    background: cfg.bg, border: `1.5px solid ${cfg.color}44`,
  }),
  riskIcon: { fontSize: 32 },
  riskLabel: (color) => ({
    fontFamily: 'var(--font-display)', fontSize: 18,
    fontWeight: 600, color, marginBottom: 2,
  }),
  riskMeta: { fontSize: 12, color: 'var(--slate-light)' },
  riskConf: (color) => ({
    marginLeft: 'auto', textAlign: 'right',
    fontSize: 22, fontWeight: 700, color,
    fontFamily: 'var(--font-display)',
  }),

  /* Mood week */
  moodRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  moodChip: (cfg) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 99,
    background: cfg.bg, border: `1px solid ${cfg.color}33`,
    fontSize: 13,
  }),
  moodCount: (color) => ({ fontSize: 12, fontWeight: 700, color }),

  /* Shortcut grid */
  shortcuts: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
  },
  shortcut: (color, bg) => ({
    padding: '16px', borderRadius: 'var(--radius-md)',
    background: bg, border: `1px solid ${color}33`,
    cursor: 'pointer', textAlign: 'center',
    transition: 'all 0.2s ease',
  }),
  shortcutIcon: { fontSize: 24, marginBottom: 6, display: 'block' },
  shortcutLabel: (color) => ({
    fontSize: 12, fontWeight: 600, color, letterSpacing: '0.02em',
  }),
};

/* ── Checklist items ─────────────────────────────────────── */
const CHECKLIST_ITEMS = [
  { key: 'vitamins_taken', label: 'Took prenatal vitamins',   icon: '💊' },
  { key: 'water_goal_met', label: 'Met water intake goal',    icon: '💧' },
  { key: 'stress_managed', label: 'Managed stress levels',    icon: '🧘' },
  { key: 'exercise_done',  label: 'Completed light exercise', icon: '🚶' },
];

const SHORTCUTS = [
  { icon: '🩺', label: 'Risk Analysis', page: 'risk',      color: '#8A00F3', bg: '#F5E6FF' },
  { icon: '💬', label: 'AI Chat',       page: 'chat',      color: '#546A7B', bg: '#EDF2F5' },
  { icon: '💊', label: 'Medicines',     page: 'medicines', color: '#D4924A', bg: '#FDF3E7' },
  { icon: '🎯', label: 'Goals',         page: 'goals',     color: '#5A8A72', bg: '#EBF4EF' },
  { icon: '📔', label: 'Journal',       page: 'journal',   color: '#9B59B6', bg: '#F5EEF8' },
  { icon: '📊', label: 'Stats',         page: 'stats',     color: '#2C3E50', bg: '#F0F4F7' },
];

export default function MainDashboard({ onNavigate }) {
  const { user, authFetch } = useAuth();

  const [summary,   setSummary]   = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [focused,   setFocused]   = useState(null);
  const [sleepVal,  setSleepVal]  = useState('');
  const [waterVal,  setWaterVal]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [savedMsg,  setSavedMsg]  = useState(false);

  const trimCfg = TRIMESTER_DATA[user?.trimester || 1];

  /* ── Fetch data ─────────────────────────────────────── */
  useEffect(() => {
    authFetch('/journal/summary').then(d => { if (d.success) setSummary(d.summary); });
    authFetch('/journal/checklist/today').then(d => {
      if (d.success) {
        setChecklist(d.checklist);
        setSleepVal(d.checklist.sleep_hours ?? '');
        setWaterVal(d.checklist.water_liters ?? '');
      }
    });
  }, []); // eslint-disable-line

  /* ── Toggle checklist item ──────────────────────────── */
  const toggleCheck = async (key) => {
    if (!checklist) return;
    const newVal = !checklist[key];
    setChecklist(p => ({ ...p, [key]: newVal }));
    await authFetch('/journal/checklist/today', {
      method: 'PUT',
      body: JSON.stringify({ [key]: newVal }),
    });
  };

  /* ── Save sleep / water ─────────────────────────────── */
  const saveNumericFields = async () => {
    setSaving(true);
    const payload = {};
    if (sleepVal !== '') payload.sleep_hours  = parseFloat(sleepVal);
    if (waterVal !== '') payload.water_liters = parseFloat(waterVal);
    const res = await authFetch('/journal/checklist/today', {
      method: 'PUT', body: JSON.stringify(payload),
    });
    if (res.success) {
      setChecklist(res.checklist);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    }
    setSaving(false);
  };

  /* ── Derived values ─────────────────────────────────── */
  const daysLeft   = daysUntilDue(user?.due_date);
  const checkDone  = checklist
    ? CHECKLIST_ITEMS.filter(i => checklist[i.key]).length
    : 0;
  const checkTotal = CHECKLIST_ITEMS.length;
  const progressPct = Math.round((checkDone / checkTotal) * 100);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div style={s.page}>

      {/* ── Hero Greeting ──────────────────────────────── */}
      <div
        style={{
          ...s.hero,
          backgroundImage: `url('/bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          color: '#fff',
        }}
>
        <div style={s.heroOrb1} /><div style={s.heroOrb2} />
        <div style={s.heroContent}>
          <p style={s.greeting}>{getGreeting()}</p>
          <h1 style={s.heroName}>
            {user?.full_name?.split(' ')[0]} 🌸
          </h1>
          <p style={s.heroSub}>
            {trimCfg.label} · {trimCfg.weeks}
            {user?.due_date && daysLeft !== null
              ? ` · ${daysLeft} days until your due date`
              : ''}
          </p>
          <div style={s.heroBadgeRow}>
            <span style={s.heroBadge('rgba(255,255,255,0.18)', '#fff')}>
              {trimCfg.emoji} {trimCfg.label}
            </span>
            {summary?.streak > 0 && (
              <span style={s.heroBadge('rgba(255,255,255,0.18)', '#fff')}>
                🔥 {summary.streak}-day streak
              </span>
            )}
            {summary?.days_tracking && (
              <span style={s.heroBadge('rgba(255,255,255,0.18)', '#fff')}>
                📅 Day {summary.days_tracking} of tracking
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────── */}
      <div style={s.statsRow}>
        {[
          {
            icon: '🔥', label: 'Journal Streak',
            val: summary ? `${summary.streak}d` : '—',
            color: '#D4924A',
          },
          {
            icon: '🩺', label: 'Total Predictions',
            val: summary?.total_predictions ?? '—',
            color: '#8A00F3',
          },
          {
            icon: '✅', label: "Today's Progress",
            val: `${checkDone}/${checkTotal}`,
            color: '#5A8A72',
          },
          {
            icon: '📔', label: 'Entries This Week',
            val: summary?.entries_this_week ?? '—',
            color: '#546A7B',
          },
        ].map((st, i) => (
          <div key={i} style={s.statCard}>
            <div style={s.statAccent(st.color)} />
            <div style={s.statIcon}>{st.icon}</div>
            <div style={s.statVal}>{st.val}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Trimester + Daily Checklist ─────────── */}
      <div style={s.grid2}>

        {/* Trimester Timeline */}
        <div style={s.card(150)}>
          <h3 style={s.cardTitle}>Pregnancy Timeline</h3>
          <p style={s.cardSub}>Your current stage and upcoming milestones</p>

          <div style={s.trimHeader(trimCfg)}>
            <span style={s.trimEmoji}>{trimCfg.emoji}</span>
            <div>
              <div style={s.trimLabel(trimCfg.color)}>{trimCfg.label}</div>
              <div style={s.trimWeeks}>{trimCfg.weeks}</div>
            </div>
            {daysLeft !== null && (
              <div style={{
                marginLeft: 'auto', textAlign: 'right',
                fontFamily: 'var(--font-display)',
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: trimCfg.color }}>{daysLeft}</div>
                <div style={{ fontSize: 11, color: 'var(--slate-light)' }}>days left</div>
              </div>
            )}
          </div>

          <div style={s.milestoneList}>
            {trimCfg.milestones.map((m, i) => (
              <div key={i} style={s.milestone}>
                <div style={s.milestoneDot(trimCfg.color)} />
                <span>{m}</span>
              </div>
            ))}
          </div>

          <div style={s.tipBox(trimCfg)}>
            💡 <strong>Tip:</strong> {trimCfg.tip}
          </div>
        </div>

        {/* Daily Checklist */}
        <div style={s.card(200)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <h3 style={s.cardTitle}>Daily Wellness</h3>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: progressPct === 100 ? '#5A8A72' : 'var(--slate-mid)',
              background: progressPct === 100 ? '#EBF4EF' : 'var(--blush)',
              padding: '3px 10px', borderRadius: 99,
            }}>
              {progressPct === 100 ? '🎉 All done!' : `${checkDone}/${checkTotal} done`}
            </span>
          </div>
          <p style={s.cardSub}>Daily reset checklist for healthy habits</p>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', marginBottom: 18, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))',
              width: `${progressPct}%`, transition: 'width 0.5s ease',
            }} />
          </div>

          {CHECKLIST_ITEMS.map(item => (
            <div
              key={item.key}
              style={s.checkItem(checklist?.[item.key])}
              onClick={() => toggleCheck(item.key)}
            >
              <div style={s.checkBox(checklist?.[item.key])}>
                {checklist?.[item.key] && '✓'}
              </div>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={s.checkLabel(checklist?.[item.key])}>{item.label}</span>
            </div>
          ))}

          {/* Sleep & water inputs */}
          <div style={s.numRow}>
            <div style={s.numField}>
              <label style={s.numLabel}>Sleep (hrs)</label>
              <input
                type="number" min={0} max={24} step={0.5}
                placeholder="7.5"
                value={sleepVal}
                style={s.numInput(focused === 'sleep')}
                onFocus={() => setFocused('sleep')}
                onBlur={() => setFocused(null)}
                onChange={e => setSleepVal(e.target.value)}
              />
            </div>
            <div style={s.numField}>
              <label style={s.numLabel}>Water (L)</label>
              <input
                type="number" min={0} max={10} step={0.1}
                placeholder="2.0"
                value={waterVal}
                style={s.numInput(focused === 'water')}
                onFocus={() => setFocused('water')}
                onBlur={() => setFocused(null)}
                onChange={e => setWaterVal(e.target.value)}
              />
            </div>
          </div>
          <button
            style={s.saveBtn}
            onClick={saveNumericFields}
            disabled={saving}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {savedMsg ? '✓ Saved!' : saving ? 'Saving…' : 'Save Today\'s Log'}
          </button>
        </div>
      </div>

      {/* ── Row 2: Last Risk + Mood Summary + Shortcuts ─── */}
      <div style={s.grid3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Last prediction */}
          <div style={s.card(250)}>
            <h3 style={s.cardTitle}>Latest Risk Assessment</h3>
            <p style={s.cardSub}>Your most recent ML prediction result</p>
            {summary?.last_risk ? (() => {
              const cfg = RISK_CONFIG[summary.last_risk.risk_level];
              return (
                <div style={s.riskBanner(cfg)}>
                  <span style={s.riskIcon}>{cfg.icon}</span>
                  <div>
                    <div style={s.riskLabel(cfg.color)}>{cfg.label}</div>
                    <div style={s.riskMeta}>
                      {new Date(summary.last_risk.logged_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div style={s.riskConf(cfg.color)}>
                    {summary.last_risk.confidence}%
                  </div>
                </div>
              );
            })() : (
              <div style={{
                padding: '20px', background: 'var(--blush)', borderRadius: 10,
                textAlign: 'center', fontSize: 14, color: 'var(--slate-light)',
              }}>
                No predictions yet.{' '}
                <span
                  style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => onNavigate?.('risk')}
                >
                  Run your first analysis →
                </span>
              </div>
            )}
          </div>

          {/* Mood summary */}
          <div style={s.card(300)}>
            <h3 style={s.cardTitle}>Mood This Week</h3>
            <p style={s.cardSub}>How you've been feeling over the past 7 days</p>
            {summary?.mood_summary && Object.keys(summary.mood_summary).length > 0 ? (
              <div style={s.moodRow}>
                {Object.entries(summary.mood_summary)
                  .sort((a, b) => b[1] - a[1])
                  .map(([mood, count]) => {
                    const cfg = MOOD_CONFIG[mood] || MOOD_CONFIG.Calm;
                    return (
                      <div key={mood} style={s.moodChip(cfg)}>
                        <span>{cfg.emoji}</span>
                        <span style={{ fontSize: 13, color: 'var(--slate)' }}>{mood}</span>
                        <span style={s.moodCount(cfg.color)}>{count}×</span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--slate-light)' }}>
                No journal entries this week yet.
              </p>
            )}
          </div>
        </div>

        {/* Quick shortcuts */}
        <div style={s.card(350)}>
          <h3 style={s.cardTitle}>Quick Access</h3>
          <p style={s.cardSub}>Navigate to any module</p>
          <div style={s.shortcuts}>
            {SHORTCUTS.map(sc => (
              <div
                key={sc.page}
                style={s.shortcut(sc.color, sc.bg)}
                onClick={() => onNavigate?.(sc.page)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(44,62,80,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={s.shortcutIcon}>{sc.icon}</span>
                <span style={s.shortcutLabel(sc.color)}>{sc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
