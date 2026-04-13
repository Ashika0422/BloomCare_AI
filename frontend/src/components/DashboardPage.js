import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar,
  Cell, PieChart, Pie, Legend
} from 'recharts';

/* ── Static model data (update after training) ─────────── */
const MODEL_STATS = {
  name:      'Random Forest (Tuned)',
  accuracy:  87.68,
  precision: 86.5,
  recall:    87.1,
  f1:        86.7,
  trainSize: 811,
  testSize:  203,
  features:  6,
  classes:   3,
};

const FEATURE_IMPORTANCE = [
  { name: 'Blood Glucose', value: 0.312, color: '#B100E7' },
  { name: 'Systolic BP',   value: 0.241, color: '#8A00F3' },
  { name: 'Age',           value: 0.178, color: '#D4924A' },
  { name: 'Diastolic BP',  value: 0.132, color: '#5A8A72' },
  { name: 'Heart Rate',    value: 0.089, color: '#546A7B' },
  { name: 'Body Temp',     value: 0.048, color: '#8FA3B1' },
];

const CLASS_METRICS = [
  { class: 'Low Risk',  precision: 90, recall: 88, f1: 89, color: '#5A8A72', samples: 336 },
  { class: 'Mid Risk',  precision: 82, recall: 80, f1: 81, color: '#D4924A', samples: 272 },
  { class: 'High Risk', precision: 89, recall: 93, f1: 91, color: '#B100E7', samples: 406 },
];

const MODEL_COMPARISON = [
  { name: 'Random Forest', accuracy: 87.68, cv: 85.2 },
  { name: 'XGBoost',       accuracy: 85.22, cv: 83.7 },
  { name: 'KNN',           accuracy: 78.81, cv: 76.4 },
  { name: 'Log. Reg.',     accuracy: 68.47, cv: 67.1 },
];

/* ── Styles ─────────────────────────────────────────────── */
const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '48px 32px 80px' },
  hero: { marginBottom: 44, animation: 'fadeUp 0.5s ease both' },
  eyebrow: {
    display: 'inline-block', background: 'var(--primary-tint)',
    color: 'var(--primary-dark)', fontSize: 11, fontWeight: 600,
    padding: '4px 14px', borderRadius: 99, letterSpacing: '0.1em',
    textTransform: 'uppercase', marginBottom: 14, border: '1px solid var(--primary-light)',
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600,
    color: 'var(--slate)', marginBottom: 8, letterSpacing: '-0.4px',
  },
  sub: { fontSize: 15, color: 'var(--slate-mid)' },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16, marginBottom: 28,
    animation: 'fadeUp 0.5s ease 0.1s both',
  },
  statCard: (accent) => ({
    background: 'var(--white)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', padding: '20px 22px',
    borderTop: `3px solid ${accent}`,
    boxShadow: 'var(--shadow-sm)',
  }),
  statVal: {
    fontFamily: 'var(--font-display)', fontSize: 32,
    fontWeight: 600, color: 'var(--slate)', lineHeight: 1.1, marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: 'var(--slate-light)', fontWeight: 500 },
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 20, marginBottom: 20,
  },
  card: (delay = 0) => ({
    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '28px',
    boxShadow: 'var(--shadow-sm)',
    animation: `fadeUp 0.5s ease ${delay}ms both`,
  }),
  chartTitle: {
    fontFamily: 'var(--font-display)', fontSize: 18,
    fontWeight: 600, color: 'var(--slate)', marginBottom: 4,
  },
  chartSub: { fontSize: 12, color: 'var(--slate-light)', marginBottom: 20 },
  classRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
    gap: 14, marginBottom: 20,
    animation: 'fadeUp 0.5s ease 0.3s both',
  },
  classCard: (color) => ({
    background: 'var(--white)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', padding: '20px 22px',
    borderLeft: `4px solid ${color}`,
    boxShadow: 'var(--shadow-sm)',
  }),
  classLabel: (color) => ({
    fontSize: 13, fontWeight: 700, color, marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }),
  metricRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13, color: 'var(--slate-mid)', marginBottom: 6,
  },
  metricVal: { fontWeight: 600, color: 'var(--slate)' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
      boxShadow: 'var(--shadow-md)',
    }}>
      <strong style={{ color: 'var(--slate)' }}>{label || payload[0]?.name}</strong>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginTop: 4 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
          {p.name?.includes('accuracy') || p.name?.includes('cv') ? '%' : ''}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 200); }, []);

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <span style={s.eyebrow}>Model Performance</span>
        <h1 style={s.title}>Model Dashboard</h1>
        <p style={s.sub}>
          Performance metrics and statistics for the trained {MODEL_STATS.name}.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={s.statsRow}>
        {[
          { val: `${MODEL_STATS.accuracy}%`, label: 'Test Accuracy',   accent: 'var(--primary)' },
          { val: `${MODEL_STATS.f1}%`,       label: 'F1 Score (macro)',accent: 'var(--success)' },
          { val: MODEL_STATS.trainSize,       label: 'Training Samples',accent: 'var(--warning)'},
          { val: MODEL_STATS.features,        label: 'Input Features',  accent: 'var(--slate-mid)'},
        ].map((st, i) => (
          <div key={i} style={s.statCard(st.accent)}>
            <div style={s.statVal}>{st.val}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={s.grid2}>
        {/* Feature Importance */}
        <div style={s.card(150)}>
          <h3 style={s.chartTitle}>Feature Importance</h3>
          <p style={s.chartSub}>Which vitals drive the prediction most</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--slate-light)' }} domain={[0, 0.35]} />
              <YAxis dataKey="name" type="category" width={100}
                tick={{ fontSize: 11, fill: 'var(--slate-mid)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Importance" radius={[0, 4, 4, 0]}>
                {FEATURE_IMPORTANCE.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model Comparison */}
        <div style={s.card(200)}>
          <h3 style={s.chartTitle}>Model Comparison</h3>
          <p style={s.chartSub}>Test accuracy vs cross-validation score</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MODEL_COMPARISON} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--slate-mid)' }} />
              <YAxis domain={[55, 100]} tick={{ fontSize: 11, fill: 'var(--slate-light)' }}
                tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--slate-mid)' }} />
              <Bar dataKey="accuracy" name="Test Accuracy" fill="var(--primary)"    radius={[4,4,0,0]} />
              <Bar dataKey="cv"       name="CV Score"      fill="var(--success)"    radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-class metrics */}
      <div style={{ marginBottom: 8, animation: 'fadeUp 0.5s ease 0.25s both' }}>
        <h3 style={{ ...s.chartTitle, marginBottom: 4 }}>Per-Class Performance</h3>
        <p style={{ ...s.chartSub, marginBottom: 20 }}>
          Precision, recall, and F1 score for each risk category
        </p>
      </div>
      <div style={s.classRow}>
        {CLASS_METRICS.map((c, i) => (
          <div key={i} style={s.classCard(c.color)}>
            <div style={s.classLabel(c.color)}>{c.class}</div>
            {[
              ['Precision', c.precision],
              ['Recall',    c.recall],
              ['F1 Score',  c.f1],
              ['Samples',   c.samples],
            ].map(([label, val]) => (
              <div key={label} style={s.metricRow}>
                <span>{label}</span>
                <span style={s.metricVal}>
                  {label === 'Samples' ? val : `${val}%`}
                </span>
              </div>
            ))}
            {/* Mini bar */}
            <div style={{
              marginTop: 12, height: 5, borderRadius: 99,
              background: 'var(--border)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: animated ? `${c.f1}%` : '0%',
                background: c.color, borderRadius: 99,
                transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
            <div style={{ fontSize: 10, color: c.color, marginTop: 4, fontWeight: 600 }}>
              F1 Score: {c.f1}%
            </div>
          </div>
        ))}
      </div>

      {/* Dataset distribution */}
      <div style={s.card(350)}>
        <h3 style={s.chartTitle}>Dataset Distribution</h3>
        <p style={s.chartSub}>Class balance across 1,014 patient records</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <ResponsiveContainer width="40%" height={200}>
            <PieChart>
              <Pie
                data={CLASS_METRICS.map(c => ({ name: c.class, value: c.samples }))}
                cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value"
              >
                {CLASS_METRICS.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} samples`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1 }}>
            {CLASS_METRICS.map((c, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate)' }}>
                    <span style={{
                      display: 'inline-block', width: 10, height: 10,
                      borderRadius: '50%', background: c.color, marginRight: 8,
                    }} />
                    {c.class}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)' }}>
                    {c.samples} ({Math.round(c.samples / 1014 * 100)}%)
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: animated ? `${Math.round(c.samples / 1014 * 100)}%` : '0%',
                    background: c.color, borderRadius: 99,
                    transition: `width 1s ease ${i * 150}ms`,
                  }} />
                </div>
              </div>
            ))}
            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'var(--blush)', borderRadius: 8,
              fontSize: 12, color: 'var(--slate-mid)', lineHeight: 1.6,
            }}>
              Dataset collected from hospitals and clinics in rural Bangladesh.
              1,014 total records · No missing values.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
