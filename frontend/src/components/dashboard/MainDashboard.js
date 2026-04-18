import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Leaf, Flower2, Stethoscope, MessageCircle, Pill, Target,
  BookOpen, BarChart2, Flame, CheckCircle, Smile, Sparkles,
  Meh, Star, Moon, Zap, Frown, Activity, Droplet, Brain,
  ShieldCheck, ShieldAlert, ShieldX, Lightbulb, Check,
} from 'lucide-react';

const TRIMESTER_DATA = {
  1: {
    Icon: Leaf, label: 'First Trimester', weeks: 'Weeks 1–12',
    color: '#5A8A72', light: '#EBF4EF', border: '#A8D5B8',
    milestones: ['Heart begins beating', 'Brain & spine forming', 'Fingers & toes developing', 'End of embryonic period'],
    tip: 'Take folic acid daily. Stay hydrated and rest when tired.',
    bg: 'linear-gradient(135deg, #EBF4EF 0%, #D4EDDA 100%)',
  },
  2: {
    Icon: Flower2, label: 'Second Trimester', weeks: 'Weeks 13–26',
    color: '#D4924A', light: '#FDF3E7', border: '#F5C97B',
    milestones: ['Baby can hear your voice', 'Movements felt (quickening)', 'Gender can be detected', 'Eyebrows & lashes appear'],
    tip: 'Gentle exercise like walking or swimming is beneficial. Monitor weight gain.',
    bg: 'linear-gradient(135deg, #FDF3E7 0%, #FAECD4 100%)',
  },
  3: {
    Icon: Flower2, label: 'Third Trimester', weeks: 'Weeks 27–40',
    color: '#8A00F3', light: '#F5E6FF', border: '#E8CCFF',
    milestones: ['Baby opens eyes', 'Lungs maturing', 'Rapid weight gain', 'Baby moves into head-down position'],
    tip: 'Prepare your birth plan. Attend all prenatal appointments.',
    bg: 'linear-gradient(135deg, #F5E6FF 0%, #EDD5FF 100%)',
  },
};

const MOOD_CONFIG = {
  Happy:    { Icon: Smile,    color: '#5A8A72', bg: '#EBF4EF' },
  Excited:  { Icon: Sparkles, color: '#D4924A', bg: '#FDF3E7' },
  Calm:     { Icon: Meh,      color: '#546A7B', bg: '#EDF2F5' },
  Grateful: { Icon: Star,     color: '#9B59B6', bg: '#F5EEF8' },
  Tired:    { Icon: Moon,     color: '#8FA3B1', bg: '#F0F4F7' },
  Anxious:  { Icon: Zap,      color: '#D4924A', bg: '#FDF3E7' },
  Sad:      { Icon: Frown,    color: '#8A00F3', bg: '#F5E6FF' },
};

const RISK_CONFIG = {
  0: { label: 'Low Risk',  Icon: ShieldCheck, color: '#5A8A72', bg: '#EBF4EF' },
  1: { label: 'Mid Risk',  Icon: ShieldAlert, color: '#D4924A', bg: '#FDF3E7' },
  2: { label: 'High Risk', Icon: ShieldX,     color: '#8A00F3', bg: '#F5E6FF' },
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

const s = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px', fontFamily: 'var(--font-body)' },
  hero: { borderRadius: 'var(--radius-xl)', padding: '36px 40px', marginBottom: 28, position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.5s ease both' },
  heroOrb1: { position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', top: -60, right: 60, pointerEvents: 'none' },
  heroOrb2: { position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', bottom: -40, right: 200, pointerEvents: 'none' },
  heroContent: { position: 'relative', zIndex: 1 },
  greeting: { fontSize: 14, fontWeight: 600, opacity: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 },
  heroName: { fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 600, lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.4px' },
  heroSub: { fontSize: 15, opacity: 0.8, lineHeight: 1.6, maxWidth: 480 },
  heroBadgeRow: { display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' },
  heroBadge: (bg, color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: bg, color, fontSize: 12, fontWeight: 600, padding: '5px 12px',
    borderRadius: 99, border: `1px solid ${color}33`,
  }),
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28, animation: 'fadeUp 0.5s ease 0.1s both' },
  statCard: { background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '22px 24px', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' },
  statAccent: (color) => ({ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '14px 14px 0 0' }),
  statIcon: { marginBottom: 10, marginTop: 4 },
  statVal: { fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--slate)', lineHeight: 1, marginBottom: 5 },
  statLabel: { fontSize: 12, color: 'var(--slate-light)', fontWeight: 500, letterSpacing: '0.02em' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
  grid3: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 },
  card: (delay = 0) => ({ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '28px', boxShadow: 'var(--shadow-sm)', animation: `fadeUp 0.5s ease ${delay}ms both` }),
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: 'var(--slate)', marginBottom: 4, letterSpacing: '-0.2px' },
  cardSub: { fontSize: 12, color: 'var(--slate-light)', marginBottom: 20 },
  trimHeader: (cfg) => ({ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 'var(--radius-md)', background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 20 }),
  trimIconWrap: (color) => ({ width: 52, height: 52, borderRadius: 14, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}44`, flexShrink: 0 }),
  trimLabel: (color) => ({ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color, marginBottom: 2 }),
  trimWeeks: { fontSize: 12, color: 'var(--slate-light)' },
  milestoneList: { display: 'flex', flexDirection: 'column', gap: 8 },
  milestone: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--slate)' },
  milestoneDot: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }),
  tipBox: (cfg) => ({ marginTop: 18, padding: '12px 16px', background: cfg.light, borderRadius: 10, border: `1px solid ${cfg.border}`, fontSize: 13, color: cfg.color, lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 8 }),
  checkItem: (done) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, marginBottom: 8, background: done ? 'var(--success-light)' : 'var(--blush)', border: `1px solid ${done ? '#A8D5B8' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none' }),
  checkBox: (done) => ({ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: done ? 'var(--success)' : 'transparent', border: `2px solid ${done ? 'var(--success)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }),
  checkLabel: (done) => ({ fontSize: 14, fontWeight: 500, flex: 1, color: done ? 'var(--success)' : 'var(--slate)', textDecoration: done ? 'line-through' : 'none', transition: 'all 0.2s' }),
  numRow: { display: 'flex', gap: 12, marginTop: 16 },
  numField: { flex: 1 },
  numLabel: { fontSize: 11, fontWeight: 600, color: 'var(--slate-mid)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  numInput: (focused) => ({ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`, background: focused ? 'var(--blush)' : 'var(--cream)', fontSize: 15, color: 'var(--slate)', outline: 'none', fontFamily: 'var(--font-body)', transition: 'all 0.2s', boxShadow: focused ? '0 0 0 3px rgba(177,0,231,0.15)' : 'none' }),
  saveBtn: { marginTop: 16, padding: '10px 22px', borderRadius: 99, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: '0.03em', transition: 'all 0.2s', fontFamily: 'var(--font-body)', boxShadow: '0 3px 14px rgba(177,0,231,0.3)', display: 'flex', alignItems: 'center', gap: 6 },
  riskBanner: (cfg) => ({ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 'var(--radius-md)', background: cfg.bg, border: `1.5px solid ${cfg.color}44` }),
  riskLabel: (color) => ({ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color, marginBottom: 2 }),
  riskMeta: { fontSize: 12, color: 'var(--slate-light)' },
  riskConf: (color) => ({ marginLeft: 'auto', textAlign: 'right', fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--font-display)' }),
  moodRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  moodChip: (cfg) => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: cfg.bg, border: `1px solid ${cfg.color}33`, fontSize: 13 }),
  moodCount: (color) => ({ fontSize: 12, fontWeight: 700, color }),
  shortcuts: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  shortcut: (color, bg) => ({ padding: '16px', borderRadius: 'var(--radius-md)', background: bg, border: `1px solid ${color}33`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease' }),
  shortcutLabel: (color) => ({ fontSize: 12, fontWeight: 600, color, letterSpacing: '0.02em' }),
};

const CHECKLIST_ITEMS = [
  { key: 'vitamins_taken', label: 'Took prenatal vitamins',   Icon: Pill },
  { key: 'water_goal_met', label: 'Met water intake goal',    Icon: Droplet },
  { key: 'stress_managed', label: 'Managed stress levels',    Icon: Brain },
  { key: 'exercise_done',  label: 'Completed light exercise', Icon: Activity },
];

const SHORTCUTS = [
  { Icon: Stethoscope,   label: 'Risk Analysis', page: 'risk',      color: '#8A00F3', bg: '#F5E6FF' },
  { Icon: MessageCircle, label: 'AI Chat',       page: 'chat',      color: '#546A7B', bg: '#EDF2F5' },
  { Icon: Pill,          label: 'Medicines',     page: 'medicines', color: '#D4924A', bg: '#FDF3E7' },
  { Icon: Target,        label: 'Goals',         page: 'goals',     color: '#5A8A72', bg: '#EBF4EF' },
  { Icon: BookOpen,      label: 'Journal',       page: 'journal',   color: '#9B59B6', bg: '#F5EEF8' },
  { Icon: BarChart2,     label: 'Stats',         page: 'stats',     color: '#2C3E50', bg: '#F0F4F7' },
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
    await authFetch('/journal/checklist/today', { method: 'PUT', body: JSON.stringify({ [key]: newVal }) });
  };

  const saveNumericFields = async () => {
    setSaving(true);
    const payload = {};
    if (sleepVal !== '') payload.sleep_hours  = parseFloat(sleepVal);
    if (waterVal !== '') payload.water_liters = parseFloat(waterVal);
    const res = await authFetch('/journal/checklist/today', { method: 'PUT', body: JSON.stringify(payload) });
    if (res.success) { setChecklist(res.checklist); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2000); }
    setSaving(false);
  };

  const daysLeft   = daysUntilDue(user?.due_date);
  const checkDone  = checklist ? CHECKLIST_ITEMS.filter(i => checklist[i.key]).length : 0;
  const checkTotal = CHECKLIST_ITEMS.length;
  const progressPct = Math.round((checkDone / checkTotal) * 100);

  const STAT_CARDS = [
    { Icon: Flame,         label: 'Journal Streak',     val: summary ? `${summary.streak}d` : '—',            color: '#D4924A' },
    { Icon: Stethoscope,   label: 'Total Predictions',  val: summary?.total_predictions ?? '—',               color: '#8A00F3' },
    { Icon: CheckCircle,   label: "Today's Progress",   val: `${checkDone}/${checkTotal}`,                     color: '#5A8A72' },
    { Icon: BookOpen,      label: 'Entries This Week',  val: summary?.entries_this_week ?? '—',                color: '#546A7B' },
  ];

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={{ ...s.hero, backgroundImage: `url('/bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center top', color: '#fff' }}>
        <div style={s.heroOrb1} /><div style={s.heroOrb2} />
        <div style={s.heroContent}>
          <p style={s.greeting}>{getGreeting()}</p>
          <h1 style={s.heroName}>{user?.full_name?.split(' ')[0]}</h1>
          <p style={s.heroSub}>
            {trimCfg.label} · {trimCfg.weeks}
            {user?.due_date && daysLeft !== null ? ` · ${daysLeft} days until your due date` : ''}
          </p>
          <div style={s.heroBadgeRow}>
            <span style={s.heroBadge('rgba(255,255,255,0.18)', '#fff')}>
              <trimCfg.Icon size={13} strokeWidth={1.8} />
              {trimCfg.label}
            </span>
            {summary?.streak > 0 && (
              <span style={s.heroBadge('rgba(255,255,255,0.18)', '#fff')}>
                <Flame size={13} strokeWidth={1.8} />
                {summary.streak}-day streak
              </span>
            )}
            {summary?.days_tracking && (
              <span style={s.heroBadge('rgba(255,255,255,0.18)', '#fff')}>
                <BookOpen size={13} strokeWidth={1.8} />
                Day {summary.days_tracking} of tracking
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {STAT_CARDS.map((st, i) => (
          <div key={i} style={s.statCard}>
            <div style={s.statAccent(st.color)} />
            <div style={s.statIcon}><st.Icon size={26} color={st.color} strokeWidth={1.6} /></div>
            <div style={s.statVal}>{st.val}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div style={s.grid2}>
        {/* Trimester Timeline */}
        <div style={s.card(150)}>
          <h3 style={s.cardTitle}>Pregnancy Timeline</h3>
          <p style={s.cardSub}>Your current stage and upcoming milestones</p>
          <div style={s.trimHeader(trimCfg)}>
            <div style={s.trimIconWrap(trimCfg.color)}>
              <trimCfg.Icon size={26} color={trimCfg.color} strokeWidth={1.6} />
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
            <Lightbulb size={14} color={trimCfg.color} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>Tip:</strong> {trimCfg.tip}</span>
          </div>
        </div>

        {/* Daily Checklist */}
        <div style={s.card(200)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <h3 style={s.cardTitle}>Daily Wellness</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: progressPct === 100 ? '#5A8A72' : 'var(--slate-mid)', background: progressPct === 100 ? '#EBF4EF' : 'var(--blush)', padding: '3px 10px', borderRadius: 99 }}>
              {progressPct === 100 ? 'All done!' : `${checkDone}/${checkTotal} done`}
            </span>
          </div>
          <p style={s.cardSub}>Daily reset checklist for healthy habits</p>
          <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', marginBottom: 18, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))', width: `${progressPct}%`, transition: 'width 0.5s ease' }} />
          </div>
          {CHECKLIST_ITEMS.map(item => (
            <div key={item.key} style={s.checkItem(checklist?.[item.key])} onClick={() => toggleCheck(item.key)}>
              <div style={s.checkBox(checklist?.[item.key])}>
                {checklist?.[item.key] && <Check size={13} color="#fff" strokeWidth={2.5} />}
              </div>
              <item.Icon size={18} color={checklist?.[item.key] ? 'var(--success)' : 'var(--slate-light)'} strokeWidth={1.8} />
              <span style={s.checkLabel(checklist?.[item.key])}>{item.label}</span>
            </div>
          ))}
          <div style={s.numRow}>
            <div style={s.numField}>
              <label style={s.numLabel}>Sleep (hrs)</label>
              <input type="number" min={0} max={24} step={0.5} placeholder="7.5" value={sleepVal}
                style={s.numInput(focused === 'sleep')}
                onFocus={() => setFocused('sleep')} onBlur={() => setFocused(null)}
                onChange={e => setSleepVal(e.target.value)} />
            </div>
            <div style={s.numField}>
              <label style={s.numLabel}>Water (L)</label>
              <input type="number" min={0} max={10} step={0.1} placeholder="2.0" value={waterVal}
                style={s.numInput(focused === 'water')}
                onFocus={() => setFocused('water')} onBlur={() => setFocused(null)}
                onChange={e => setWaterVal(e.target.value)} />
            </div>
          </div>
          <button style={s.saveBtn} onClick={saveNumericFields} disabled={saving}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {savedMsg
              ? <><Check size={14} strokeWidth={2.5} /> Saved!</>
              : saving ? 'Saving…' : 'Save Today\'s Log'
            }
          </button>
        </div>
      </div>

      {/* Row 2 */}
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
                  <cfg.Icon size={32} color={cfg.color} strokeWidth={1.6} />
                  <div>
                    <div style={s.riskLabel(cfg.color)}>{cfg.label}</div>
                    <div style={s.riskMeta}>
                      {new Date(summary.last_risk.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={s.riskConf(cfg.color)}>{summary.last_risk.confidence}%</div>
                </div>
              );
            })() : (
              <div style={{ padding: '20px', background: 'var(--blush)', borderRadius: 10, textAlign: 'center', fontSize: 14, color: 'var(--slate-light)' }}>
                No predictions yet.{' '}
                <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNavigate?.('risk')}>
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
                {Object.entries(summary.mood_summary).sort((a, b) => b[1] - a[1]).map(([mood, count]) => {
                  const cfg = MOOD_CONFIG[mood] || MOOD_CONFIG.Calm;
                  return (
                    <div key={mood} style={s.moodChip(cfg)}>
                      <cfg.Icon size={14} color={cfg.color} strokeWidth={1.8} />
                      <span style={{ fontSize: 13, color: 'var(--slate)' }}>{mood}</span>
                      <span style={s.moodCount(cfg.color)}>{count}×</span>
                    </div>
                  );
                })}
              </div>
            ) : <p style={{ fontSize: 14, color: 'var(--slate-light)' }}>No journal entries this week yet.</p>}
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
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(44,62,80,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <sc.Icon size={22} color={sc.color} strokeWidth={1.8} style={{ display: 'block', margin: '0 auto 6px' }} />
                <span style={s.shortcutLabel(sc.color)}>{sc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}