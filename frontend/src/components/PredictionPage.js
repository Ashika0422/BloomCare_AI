import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ResultCard from './ResultCard';

const FIELDS = [
  {
    key: 'age', label: 'Age', unit: 'years',
    min: 10, max: 70, step: 1, placeholder: '25',
    icon: '👤', hint: 'Maternal age (10–70)',
    type: 'number'
  },
  {
    key: 'systolicBP', label: 'Systolic BP', unit: 'mmHg',
    min: 70, max: 180, step: 1, placeholder: '120',
    icon: '🫀', hint: 'Upper blood pressure (70–180)',
    type: 'number'
  },
  {
    key: 'diastolicBP', label: 'Diastolic BP', unit: 'mmHg',
    min: 40, max: 120, step: 1, placeholder: '80',
    icon: '💓', hint: 'Lower blood pressure (40–120)',
    type: 'number'
  },
  {
    key: 'bloodGlucose', label: 'Blood Glucose', unit: 'mmol/L',
    min: 1.0, max: 30.0, step: 0.1, placeholder: '6.1',
    icon: '🩸', hint: 'Blood sugar level (1–30)',
    type: 'number'
  },
  {
    key: 'bodyTemp', label: 'Body Temperature', unit: '°F',
    min: 95, max: 104, step: 0.1, placeholder: '98.0',
    icon: '🌡️', hint: 'Body temperature (95–104)',
    type: 'number'
  },
  {
    key: 'heartRate', label: 'Heart Rate', unit: 'bpm',
    min: 40, max: 120, step: 1, placeholder: '72',
    icon: '📈', hint: 'Resting heart rate (40–120)',
    type: 'number'
  },
];

const SAMPLE_CASES = [
  {
    label: 'Low Risk Sample',
    color: 'var(--success)',
    bg: 'var(--success-light)',
    data: { age: 25, systolicBP: 115, diastolicBP: 75, bloodGlucose: 6.1, bodyTemp: 98.0, heartRate: 72 }
  },
  {
    label: 'Mid Risk Sample',
    color: 'var(--warning)',
    bg: 'var(--warning-light)',
    data: { age: 32, systolicBP: 128, diastolicBP: 85, bloodGlucose: 8.5, bodyTemp: 99.0, heartRate: 85 }
  },
  {
    label: 'High Risk Sample',
    color: 'var(--primary-dark)',
    bg: 'var(--primary-tint)',
    data: { age: 35, systolicBP: 140, diastolicBP: 90, bloodGlucose: 15.0, bodyTemp: 98.0, heartRate: 86 }
  },
];

const s = {
  page: {
    maxWidth: 1100, margin: '0 auto',
    padding: '48px 32px 80px',
  },
  hero: {
    textAlign: 'center', marginBottom: 52,
    animation: 'fadeUp 0.6s ease both',
  },
  heroEyebrow: {
    display: 'inline-block',
    background: 'var(--primary-tint)', color: 'var(--primary-dark)',
    fontSize: 11, fontWeight: 600, padding: '4px 14px',
    borderRadius: 99, letterSpacing: '0.1em', textTransform: 'uppercase',
    marginBottom: 18, border: '1px solid var(--primary-light)',
  },
  heroTitle: {
    fontFamily: 'var(--font-display)', fontSize: 44,
    fontWeight: 600, color: 'var(--slate)', lineHeight: 1.2,
    marginBottom: 16, letterSpacing: '-0.5px',
  },
  heroTitleAccent: { color: 'var(--primary)', fontStyle: 'italic' },
  heroSub: {
    fontSize: 17, color: 'var(--slate-mid)', maxWidth: 520,
    margin: '0 auto', lineHeight: 1.7,
  },
  sampleRow: {
    display: 'flex', gap: 10, justifyContent: 'center',
    marginTop: 28, flexWrap: 'wrap',
  },
  sampleBtn: (color, bg) => ({
    padding: '8px 18px', borderRadius: 99,
    border: `1.5px solid ${color}`,
    background: bg, color: color,
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.2s ease', letterSpacing: '0.01em',
  }),
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 28,
    alignItems: 'start',
  },
  card: {
    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '36px',
    boxShadow: 'var(--shadow-sm)',
    animation: 'fadeUp 0.6s ease 0.1s both',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)', fontSize: 22,
    fontWeight: 600, color: 'var(--slate)', marginBottom: 6,
  },
  cardSub: { fontSize: 13, color: 'var(--slate-light)', marginBottom: 28 },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18,
  },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 12, fontWeight: 600, color: 'var(--slate-mid)',
    letterSpacing: '0.05em', textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  inputWrap: {
    position: 'relative', display: 'flex', alignItems: 'center',
  },
  input: (focused, error) => ({
    width: '100%', padding: '11px 52px 11px 14px',
    borderRadius: 'var(--radius-sm)',
    border: `1.5px solid ${error ? 'var(--primary)' : focused ? 'var(--primary)' : 'var(--border)'}`,
    background: error ? 'var(--primary-tint)' : focused ? 'var(--blush)' : 'var(--blush)',
    fontSize: 15, color: 'var(--slate)', outline: 'none',
    transition: 'all 0.2s ease', fontFamily: 'var(--font-body)',
    boxShadow: focused ? '0 0 0 3px rgba(237,18,164,0.12)' : 'none',
  }),
  unit: {
    position: 'absolute', right: 12,
    fontSize: 11, fontWeight: 600,
    color: 'var(--slate-light)', letterSpacing: '0.04em',
    pointerEvents: 'none',
  },
  hint: { fontSize: 11, color: 'var(--slate-light)' },
  errorText: { fontSize: 11, color: 'var(--primary-dark)', fontWeight: 500 },
  submitBtn: (loading) => ({
    width: '100%', marginTop: 28,
    padding: '15px 32px', borderRadius: 'var(--radius-md)',
    background: loading
      ? 'var(--primary-light)'
      : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
    color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: 15, fontWeight: 600, letterSpacing: '0.03em',
    transition: 'all 0.2s ease',
    boxShadow: loading ? 'none' : '0 4px 20px rgba(237,18,164,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  }),
  spinner: {
    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  disclaimer: {
    marginTop: 20, padding: '12px 16px',
    background: 'var(--warning-light)', borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(212,146,74,0.25)',
    fontSize: 12, color: 'var(--warning)',
    lineHeight: 1.6,
  },
  rightCol: {
    display: 'flex', flexDirection: 'column', gap: 20,
    animation: 'fadeUp 0.6s ease 0.2s both',
  },
  emptyState: {
    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
    border: '1.5px dashed var(--primary-light)',
    padding: '48px 32px', textAlign: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontFamily: 'var(--font-display)', fontSize: 20,
    color: 'var(--slate)', marginBottom: 8, fontWeight: 600,
  },
  emptySub: { fontSize: 14, color: 'var(--slate-light)', lineHeight: 1.6 },
};

export default function PredictionPage() {
  const { authFetch } = useAuth();
  const [form, setForm]       = useState({});
  const [focused, setFocused] = useState(null);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [apiError, setApiError] = useState(null);

  const validate = () => {
    const errs = {};
    FIELDS.forEach(f => {
      const val = form[f.key];
      if (val === undefined || val === '') {
        errs[f.key] = 'Required';
      } else if (isNaN(val) || +val < f.min || +val > f.max) {
        errs[f.key] = `${f.min}–${f.max}`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setResult(null);
    setApiError(null);

    try {
      const data = await authFetch('/api/predict', {
        method: 'POST',
        body: JSON.stringify({
          age:          +form.age,
          systolicBP:   +form.systolicBP,
          diastolicBP:  +form.diastolicBP,
          bloodGlucose: +form.bloodGlucose,
          bodyTemp:     +form.bodyTemp,
          heartRate:    +form.heartRate,
        }),
      });
      if (data.success) setResult(data);
      else setApiError(data.errors?.join(' · ') || data.error || data.msg || 'Prediction failed.');
    } catch {
      setApiError('Cannot connect to server. Make sure Flask is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const fillSample = (sampleData) => {
    setForm(Object.fromEntries(Object.entries(sampleData).map(([k, v]) => [k, String(v)])));
    setErrors({});
    setResult(null);
    setApiError(null);
  };

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <span style={s.heroEyebrow}>Maternal Health AI</span>
        <h1 style={s.heroTitle}>
          Predict Pregnancy<br />
          <span style={s.heroTitleAccent}>Health Risk</span> Instantly
        </h1>
        <p style={s.heroSub}>
          Enter your vital signs below and our machine learning model will
          assess your pregnancy risk level in seconds.
        </p>
        <div style={s.sampleRow}>
          {SAMPLE_CASES.map(c => (
            <button
              key={c.label}
              style={s.sampleBtn(c.color, c.bg)}
              onClick={() => fillSample(c.data)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              Try {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div style={s.layout}>
        {/* Left — Form */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Patient Vitals</h2>
          <p style={s.cardSub}>Enter all 6 health indicators accurately</p>

          <div style={s.grid}>
            {FIELDS.map(f => (
              <div key={f.key} style={s.fieldWrap}>
                <label style={s.label}>
                  <span>{f.icon}</span> {f.label}
                </label>
                <div style={s.inputWrap}>
                  <input
                    type="number"
                    min={f.min} max={f.max} step={f.step}
                    placeholder={f.placeholder}
                    value={form[f.key] ?? ''}
                    style={s.input(focused === f.key, !!errors[f.key])}
                    onFocus={() => setFocused(f.key)}
                    onBlur={() => setFocused(null)}
                    onChange={e => {
                      setForm(prev => ({ ...prev, [f.key]: e.target.value }));
                      if (errors[f.key]) setErrors(prev => ({ ...prev, [f.key]: null }));
                    }}
                  />
                  <span style={s.unit}>{f.unit}</span>
                </div>
                {errors[f.key]
                  ? <span style={s.errorText}>Valid range: {errors[f.key]}</span>
                  : <span style={s.hint}>{f.hint}</span>
                }
              </div>
            ))}
          </div>

          <button
            style={s.submitBtn(loading)}
            onClick={handleSubmit}
            disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {loading
              ? <><div style={s.spinner} /> Analysing vitals…</>
              : '🔍 Predict Risk Level'
            }
          </button>

          <div style={s.disclaimer}>
            ⚠️ <strong>Medical Disclaimer:</strong> This tool is for educational
            purposes only and does not replace professional medical advice.
            Always consult a qualified healthcare provider.
          </div>
        </div>

        {/* Right — Result */}
        <div style={s.rightCol}>
          {result ? (
            <ResultCard result={result} />
          ) : (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🌸</div>
              <h3 style={s.emptyTitle}>Awaiting Analysis</h3>
              <p style={s.emptySub}>
                Fill in the patient vitals on the left and click
                <br /><strong>Predict Risk Level</strong> to see results here.
                <br /><br />
                Or try one of the sample cases above.
              </p>
            </div>
          )}
          {apiError && (
            <div style={{
              background: 'var(--primary-tint)', border: '1px solid var(--primary-light)',
              borderRadius: 'var(--radius-md)', padding: '16px 20px',
              color: 'var(--primary-dark)', fontSize: 14, lineHeight: 1.6,
              animation: 'fadeIn 0.3s ease',
            }}>
              ❌ <strong>Error:</strong> {apiError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
