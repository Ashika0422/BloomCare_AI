import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Smile, Sparkles, Meh, Star, Moon,
  Zap, Frown, BookOpen, PenLine, Trash2, Check,
} from 'lucide-react';

/* ── Mood config ───────────────────────────────────────────── */
const MOODS = [
  { value: 'Happy',    Icon: Smile,    label: 'Happy',    color: '#f141b6', bg: '#fde7f6', border: '#f8a0db' },
  { value: 'Excited',  Icon: Sparkles, label: 'Excited',  color: '#ed12a4', bg: '#fde7f6', border: '#f8a0db' },
  { value: 'Calm',     Icon: Meh,      label: 'Calm',     color: '#be0e83', bg: '#fbd0ed', border: '#f471c8' },
  { value: 'Grateful', Icon: Star,     label: 'Grateful', color: '#8e0b62', bg: '#fbd0ed', border: '#f471c8' },
  { value: 'Tired',    Icon: Moon,     label: 'Tired',    color: '#f141b6', bg: '#fde7f6', border: '#f8a0db' },
  { value: 'Anxious',  Icon: Zap,      label: 'Anxious',  color: '#be0e83', bg: '#fbd0ed', border: '#f471c8' },
  { value: 'Sad',      Icon: Frown,    label: 'Sad',      color: '#8e0b62', bg: '#fbd0ed', border: '#f471c8' },
];
const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.value, m]));

const PROMPTS = [
  "How am I feeling physically today?",
  "What made me smile today?",
  "Any new symptoms or sensations?",
  "What am I grateful for today?",
  "My biggest worry this week is...",
  "A message to my baby today:",
];

const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px', fontFamily: 'var(--font-body)' },
  pageHeader: { marginBottom: 36, animation: 'fadeUp 0.5s ease both' },
  eyebrow: {
    display: 'inline-block', background: 'var(--primary-tint)',
    color: 'var(--primary-dark)', fontSize: 11, fontWeight: 600,
    padding: '4px 12px', borderRadius: 99, letterSpacing: '0.1em',
    textTransform: 'uppercase', marginBottom: 12, border: '1px solid var(--primary-light)',
  },
  eyebrowInner: { display: 'flex', alignItems: 'center', gap: 6 },
  pageTitle: {
    fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600,
    color: 'var(--slate)', letterSpacing: '-0.4px', marginBottom: 6, lineHeight: 1.2,
  },
  pageSub: { fontSize: 15, color: 'var(--slate-mid)' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' },
  writeCard: {
    background: 'var(--white)', borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)', padding: '32px',
    boxShadow: 'var(--shadow-sm)', animation: 'fadeUp 0.5s ease 0.1s both',
  },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--slate)' },
  cardSub: { fontSize: 13, color: 'var(--slate-light)', marginBottom: 24 },
  moodLabel: {
    fontSize: 12, fontWeight: 700, color: 'var(--slate-mid)',
    letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12,
  },
  moodGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 24 },
  moodBtn: (selected, mood) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 4, padding: '10px 6px', borderRadius: 12, cursor: 'pointer',
    border: `2px solid ${selected ? mood.color : 'var(--border)'}`,
    background: selected ? mood.bg : 'var(--blush)',
    transition: 'all 0.2s ease',
    boxShadow: selected ? `0 0 0 3px ${mood.color}22` : 'none',
  }),
  moodBtnLabel: (selected, color) => ({
    fontSize: 10, fontWeight: 600,
    color: selected ? color : 'var(--slate-light)',
    letterSpacing: '0.03em',
  }),
  promptsLabel: {
    fontSize: 12, fontWeight: 700, color: 'var(--slate-mid)',
    letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10,
  },
  promptsRow: { display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 },
  promptChip: {
    fontSize: 12, padding: '5px 12px', borderRadius: 99,
    background: 'var(--blush)', border: '1px solid var(--border)',
    color: 'var(--slate-mid)', cursor: 'pointer', transition: 'all 0.15s ease',
    fontFamily: 'var(--font-body)',
  },
  textareaWrap: { position: 'relative', marginBottom: 20 },
  textarea: (focused) => ({
    width: '100%', minHeight: 180, padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
    background: focused ? 'var(--blush)' : '#fdfaf7',
    fontSize: 15, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', lineHeight: 1.7, resize: 'vertical',
    transition: 'all 0.2s ease',
    boxShadow: focused ? '0 0 0 3px rgba(237,18,164,0.15)' : 'none',
  }),
  charCount: { position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: 'var(--slate-light)' },
  submitBtn: (loading, disabled) => ({
    padding: '13px 32px', borderRadius: 'var(--radius-md)',
    background: disabled ? 'var(--border)' : loading ? 'var(--primary-light)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
    color: disabled ? 'var(--slate-light)' : '#fff',
    border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontSize: 14, fontWeight: 600, letterSpacing: '0.03em',
    transition: 'all 0.2s ease', fontFamily: 'var(--font-body)',
    boxShadow: disabled || loading ? 'none' : '0 4px 16px rgba(237,18,164,0.3)',
    display: 'flex', alignItems: 'center', gap: 8,
  }),
  spinner: {
    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  successBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#fde7f6', border: '1px solid #f8a0db',
    borderRadius: 10, padding: '12px 16px', marginBottom: 20,
    fontSize: 14, color: '#2D7A4F', animation: 'fadeIn 0.3s ease',
  },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.5s ease 0.2s both' },
  sideCard: {
    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)',
  },
  calHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  calTitle: { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--slate)' },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  calDayLabel: {
    fontSize: 9, fontWeight: 700, color: 'var(--slate-light)',
    textAlign: 'center', letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 4,
  },
  entryItem: (mood) => {
    const cfg = MOOD_MAP[mood] || MOOD_MAP.Calm;
    return { padding: '14px 16px', borderRadius: 12, marginBottom: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, transition: 'all 0.2s ease' };
  },
  entryHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  entryMoodLabel: (color) => ({ fontSize: 13, fontWeight: 700, color }),
  entryDate: { fontSize: 11, color: 'var(--slate-light)', marginLeft: 'auto' },
  entryText: {
    fontSize: 13, color: 'var(--slate)', lineHeight: 1.6,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  deleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--slate-light)', padding: '2px 4px',
    borderRadius: 4, transition: 'all 0.15s', display: 'flex', alignItems: 'center',
  },
};

function buildCalendarDays(calendar) {
  const today = new Date();
  const days  = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, mood: calendar[key]?.mood || null, isToday: i === 0 });
  }
  return days;
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DailyJournal() {
  const { authFetch } = useAuth();
  const [entries,  setEntries]  = useState([]);
  const [calendar, setCalendar] = useState({});
  const [mood,     setMood]     = useState(null);
  const [text,     setText]     = useState('');
  const [focused,  setFocused]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    authFetch('/journal/entries?limit=20').then(d => { if (d.success) setEntries(d.entries); });
    authFetch('/journal/mood-calendar').then(d => { if (d.success) setCalendar(d.calendar); });
  }, []); // eslint-disable-line

  const handleSubmit = async () => {
    if (!mood) return;
    setLoading(true);
    const res = await authFetch('/journal/entries', {
      method: 'POST', body: JSON.stringify({ mood, text_content: text }),
    });
    if (res.success) {
      setEntries(p => [res.entry, ...p]);
      const todayKey = new Date().toISOString().split('T')[0];
      setCalendar(p => ({ ...p, [todayKey]: { mood, has_text: !!text } }));
      setMood(null); setText('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await authFetch(`/journal/entries/${id}`, { method: 'DELETE' });
    setEntries(p => p.filter(e => e.id !== id));
  };

  const calDays  = buildCalendarDays(calendar);
  const firstDay = calDays.length > 0 ? new Date(calDays[0].date).getDay() : 0;

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <span style={s.eyebrow}>
          <span style={s.eyebrowInner}>
            <BookOpen size={11} strokeWidth={2.2} />
            Daily Journal
          </span>
        </span>
        <h1 style={s.pageTitle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            How are you feeling today?
            <PenLine size={28} color="var(--primary)" strokeWidth={1.6} />
          </span>
        </h1>
        <p style={s.pageSub}>Log your mood and thoughts. Your entries are private and only visible to you.</p>
      </div>

      <div style={s.layout}>
        {/* Left: Write entry */}
        <div style={s.writeCard}>
          <div style={s.cardTitleRow}>
            <PenLine size={18} color="var(--primary)" strokeWidth={1.8} />
            <h2 style={s.cardTitle}>New Entry</h2>
          </div>
          <p style={s.cardSub}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {success && (
            <div style={s.successBanner}>
              <Check size={16} strokeWidth={2.5} color="#2D7A4F" />
              Entry saved! Keep journaling to build your streak.
            </div>
          )}

          <p style={s.moodLabel}>How are you feeling?</p>
          <div style={s.moodGrid}>
            {MOODS.map(m => (
              <div
                key={m.value}
                style={s.moodBtn(mood === m.value, m)}
                onClick={() => setMood(m.value)}
                onMouseEnter={e => { if (mood !== m.value) e.currentTarget.style.borderColor = m.color; }}
                onMouseLeave={e => { if (mood !== m.value) e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <m.Icon size={22} color={mood === m.value ? m.color : '#8FA3B1'} strokeWidth={1.8} />
                <span style={s.moodBtnLabel(mood === m.value, m.color)}>{m.label}</span>
              </div>
            ))}
          </div>

          <p style={s.promptsLabel}>Quick prompts</p>
          <div style={s.promptsRow}>
            {PROMPTS.map(p => (
              <button
                key={p} style={s.promptChip}
                onClick={() => setText(prev => prev ? `${prev}\n\n${p} ` : `${p} `)}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-tint)'; e.currentTarget.style.color = 'var(--primary-dark)'; e.currentTarget.style.borderColor = 'var(--primary-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--blush)'; e.currentTarget.style.color = 'var(--slate-mid)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {p}
              </button>
            ))}
          </div>

          <div style={s.textareaWrap}>
            <textarea
              value={text}
              style={s.textarea(focused)}
              placeholder="Write about your day, how you're feeling, any symptoms, thoughts for your baby…"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={e => setText(e.target.value)}
            />
            <span style={s.charCount}>{text.length} chars</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              style={s.submitBtn(loading, !mood)}
              onClick={handleSubmit}
              disabled={!mood || loading}
              onMouseEnter={e => { if (mood && !loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {loading
                ? <><div style={s.spinner} /> Saving…</>
                : <><BookOpen size={15} strokeWidth={1.8} /> Save Entry</>
              }
            </button>
            {!mood && <span style={{ fontSize: 13, color: 'var(--slate-light)' }}>Select a mood first</span>}
          </div>

          {entries.length > 0 && (
            <div style={{ marginTop: 36 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--slate)', marginBottom: 4 }}>Past Entries</h3>
              <p style={{ fontSize: 13, color: 'var(--slate-light)', marginBottom: 16 }}>Your recent journal history</p>
              {entries.slice(0, 8).map(e => {
                const cfg = MOOD_MAP[e.mood] || MOOD_MAP.Calm;
                return (
                  <div key={e.id} style={s.entryItem(e.mood)}>
                    <div style={s.entryHeader}>
                      <cfg.Icon size={18} color={cfg.color} strokeWidth={1.8} />
                      <span style={s.entryMoodLabel(cfg.color)}>{e.mood}</span>
                      <span style={s.entryDate}>
                        {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <button
                        style={s.deleteBtn}
                        onClick={() => handleDelete(e.id)}
                        onMouseEnter={ev => { ev.currentTarget.style.color = 'var(--primary-dark)'; ev.currentTarget.style.background = 'var(--primary-tint)'; }}
                        onMouseLeave={ev => { ev.currentTarget.style.color = 'var(--slate-light)'; ev.currentTarget.style.background = 'none'; }}
                      >
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                    {e.text_content && <p style={s.entryText}>{e.text_content}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Calendar + Mood guide */}
        <div style={s.rightCol}>
          <div style={s.sideCard}>
            <div style={s.calHeader}>
              <h3 style={s.calTitle}>Mood Calendar</h3>
              <span style={{ fontSize: 12, color: 'var(--slate-light)' }}>Last 30 days</span>
            </div>
            <div style={s.calGrid}>
              {DAY_LABELS.map(d => <div key={d} style={s.calDayLabel}>{d}</div>)}
            </div>
            <div style={{ ...s.calGrid, marginTop: 4 }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {calDays.map(({ date, mood: dayMood, isToday }) => {
                const cfg = dayMood ? MOOD_MAP[dayMood] : null;
                return (
                  <div
                    key={date}
                    title={dayMood ? `${dayMood} · ${date}` : date}
                    style={{
                      aspectRatio: '1', borderRadius: 6,
                      background: cfg ? cfg.bg : 'var(--blush)',
                      border: isToday ? '2px solid var(--primary)' : '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: dayMood ? 'pointer' : 'default', transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => { if (dayMood) e.currentTarget.style.transform = 'scale(1.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                  >
                    {cfg && <cfg.Icon size={11} color={cfg.color} strokeWidth={2} />}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MOODS.slice(0, 5).map(m => (
                <div key={m.value} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--slate-mid)' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: m.bg, border: `1px solid ${m.border}`, display: 'inline-block' }} />
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          <div style={s.sideCard}>
            <h3 style={{ ...s.calTitle, marginBottom: 14 }}>Mood Guide</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOODS.map(m => (
                <div key={m.value} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8, background: m.bg, border: `1px solid ${m.border}`,
                }}>
                  <m.Icon size={18} color={m.color} strokeWidth={1.8} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: m.color, flex: 1 }}>{m.label}</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 14, fontSize: 12, color: 'var(--slate-light)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--blush)', borderRadius: 8 }}>
              Your mood patterns help identify emotional wellbeing trends over your pregnancy journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}