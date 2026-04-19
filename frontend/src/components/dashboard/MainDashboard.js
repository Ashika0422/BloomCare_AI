import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Flame, Stethoscope, CheckCircle, BookOpen,
  Leaf, Flower2, Lightbulb, Activity,
  MessageCircle, Pill, Target, BarChart2,
  Moon, Droplet,
} from 'lucide-react';

/* ── Bubblegum Fizz palette ──────────────────────────────── */
const BB = {
  50:  '#fde7f6', 100: '#fbd0ed', 200: '#f8a0db',
  300: '#f471c8', 400: '#f141b6', 500: '#ed12a4',
  600: '#be0e83', 700: '#8e0b62', 800: '#5f0742',
  900: '#2f0421', 950: '#210217',
};

const GRAD_SOFT   = 'linear-gradient(135deg, #f141b6 0%, #be0e83 100%)';
const GRAD_HERO   = 'linear-gradient(135deg, #2f0421 0%, #8e0b62 50%, #ed12a4 100%)';
const SHADOW_BTN  = '0 4px 20px rgba(190,14,131,0.38)';
const FOCUS_RING  = '0 0 0 3px rgba(237,18,164,0.2)';

/* ── Trimester data — all bubblegum ─────────────────────── */
const TRIMESTER_DATA = {
  1: {
    label: 'First Trimester', weeks: 'Weeks 1–12',
    color: BB[400], bg: BB[50],  border: BB[200],
    Icon: Leaf,
    milestones: ['Heart begins beating','Brain & spine forming','Fingers & toes developing','End of embryonic period'],
    tip: 'Take folic acid daily. Stay hydrated and rest when tired.',
  },
  2: {
    label: 'Second Trimester', weeks: 'Weeks 13–26',
    color: BB[600], bg: BB[100], border: BB[300],
    Icon: Flower2,
    milestones: ['Baby can hear your voice','Movements felt (quickening)','Gender can be detected','Eyebrows & lashes appear'],
    tip: 'Gentle exercise like walking or swimming is beneficial.',
  },
  3: {
    label: 'Third Trimester', weeks: 'Weeks 27–40',
    color: BB[700], bg: BB[100], border: BB[400],
    Icon: Flower2,
    milestones: ['Baby opens eyes','Lungs maturing','Rapid weight gain','Baby moves into head-down position'],
    tip: 'Prepare your birth plan. Attend all prenatal appointments.',
  },
};

/* ── Risk config — ALL bubblegum ────────────────────────── */
const RISK_CONFIG = {
  0: { label: 'Low Risk',  icon: '✓', color: BB[400], bg: BB[50],  border: BB[200] },
  1: { label: 'Mid Risk',  icon: '!', color: BB[600], bg: BB[100], border: BB[300] },
  2: { label: 'High Risk', icon: '!', color: BB[700], bg: BB[100], border: BB[400] },
};

/* ── Checklist items ────────────────────────────────────── */
const CHECKLIST_ITEMS = [
  { key: 'vitamins_taken', label: 'Prenatal vitamins',  Icon: Pill,      desc: 'Daily essential' },
  { key: 'water_goal_met', label: 'Water intake goal',  Icon: Droplet,   desc: '8+ glasses/day' },
  { key: 'stress_managed', label: 'Stress management',  Icon: Activity,  desc: 'Breathe & relax' },
  { key: 'exercise_done',  label: 'Light exercise',     Icon: Activity,  desc: '20–30 min walk' },
];

/* ── Shortcuts ──────────────────────────────────────────── */
const SHORTCUTS = [
  { Icon: Stethoscope,   label: 'Risk Analysis', page: 'risk',      color: BB[600], bg: BB[100] },
  { Icon: MessageCircle, label: 'AI Chat',       page: 'chat',      color: BB[500], bg: BB[50]  },
  { Icon: Pill,          label: 'Medicines',     page: 'medicines', color: BB[700], bg: BB[100] },
  { Icon: Target,        label: 'Goals',         page: 'goals',     color: BB[600], bg: BB[100] },
  { Icon: BookOpen,      label: 'Journal',       page: 'journal',   color: BB[400], bg: BB[50]  },
  { Icon: BarChart2,     label: 'Stats',         page: 'stats',     color: BB[700], bg: BB[100] },
];

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

/* ── Styles — pure bubblegum ────────────────────────────── */
const s = {
  page: {
    maxWidth: 1200, margin: '0 auto',
    padding: '40px 32px 80px',
    fontFamily: 'var(--font-body)',
  },

  /* Hero */
  hero: {
    borderRadius: 'var(--radius-xl)', padding: '36px 40px',
    marginBottom: 28, position: 'relative', overflow: 'hidden',
    background: GRAD_HERO,
    color: '#fff', animation: 'fadeUp 0.5s ease both',
  },
  heroOrb1: {
    position: 'absolute', width: 220, height: 220, borderRadius: '50%',
    background: 'rgba(255,255,255,0.07)', top: -60, right: 60, pointerEvents: 'none',
  },
  heroOrb2: {
    position: 'absolute', width: 140, height: 140, borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)', bottom: -40, right: 200, pointerEvents: 'none',
  },
  heroContent: { position: 'relative', zIndex: 1 },
  greeting: { fontSize: 13, fontWeight: 600, opacity: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 },
  heroName: {
    fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600,
    lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.4px',
  },
  heroSub: { fontSize: 15, opacity: 0.8, lineHeight: 1.6, maxWidth: 480 },
  heroBadgeRow: { display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.15)', color: '#fff',
    fontSize: 12, fontWeight: 600, padding: '5px 12px',
    borderRadius: 99, border: '1px solid rgba(255,255,255,0.25)',
  },

  /* Stats row */
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16, marginBottom: 28,
    animation: 'fadeUp 0.5s ease 0.1s both',
  },
  statCard: {
    background: '#fff', borderRadius: 'var(--radius-lg)',
    border: `1px solid ${BB[200]}`,
    padding: '22px 24px', boxShadow: 'var(--shadow-sm)',
    position: 'relative', overflow: 'hidden',
  },
  statAccent: (color) => ({
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: color, borderRadius: '14px 14px 0 0',
  }),
  statIconWrap: (bg) => ({
    width: 40, height: 40, borderRadius: 12, marginBottom: 10, marginTop: 4,
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  statVal: {
    fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600,
    color: 'var(--slate)', lineHeight: 1, marginBottom: 5,
  },
  statLabel: { fontSize: 12, color: 'var(--slate-light)', fontWeight: 500 },

  /* Two-column layout */
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 20, marginBottom: 20,
  },
  grid3: {
    display: 'grid', gridTemplateColumns: '2fr 1fr',
    gap: 20, marginBottom: 20,
  },

  /* Card */
  card: (delay = 0) => ({
    background: '#fff', borderRadius: 'var(--radius-lg)',
    border: `1px solid ${BB[200]}`,
    padding: '28px', boxShadow: 'var(--shadow-sm)',
    animation: `fadeUp 0.5s ease ${delay}ms both`,
  }),
  cardTitle: {
    fontFamily: 'var(--font-display)', fontSize: 19,
    fontWeight: 600, color: 'var(--slate)', marginBottom: 4, letterSpacing: '-0.2px',
  },
  cardSub: { fontSize: 12, color: 'var(--slate-light)', marginBottom: 20 },

  /* Trimester */
  trimHeader: (cfg) => ({
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '16px 20px', borderRadius: 'var(--radius-md)',
    background: cfg.bg, border: `1.5px solid ${cfg.border}`, marginBottom: 20,
  }),
  trimIconWrap: (cfg) => ({
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    background: cfg.color + '22',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  trimLabel: (color) => ({
    fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600,
    color, marginBottom: 2,
  }),
  trimWeeks: { fontSize: 12, color: 'var(--slate-light)' },
  milestoneList: { display: 'flex', flexDirection: 'column', gap: 10 },
  milestone: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--slate)' },
  milestoneDot: (color) => ({
    width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
  }),
  tipBox: (cfg) => ({
    marginTop: 18, padding: '12px 16px',
    background: cfg.bg, borderRadius: 10,
    border: `1px solid ${cfg.border}`,
    fontSize: 13, color: cfg.color, lineHeight: 1.6,
    display: 'flex', alignItems: 'flex-start', gap: 8,
  }),

  /* Progress bar */
  progressBar: {
    height: 6, borderRadius: 99, background: BB[100], marginBottom: 18, overflow: 'hidden',
  },
  progressFill: (pct) => ({
    height: '100%', borderRadius: 99, width: `${pct}%`,
    background: 'var(--grad-bar)',
    transition: 'width 0.5s ease',
  }),

  /* Checklist */
  checkItem: (done) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', borderRadius: 12, marginBottom: 8,
    background: done ? BB[50]  : '#fff',
    border:     `1.5px solid ${done ? BB[300] : BB[200]}`,
    cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none',
  }),
  checkBox: (done) => ({
    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
    background: done ? BB[500] : 'transparent',
    border:     `2px solid ${done ? BB[500] : BB[300]}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, color: '#fff', transition: 'all 0.2s ease',
  }),
  checkLabel: (done) => ({
    fontSize: 14, fontWeight: 600, flex: 1,
    color: done ? BB[700] : 'var(--slate)',
    textDecoration: done ? 'line-through' : 'none',
    transition: 'all 0.2s',
  }),
  checkDesc: { fontSize: 11, color: 'var(--slate-light)', marginTop: 1 },

  /* Numeric inputs */
  numRow: { display: 'flex', gap: 12, marginTop: 16 },
  numField: { flex: 1 },
  numLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)',
    letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6, display: 'block',
  },
  numInput: (focused) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: `1.5px solid ${focused ? BB[500] : BB[200]}`,
    background: focused ? BB[50] : 'var(--cream)',
    fontSize: 15, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', transition: 'all 0.2s',
    boxShadow: focused ? FOCUS_RING : 'none',
  }),
  saveBtn: {
    marginTop: 16, padding: '10px 22px', borderRadius: 99,
    background: GRAD_SOFT, color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, letterSpacing: '0.03em',
    transition: 'all 0.2s', fontFamily: 'var(--font-body)',
    boxShadow: SHADOW_BTN,
  },

  /* Risk banner */
  riskBanner: (cfg) => ({
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '18px 20px', borderRadius: 'var(--radius-md)',
    background: cfg.bg, border: `1.5px solid ${cfg.border}`,
  }),
  riskIconWrap: (cfg) => ({
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    background: cfg.color + '22',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 700, color: cfg.color,
  }),
  riskLabel: (color) => ({
    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color, marginBottom: 2,
  }),
  riskMeta: { fontSize: 12, color: 'var(--slate-light)' },
  riskConf: (color) => ({
    marginLeft: 'auto', textAlign: 'right',
    fontSize: 22, fontWeight: 700, color,
    fontFamily: 'var(--font-display)',
  }),

  /* Shortcuts */
  shortcuts: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  shortcut: (color, bg) => ({
    padding: '16px', borderRadius: 'var(--radius-md)',
    background: bg, border: `1px solid ${color}33`,
    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
  }),
  shortcutLabel: (color) => ({
    fontSize: 12, fontWeight: 600, color, letterSpacing: '0.02em', marginTop: 6, display: 'block',
  }),

  /* Empty state */
  emptyState: {
    padding: '20px', background: BB[50], borderRadius: 10,
    textAlign: 'center', fontSize: 14, color: 'var(--slate-light)',
  },
};

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
  const TrimIcon = trimCfg.Icon;

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

  const toggleCheck = async (key) => {
    if (!checklist) return;
    const newVal = !checklist[key];
    setChecklist(p => ({ ...p, [key]: newVal }));
    await authFetch('/journal/checklist/today', {
      method: 'PUT', body: JSON.stringify({ [key]: newVal }),
    });
  };

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

  const daysLeft   = daysUntilDue(user?.due_date);
  const checkDone  = checklist ? CHECKLIST_ITEMS.filter(i => checklist[i.key]).length : 0;
  const checkTotal = CHECKLIST_ITEMS.length;
  const progressPct = Math.round((checkDone / checkTotal) * 100);

  /* Stat cards — all bubblegum shades */
  const STATS = [
    { Icon: Flame,        label: 'Journal Streak',    val: summary ? `${summary.streak}d` : '—', accent: BB[400], iconBg: BB[50]  },
    { Icon: Stethoscope,  label: 'Total Predictions', val: summary?.total_predictions ?? '—',    accent: BB[600], iconBg: BB[100] },
    { Icon: CheckCircle,  label: "Today's Progress",  val: `${checkDone}/${checkTotal}`,          accent: BB[500], iconBg: BB[50]  },
    { Icon: BookOpen,     label: 'Entries This Week', val: summary?.entries_this_week ?? '—',     accent: BB[700], iconBg: BB[100] },
  ];

  return (
    <div style={s.page}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={s.hero}>
        <div style={s.heroOrb1} /><div style={s.heroOrb2} />
        <div style={s.heroContent}>
          <p style={s.greeting}>{getGreeting()}</p>
          <h1 style={s.heroName}>{user?.full_name?.split(' ')[0]} 🌸</h1>
          <p style={s.heroSub}>
            {trimCfg.label} · {trimCfg.weeks}
            {user?.due_date && daysLeft !== null ? ` · ${daysLeft} days until your due date` : ''}
          </p>
          <div style={s.heroBadgeRow}>
            <span style={s.heroBadge}><TrimIcon size={13} /> {trimCfg.label}</span>
            {summary?.streak > 0 && (
              <span style={s.heroBadge}><Flame size={13} /> {summary.streak}-day streak</span>
            )}
            {summary?.days_tracking && (
              <span style={s.heroBadge}>📅 Day {summary.days_tracking} of tracking</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────── */}
      <div style={s.statsRow}>
        {STATS.map((st, i) => (
          <div key={i} style={s.statCard}>
            <div style={s.statAccent(st.accent)} />
            <div style={s.statIconWrap(st.iconBg)}>
              <st.Icon size={20} color={st.accent} strokeWidth={1.8} />
            </div>
            <div style={s.statVal}>{st.val}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Trimester + Daily Checklist ────────────── */}
      <div style={s.grid2}>

        {/* Trimester Timeline */}
        <div style={s.card(150)}>
          <h3 style={s.cardTitle}>Pregnancy Timeline</h3>
          <p style={s.cardSub}>Your current stage and upcoming milestones</p>

          <div style={s.trimHeader(trimCfg)}>
            <div style={s.trimIconWrap(trimCfg)}>
              <TrimIcon size={22} color={trimCfg.color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={s.trimLabel(trimCfg.color)}>{trimCfg.label}</div>
              <div style={s.trimWeeks}>{trimCfg.weeks}</div>
            </div>
            {daysLeft !== null && (
              <div style={{ marginLeft: 'auto', textAlign: 'right', fontFamily: 'var(--font-display)' }}>
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
            <Lightbulb size={15} color={trimCfg.color} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>Tip:</strong> {trimCfg.tip}</span>
          </div>
        </div>

        {/* Daily Wellness Checklist */}
        <div style={s.card(200)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <h3 style={s.cardTitle}>Daily Wellness</h3>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
              background: progressPct === 100 ? BB[500] : BB[50],
              color:      progressPct === 100 ? '#fff'    : BB[600],
              border:     `1px solid ${progressPct === 100 ? BB[600] : BB[200]}`,
            }}>
              {progressPct === 100 ? '🎉 All done!' : `${checkDone}/${checkTotal} done`}
            </span>
          </div>
          <p style={s.cardSub}>Daily reset checklist for healthy habits</p>

          <div style={s.progressBar}>
            <div style={s.progressFill(progressPct)} />
          </div>

          {CHECKLIST_ITEMS.map(item => (
            <div key={item.key} style={s.checkItem(checklist?.[item.key])} onClick={() => toggleCheck(item.key)}>
              <div style={s.checkBox(checklist?.[item.key])}>
                {checklist?.[item.key] && '✓'}
              </div>
              <item.Icon size={16} color={checklist?.[item.key] ? BB[500] : BB[300]} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={s.checkLabel(checklist?.[item.key])}>{item.label}</div>
                <div style={s.checkDesc}>{item.desc}</div>
              </div>
            </div>
          ))}

          <div style={s.numRow}>
            <div style={s.numField}>
              <label style={s.numLabel}>
                <Moon size={11} style={{ display: 'inline', marginRight: 4 }} />
                Sleep (hrs)
              </label>
              <input
                type="number" min={0} max={24} step={0.5} placeholder="7.5"
                value={sleepVal}
                style={s.numInput(focused === 'sleep')}
                onFocus={() => setFocused('sleep')}
                onBlur={() => setFocused(null)}
                onChange={e => setSleepVal(e.target.value)}
              />
            </div>
            <div style={s.numField}>
              <label style={s.numLabel}>
                <Droplet size={11} style={{ display: 'inline', marginRight: 4 }} />
                Water (L)
              </label>
              <input
                type="number" min={0} max={10} step={0.1} placeholder="2.0"
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
            {savedMsg ? '✓ Saved!' : saving ? 'Saving…' : "Save Today's Log"}
          </button>
        </div>
      </div>

      {/* ── Row 2: Last Risk + Shortcuts ──────────────────── */}
      <div style={s.grid3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Latest risk assessment */}
          <div style={s.card(250)}>
            <h3 style={s.cardTitle}>Latest Risk Assessment</h3>
            <p style={s.cardSub}>Your most recent ML prediction result</p>
            {summary?.last_risk ? (() => {
              const cfg = RISK_CONFIG[summary.last_risk.risk_level];
              return (
                <div style={s.riskBanner(cfg)}>
                  <div style={s.riskIconWrap(cfg)}>{cfg.icon}</div>
                  <div>
                    <div style={s.riskLabel(cfg.color)}>{cfg.label}</div>
                    <div style={s.riskMeta}>
                      {new Date(summary.last_risk.logged_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div style={s.riskConf(cfg.color)}>{summary.last_risk.confidence}%</div>
                </div>
              );
            })() : (
              <div style={s.emptyState}>
                No predictions yet.{' '}
                <span style={{ color: BB[500], fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => onNavigate?.('risk')}>
                  Run your first analysis →
                </span>
              </div>
            )}
          </div>

          {/* Mood this week */}
          <div style={s.card(300)}>
            <h3 style={s.cardTitle}>Mood This Week</h3>
            <p style={s.cardSub}>How you've been feeling over the past 7 days</p>
            {summary?.mood_summary && Object.keys(summary.mood_summary).length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(summary.mood_summary)
                  .sort((a, b) => b[1] - a[1])
                  .map(([mood, count]) => (
                    <div key={mood} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 99,
                      background: BB[50], border: `1px solid ${BB[200]}`,
                    }}>
                      <span style={{ fontSize: 13, color: 'var(--slate)' }}>{mood}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: BB[600] }}>{count}×</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--slate-light)' }}>No journal entries this week yet.</p>
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
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <sc.Icon size={22} color={sc.color} strokeWidth={1.8} />
                <span style={s.shortcutLabel(sc.color)}>{sc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}