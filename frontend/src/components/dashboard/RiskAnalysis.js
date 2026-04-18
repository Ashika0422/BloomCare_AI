import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  Legend, Area, AreaChart,
} from 'recharts';
import {
  Heart, Droplets, Thermometer, Activity, FlaskConical,
  ShieldCheck, ShieldAlert, ShieldX, ScanLine,
  AlertTriangle, ClipboardList,
} from 'lucide-react';

/* ── Vital config ──────────────────────────────────────────── */
const VITALS = [
  {
    key: 'systolicBP',   dbKey: 'systolic_bp',
    label: 'Systolic BP',      unit: 'mmHg',
    min: 70,  max: 180,  step: 1,   placeholder: '120',
    normalMin: 90,  normalMax: 120,
    Icon: Heart,       color: '#B100E7', lightColor: '#F5E6FF',
    desc: 'Upper blood pressure reading',
  },
  {
    key: 'diastolicBP',  dbKey: 'diastolic_bp',
    label: 'Diastolic BP',     unit: 'mmHg',
    min: 40,  max: 120,  step: 1,   placeholder: '80',
    normalMin: 60,  normalMax: 80,
    Icon: Heart,       color: '#8A00F3', lightColor: '#EDD5FF',
    desc: 'Lower blood pressure reading',
  },
  {
    key: 'bloodGlucose', dbKey: 'blood_glucose',
    label: 'Blood Glucose',    unit: 'mmol/L',
    min: 1.0, max: 30.0, step: 0.1, placeholder: '6.1',
    normalMin: 3.9, normalMax: 7.8,
    Icon: Droplets,    color: '#D4924A', lightColor: '#FDF3E7',
    desc: 'Blood sugar level',
  },
  {
    key: 'bodyTemp',     dbKey: 'body_temp',
    label: 'Body Temperature', unit: '°F',
    min: 95,  max: 104,  step: 0.1, placeholder: '98.0',
    normalMin: 97.0, normalMax: 99.0,
    Icon: Thermometer, color: '#5A8A72', lightColor: '#EBF4EF',
    desc: 'Core body temperature',
  },
  {
    key: 'heartRate',    dbKey: 'heart_rate',
    label: 'Heart Rate',       unit: 'bpm',
    min: 40,  max: 120,  step: 1,   placeholder: '72',
    normalMin: 60,  normalMax: 100,
    Icon: Activity,    color: '#546A7B', lightColor: '#EDF2F5',
    desc: 'Resting heart rate',
  },
];

const VITAL_MAP = Object.fromEntries(VITALS.map(v => [v.key, v]));

const RISK_CFG = {
  0: { label: 'Low Risk',  Icon: ShieldCheck, color: '#2D7A4F', bg: '#EBF4EF', border: '#A8D5B8', grad: 'linear-gradient(135deg,#EBF4EF,#D4EDDA)' },
  1: { label: 'Mid Risk',  Icon: ShieldAlert, color: '#9A6B1A', bg: '#FDF3E7', border: '#F5C97B', grad: 'linear-gradient(135deg,#FDF3E7,#FAECD4)' },
  2: { label: 'High Risk', Icon: ShieldX,     color: '#8A00F3', bg: '#F5E6FF', border: '#E8CCFF', grad: 'linear-gradient(135deg,#F5E6FF,#EDD5FF)' },
};

const STATUS_CFG = {
  normal: { label: 'Normal', color: '#2D7A4F', bg: '#EBF4EF' },
  high:   { label: 'High',   color: '#8A00F3', bg: '#F5E6FF' },
  low:    { label: 'Low',    color: '#9A6B1A', bg: '#FDF3E7' },
};

const s = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px', fontFamily: 'var(--font-body)' },
  pageHeader: { marginBottom: 36, animation: 'fadeUp 0.5s ease both' },
  eyebrow: { display: 'inline-block', background: 'var(--primary-tint)', color: 'var(--primary-dark)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, border: '1px solid var(--primary-light)' },
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, color: 'var(--slate)', letterSpacing: '-0.4px', marginBottom: 6, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 12 },
  pageSub: { fontSize: 15, color: 'var(--slate-mid)' },
  statusStrip: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28, animation: 'fadeUp 0.5s ease 0.05s both' },
  statusCard: (v, status) => ({ background: 'var(--white)', borderRadius: 'var(--radius-md)', border: `1.5px solid ${status === 'normal' ? 'var(--border)' : status === 'high' ? '#E8CCFF' : '#F5C97B'}`, padding: '14px 16px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }),
  statusTop: { height: 3, borderRadius: '8px 8px 0 0', position: 'absolute', top: 0, left: 0, right: 0 },
  statusIcon: { marginBottom: 6 },
  statusVal: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--slate)', lineHeight: 1, marginBottom: 2 },
  statusLabel: { fontSize: 11, color: 'var(--slate-light)', marginBottom: 6 },
  statusBadge: (status) => ({ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: STATUS_CFG[status]?.bg || 'var(--blush)', color: STATUS_CFG[status]?.color || 'var(--slate-mid)', letterSpacing: '0.04em', textTransform: 'uppercase' }),
  mainLayout: { display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' },
  inputPanel: { background: 'var(--white)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '30px', boxShadow: 'var(--shadow-sm)', animation: 'fadeUp 0.5s ease 0.1s both', position: 'sticky', top: 82 },
  panelTitle: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--slate)', marginBottom: 4 },
  panelSub: { fontSize: 13, color: 'var(--slate-light)', marginBottom: 24 },
  vitalField: { marginBottom: 16 },
  vitalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  vitalLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--slate-mid)', letterSpacing: '0.05em', textTransform: 'uppercase' },
  vitalNormal: { fontSize: 10, color: 'var(--slate-light)' },
  inputRow: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: (focused, status) => ({ width: '100%', padding: '11px 52px 11px 14px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${status === 'high' ? '#E8CCFF' : status === 'low' ? '#F5C97B' : focused ? 'var(--primary)' : 'var(--border)'}`, background: status === 'high' ? '#F5E6FF' : status === 'low' ? '#FDF3E7' : focused ? 'var(--blush)' : '#fdfaf7', fontSize: 15, color: 'var(--slate)', outline: 'none', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease', boxShadow: focused ? '0 0 0 3px rgba(177,0,231,0.15)' : 'none' }),
  inputUnit: { position: 'absolute', right: 12, fontSize: 11, fontWeight: 600, color: 'var(--slate-light)', letterSpacing: '0.04em', pointerEvents: 'none' },
  rangeBar: { marginTop: 5, height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' },
  analyseBtn: (loading) => ({ width: '100%', marginTop: 8, padding: '15px', borderRadius: 'var(--radius-md)', background: loading ? 'var(--primary-light)' : 'linear-gradient(135deg, #8A00F3 0%, #6E01F4 100%)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', transition: 'all 0.2s ease', fontFamily: 'var(--font-body)', boxShadow: loading ? 'none' : '0 6px 24px rgba(110,1,244,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }),
  spinner: { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  disclaimer: { marginTop: 14, padding: '10px 14px', background: 'var(--warning-light)', borderRadius: 8, border: '1px solid rgba(212,146,74,0.25)', fontSize: 11, color: '#7A5020', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 6 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.5s ease 0.15s both' },
  card: { background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '26px 28px', boxShadow: 'var(--shadow-sm)' },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--slate)', marginBottom: 4 },
  cardSub: { fontSize: 12, color: 'var(--slate-light)', marginBottom: 20 },
  resultCard: (cfg) => ({ borderRadius: 'var(--radius-xl)', border: `1.5px solid ${cfg.border}`, overflow: 'hidden', boxShadow: 'var(--shadow-md)', animation: 'bounceIn 0.5s cubic-bezier(.36,.07,.19,.97) both' }),
  resultHeader: (cfg) => ({ background: cfg.grad, padding: '28px 32px 24px', borderBottom: `1px solid ${cfg.border}` }),
  resultTop: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 },
  resultLabelSm: { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 },
  resultLabelLg: (color) => ({ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, color, lineHeight: 1.1 }),
  confidenceWrap: { background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '12px 16px', backdropFilter: 'blur(4px)' },
  confRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  confLabel: { fontSize: 12, fontWeight: 600 },
  confVal: (color) => ({ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color }),
  confBar: { height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.5)', overflow: 'hidden' },
  resultBody: { background: 'var(--white)', padding: '24px 32px' },
  messageBanner: (cfg) => ({ padding: '14px 18px', borderRadius: 10, marginBottom: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: 14, color: 'var(--slate)', lineHeight: 1.7 }),
  actionBanner: (cfg) => ({ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', borderRadius: 10, marginBottom: 24, background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: 13, color: cfg.color, fontWeight: 500 }),
  probSection: { marginBottom: 24 },
  probSectionTitle: { fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 },
  probRow: { marginBottom: 12 },
  probRowTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 5 },
  probName: { fontSize: 13, fontWeight: 500, color: 'var(--slate)' },
  probPct: { fontSize: 13, fontWeight: 700, color: 'var(--slate)' },
  probTrack: { height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' },
  probFill: (color, pct, delay) => ({ height: '100%', borderRadius: 99, background: color, width: `${pct}%`, transition: `width 1s cubic-bezier(.4,0,.2,1) ${delay}ms` }),
  xaiSection: { marginBottom: 4 },
  xaiTitle: { fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 },
  xaiRow: (status) => ({ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '10px 14px', borderRadius: 10, background: status !== 'normal' ? (status === 'high' ? '#F5E6FF' : '#FDF3E7') : 'var(--blush)', border: `1px solid ${status === 'high' ? '#E8CCFF' : status === 'low' ? '#F5C97B' : 'var(--border)'}` }),
  xaiInfo: { flex: 1, minWidth: 0 },
  xaiLabel: { fontSize: 13, fontWeight: 600, color: 'var(--slate)', marginBottom: 2 },
  xaiVal: (status) => ({ fontSize: 12, color: status === 'high' ? '#8A00F3' : status === 'low' ? '#9A6B1A' : 'var(--slate-mid)', fontWeight: status !== 'normal' ? 600 : 400 }),
  xaiBarWrap: { width: 80, flexShrink: 0 },
  xaiBarTrack: { height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginBottom: 2 },
  xaiBarFill: (color, pct) => ({ height: '100%', borderRadius: 99, background: color, width: `${pct}%`, transition: 'width 1s ease' }),
  xaiPct: (color) => ({ fontSize: 10, fontWeight: 700, color, textAlign: 'right' }),
  xaiStatusBadge: (status) => ({ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: STATUS_CFG[status]?.bg || 'var(--blush)', color: STATUS_CFG[status]?.color || 'var(--slate)', letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }),
  tabRow: { display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' },
  tab: (active, color) => ({ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.18s ease', background: active ? color : 'var(--blush)', color: active ? '#fff' : 'var(--slate-mid)', fontFamily: 'var(--font-body)', boxShadow: active ? `0 3px 10px ${color}55` : 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }),
  empty: { textAlign: 'center', padding: '48px 24px', background: 'var(--white)', borderRadius: 'var(--radius-xl)', border: '1.5px dashed var(--primary-light)' },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--slate)', marginBottom: 8, marginTop: 16 },
  emptySub: { fontSize: 14, color: 'var(--slate-light)', lineHeight: 1.6 },
  histTable: { width: '100%', borderCollapse: 'collapse' },
  histTh: { fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--border)' },
  histTd: { padding: '11px 12px', fontSize: 13, color: 'var(--slate)', borderBottom: '1px solid var(--border)' },
  riskPill: (cfg) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }),
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 600, color: 'var(--slate)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color, marginTop: 2 }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
};

function RangeFill({ value, min, max, normalMin, normalMax, color }) {
  if (!value) return <div style={s.rangeBar} />;
  const pct = Math.min(100, Math.max(0, ((parseFloat(value) - min) / (max - min)) * 100));
  const isNormal = parseFloat(value) >= normalMin && parseFloat(value) <= normalMax;
  return (
    <div style={s.rangeBar}>
      <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: isNormal ? '#5A8A72' : color, transition: 'width 0.3s ease' }} />
    </div>
  );
}

export default function RiskAnalysis() {
  const { user, authFetch } = useAuth();
  const [form,    setForm]    = useState({});
  const [focused, setFocused] = useState(null);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [apiErr,  setApiErr]  = useState('');
  const [trends,   setTrends]   = useState(null);
  const [history,  setHistory]  = useState([]);
  const [activeTab,setActiveTab]= useState('combined');
  const [animated, setAnimated] = useState(false);

  const fetchData = useCallback(async () => {
    const [t, h] = await Promise.all([authFetch('/vitals/trends?limit=15'), authFetch('/vitals/history?limit=10')]);
    if (t.success) setTrends(t);
    if (h.success) setHistory(h.history);
  }, [authFetch]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);

  const validate = () => {
    const errs = {};
    VITALS.forEach(v => {
      const val = form[v.key];
      if (!val && val !== 0) { errs[v.key] = 'Required'; return; }
      const n = parseFloat(val);
      if (isNaN(n) || n < v.min || n > v.max) errs[v.key] = `${v.min}–${v.max} ${v.unit}`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getFieldStatus = (key) => {
    const v = VITAL_MAP[key];
    const val = parseFloat(form[key]);
    if (!form[key] || isNaN(val)) return null;
    if (val < v.normalMin) return 'low';
    if (val > v.normalMax) return 'high';
    return 'normal';
  };

  const handleAnalyse = async () => {
    if (!validate()) return;
    setLoading(true); setResult(null); setApiErr('');
    try {
      const payload = {};
      VITALS.forEach(v => { payload[v.key] = parseFloat(form[v.key]); });
      const res = await authFetch('/api/predict', { method: 'POST', body: JSON.stringify(payload) });
      if (res.success) { setResult(res); fetchData(); setTimeout(() => setAnimated(true), 100); }
      else { setApiErr(res.errors?.join(' · ') || res.error || 'Prediction failed.'); }
    } catch { setApiErr('Cannot reach the server. Make sure Flask is running.'); }
    finally { setLoading(false); }
  };

  const combinedData = trends?.timestamps?.map((t, i) => {
    const row = { time: t };
    VITALS.forEach(v => { row[v.label] = trends.trend_data[v.dbKey]?.[i]; });
    return row;
  }) || [];

  const activeVital = VITALS.find(v => v.dbKey === activeTab);
  const latestStatus = trends?.latest_status || {};

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <span style={s.eyebrow}>ML Risk Module</span>
        <h1 style={s.pageTitle}>
          <ScanLine size={28} color="var(--primary)" strokeWidth={1.6} />
          Risk Analysis
        </h1>
        <p style={s.pageSub}>Log your vitals, view trends, and get an AI-powered health risk assessment.</p>
      </div>

      {/* Status strip */}
      {Object.keys(latestStatus).length > 0 && (
        <div style={s.statusStrip}>
          {VITALS.map(v => {
            const st = latestStatus[v.dbKey];
            if (!st) return null;
            const status = st.status;
            return (
              <div key={v.key} style={s.statusCard(v, status)}>
                <div style={{ ...s.statusTop, background: v.color }} />
                <div style={{ ...s.statusIcon, marginTop: 8 }}>
                  <v.Icon size={20} color={v.color} strokeWidth={1.8} />
                </div>
                <div style={s.statusVal}>{st.value}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--slate-light)' }}> {st.unit}</span></div>
                <div style={s.statusLabel}>{v.label}</div>
                <span style={s.statusBadge(status)}>{STATUS_CFG[status]?.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={s.mainLayout}>
        {/* Input panel */}
        <div style={s.inputPanel}>
          <h2 style={s.panelTitle}>Log Vitals</h2>
          <p style={s.panelSub}>Enter today's measurements for {user?.full_name?.split(' ')[0]}</p>

          {VITALS.map(v => {
            const fieldStatus = getFieldStatus(v.key);
            return (
              <div key={v.key} style={s.vitalField}>
                <div style={s.vitalHeader}>
                  <label style={s.vitalLabel}>
                    <v.Icon size={14} color={v.color} strokeWidth={2} />
                    {v.label}
                  </label>
                  <span style={s.vitalNormal}>Normal: {v.normalMin}–{v.normalMax} {v.unit}</span>
                </div>
                <div style={s.inputRow}>
                  <input
                    type="number" min={v.min} max={v.max} step={v.step}
                    placeholder={v.placeholder}
                    value={form[v.key] ?? ''}
                    style={s.input(focused === v.key, fieldStatus)}
                    onFocus={() => setFocused(v.key)}
                    onBlur={() => setFocused(null)}
                    onChange={e => { setForm(p => ({ ...p, [v.key]: e.target.value })); if (errors[v.key]) setErrors(p => ({ ...p, [v.key]: null })); }}
                  />
                  <span style={s.inputUnit}>{v.unit}</span>
                </div>
                <RangeFill value={form[v.key]} min={v.min} max={v.max} normalMin={v.normalMin} normalMax={v.normalMax} color={v.color} />
                {errors[v.key] && <span style={{ fontSize: 11, color: 'var(--primary-dark)', marginTop: 3, display: 'block', fontWeight: 500 }}>Valid range: {errors[v.key]}</span>}
              </div>
            );
          })}

          {apiErr && (
            <div style={{ background: 'var(--primary-tint)', border: '1px solid var(--primary-light)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--primary-dark)', marginBottom: 12, animation: 'fadeIn 0.3s ease', display: 'flex', alignItems: 'center', gap: 7 }}>
              <AlertTriangle size={14} strokeWidth={2} /> {apiErr}
            </div>
          )}

          <button style={s.analyseBtn(loading)} onClick={handleAnalyse} disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {loading
              ? <><div style={s.spinner} /> Analysing…</>
              : <><FlaskConical size={18} strokeWidth={1.8} /> Analyse My Risk</>
            }
          </button>

          <div style={s.disclaimer}>
            <AlertTriangle size={13} color="#7A5020" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>Disclaimer:</strong> This tool is for educational purposes only. Always consult a qualified healthcare provider for medical decisions.</span>
          </div>
        </div>

        {/* Right: Results + Charts */}
        <div style={s.rightCol}>

          {/* Result */}
          {result ? (() => {
            const cfg = RISK_CFG[result.prediction];
            return (
              <div style={s.resultCard(cfg)}>
                <div style={s.resultHeader(cfg)}>
                  <div style={s.resultTop}>
                    <cfg.Icon size={52} color={cfg.color} strokeWidth={1.4} />
                    <div>
                      <div style={{ ...s.resultLabelSm, color: cfg.color }}>Prediction Result</div>
                      <div style={s.resultLabelLg(cfg.color)}>{cfg.label}</div>
                    </div>
                  </div>
                  <div style={s.confidenceWrap}>
                    <div style={s.confRow}>
                      <span style={{ ...s.confLabel, color: cfg.color }}>Model Confidence</span>
                      <span style={s.confVal(cfg.color)}>{result.confidence}%</span>
                    </div>
                    <div style={s.confBar}>
                      <div style={{ height: '100%', borderRadius: 99, background: cfg.color, width: animated ? `${result.confidence}%` : '0%', transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
                    </div>
                  </div>
                </div>
                <div style={s.resultBody}>
                  <div style={s.messageBanner(cfg)}>{result.message}</div>
                  <div style={s.actionBanner(cfg)}>
                    <ClipboardList size={15} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{result.action}</span>
                  </div>

                  <div style={s.probSection}>
                    <p style={s.probSectionTitle}>Probability Breakdown</p>
                    {[
                      { label: 'Low Risk',  val: result.probabilities.low_risk,  color: '#5A8A72', delay: 100 },
                      { label: 'Mid Risk',  val: result.probabilities.mid_risk,  color: '#D4924A', delay: 200 },
                      { label: 'High Risk', val: result.probabilities.high_risk, color: '#B100E7', delay: 300 },
                    ].map(p => (
                      <div key={p.label} style={s.probRow}>
                        <div style={s.probRowTop}>
                          <span style={s.probName}>{p.label}</span>
                          <span style={s.probPct}>{p.val}%</span>
                        </div>
                        <div style={s.probTrack}>
                          <div style={s.probFill(p.color, animated ? p.val : 0, p.delay)} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={s.xaiSection}>
                    <p style={s.xaiTitle}>Parameter Impact (Explainable AI)</p>
                    <p style={{ fontSize: 12, color: 'var(--slate-light)', marginBottom: 14, lineHeight: 1.5 }}>How much each vital sign influenced this prediction, based on model feature importance.</p>
                    {result.feature_impact?.map((f) => {
                      const vitalCfg = VITAL_MAP[f.key];
                      const ImpactIcon = vitalCfg ? vitalCfg.Icon : Activity;
                      return (
                        <div key={f.key} style={s.xaiRow(f.status)}>
                          <ImpactIcon size={18} color={f.status === 'high' ? '#B100E7' : f.status === 'low' ? '#D4924A' : '#5A8A72'} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                          <div style={s.xaiInfo}>
                            <div style={s.xaiLabel}>{f.label}</div>
                            <div style={s.xaiVal(f.status)}>{f.value} {f.unit}{f.status !== 'normal' && ` · ${f.status.toUpperCase()}`}</div>
                          </div>
                          <div style={s.xaiBarWrap}>
                            <div style={s.xaiBarTrack}>
                              <div style={s.xaiBarFill(f.status === 'high' ? '#B100E7' : f.status === 'low' ? '#D4924A' : '#5A8A72', animated ? Math.min(f.impact * 2.5, 100) : 0)} />
                            </div>
                            <div style={s.xaiPct(f.status === 'high' ? '#8A00F3' : f.status === 'low' ? '#9A6B1A' : '#5A8A72')}>{f.impact}%</div>
                          </div>
                          <span style={s.xaiStatusBadge(f.status)}>{f.status}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })() : (
            <div style={s.empty}>
              <FlaskConical size={52} color="var(--border)" strokeWidth={1.2} style={{ display: 'block', margin: '0 auto' }} />
              <h3 style={s.emptyTitle}>No analysis yet</h3>
              <p style={s.emptySub}>Enter your vitals on the left and click <strong>Analyse My Risk</strong> to see your assessment here.</p>
            </div>
          )}

          {/* Trend Charts */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Vital Sign Trends</h3>
            <p style={s.cardSub}>Your health metrics over the last 15 readings</p>

            <div style={s.tabRow}>
              <button style={s.tab(activeTab === 'combined', '#546A7B')} onClick={() => setActiveTab('combined')}>
                <Activity size={12} strokeWidth={2} /> Combined View
              </button>
              {VITALS.map(v => (
                <button key={v.dbKey} style={s.tab(activeTab === v.dbKey, v.color)} onClick={() => setActiveTab(v.dbKey)}>
                  <v.Icon size={12} strokeWidth={2} /> {v.label}
                </button>
              ))}
            </div>

            {combinedData.length > 0 ? (
              activeTab === 'combined' ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={combinedData} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--slate-light)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--slate-light)' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--slate-mid)' }} />
                    {VITALS.map(v => <Line key={v.label} type="monotone" dataKey={v.label} stroke={v.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}
                  </LineChart>
                </ResponsiveContainer>
              ) : (() => {
                const vCfg = activeVital;
                const chartData = trends?.timestamps?.map((t, i) => ({ time: t, value: trends.trend_data[activeTab]?.[i] })) || [];
                return (
                  <div>
                    {vCfg && <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}><span style={{ fontSize: 13, color: 'var(--slate-mid)' }}><span style={{ color: '#5A8A72', fontWeight: 600 }}>■</span> Normal: {vCfg.normalMin}–{vCfg.normalMax} {vCfg.unit}</span></div>}
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={chartData} margin={{ left: -10, right: 10 }}>
                        <defs>
                          <linearGradient id={`grad-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={vCfg?.color || '#B100E7'} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={vCfg?.color || '#B100E7'} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--slate-light)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--slate-light)' }} domain={[vCfg ? vCfg.min : 'auto', vCfg ? vCfg.max : 'auto']} />
                        <Tooltip content={<ChartTooltip />} />
                        {vCfg && (
                          <>
                            <ReferenceLine y={vCfg.normalMin} stroke="#5A8A72" strokeDasharray="4 4" strokeWidth={1} />
                            <ReferenceLine y={vCfg.normalMax} stroke="#5A8A72" strokeDasharray="4 4" strokeWidth={1} />
                          </>
                        )}
                        <Area type="monotone" dataKey="value" stroke={vCfg?.color || '#B100E7'} strokeWidth={2.5} fill={`url(#grad-${activeTab})`} dot={{ r: 3, fill: vCfg?.color || '#B100E7' }} activeDot={{ r: 5 }} name={vCfg?.label || activeTab} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--slate-light)', fontSize: 14 }}>No trend data yet. Log your first vitals above to see charts.</div>
            )}
          </div>

          {/* History table */}
          {history.length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Recent Readings</h3>
              <p style={s.cardSub}>Last {history.length} logged vital sign records</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={s.histTable}>
                  <thead>
                    <tr>{['Date', 'Sys BP', 'Dia BP', 'Glucose', 'Temp', 'HR', 'Risk', 'Confidence'].map(h => <th key={h} style={s.histTh}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {history.map(log => {
                      const rc = log.risk_level !== null ? RISK_CFG[log.risk_level] : null;
                      return (
                        <tr key={log.id} style={{ transition: 'background 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--blush)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          <td style={s.histTd}>{new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={s.histTd}>{log.systolic_bp}</td>
                          <td style={s.histTd}>{log.diastolic_bp}</td>
                          <td style={s.histTd}>{log.blood_glucose}</td>
                          <td style={s.histTd}>{log.body_temp}</td>
                          <td style={s.histTd}>{log.heart_rate}</td>
                          <td style={s.histTd}>
                            {rc
                              ? <span style={s.riskPill(rc)}><rc.Icon size={10} strokeWidth={2} />{rc.label}</span>
                              : '—'}
                          </td>
                          <td style={s.histTd}>{log.confidence != null ? `${log.confidence}%` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}