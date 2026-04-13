const s = {
  page: { maxWidth: 900, margin: '0 auto', padding: '48px 32px 80px' },
  hero: { textAlign: 'center', marginBottom: 56, animation: 'fadeUp 0.5s ease both' },
  eyebrow: {
    display: 'inline-block', background: 'var(--primary-tint)', color: 'var(--primary-dark)',
    fontSize: 11, fontWeight: 600, padding: '4px 14px', borderRadius: 99,
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14,
    border: '1px solid var(--primary-light)',
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600,
    color: 'var(--slate)', marginBottom: 16, letterSpacing: '-0.4px', lineHeight: 1.2,
  },
  sub: {
    fontSize: 16, color: 'var(--slate-mid)', maxWidth: 520,
    margin: '0 auto', lineHeight: 1.7,
  },
  section: { marginBottom: 44, animation: 'fadeUp 0.5s ease 0.1s both' },
  sectionTitle: {
    fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600,
    color: 'var(--slate)', marginBottom: 20, letterSpacing: '-0.3px',
    paddingBottom: 12, borderBottom: '1px solid var(--border)',
  },
  stepsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  step: {
    background: 'var(--white)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', padding: '20px 22px',
    boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 16,
  },
  stepNum: {
    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 14,
  },
  stepTitle: { fontSize: 14, fontWeight: 600, color: 'var(--slate)', marginBottom: 4 },
  stepDesc: { fontSize: 13, color: 'var(--slate-mid)', lineHeight: 1.6 },
  techGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  techCard: (color) => ({
    background: 'var(--white)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', padding: '18px 20px',
    borderTop: `3px solid ${color}`, boxShadow: 'var(--shadow-sm)',
  }),
  techIcon: { fontSize: 24, marginBottom: 8 },
  techName: { fontSize: 14, fontWeight: 700, color: 'var(--slate)', marginBottom: 4 },
  techDesc: { fontSize: 12, color: 'var(--slate-light)', lineHeight: 1.5 },
  featureGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  featureCard: {
    background: 'var(--white)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', padding: '20px',
    boxShadow: 'var(--shadow-sm)', textAlign: 'center',
  },
  featureIcon: { fontSize: 28, marginBottom: 10 },
  featureName: { fontSize: 13, fontWeight: 600, color: 'var(--slate)', marginBottom: 4 },
  featureDesc: { fontSize: 12, color: 'var(--slate-light)', lineHeight: 1.5 },
  disclaimer: {
    background: 'var(--warning-light)', borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(212,146,74,0.3)', padding: '20px 24px',
    fontSize: 14, color: '#7A5020', lineHeight: 1.7,
  },
};

const STEPS = [
  { n: 1, title: 'Enter Patient Vitals',  desc: 'Input 6 key health indicators: age, blood pressure, glucose, temperature, and heart rate.' },
  { n: 2, title: 'Data Preprocessing',    desc: 'Values are validated, then scaled using StandardScaler trained on the maternal dataset.' },
  { n: 3, title: 'ML Model Inference',    desc: 'A tuned Random Forest classifier processes the scaled features and outputs a class probability.' },
  { n: 4, title: 'Risk Classification',   desc: 'The highest probability class determines Low, Mid, or High risk with a confidence score.' },
];

const TECH = [
  { icon: '🐍', name: 'Python + scikit-learn', desc: 'Model training, preprocessing, GridSearchCV tuning', color: 'var(--success)' },
  { icon: '⚡', name: 'XGBoost',               desc: 'Gradient boosting classifier (compared against RF)', color: 'var(--warning)' },
  { icon: '🌶️', name: 'Flask',                 desc: 'REST API backend serving predictions on port 5000', color: 'var(--primary)' },
  { icon: '⚛️', name: 'React 18',              desc: 'Frontend SPA with hooks, state management, routing', color: '#61DAFB' },
  { icon: '📊', name: 'Recharts',              desc: 'Dashboard visualisations and interactive charts', color: 'var(--slate-mid)' },
  { icon: '🗃️', name: 'Maternal Dataset',      desc: '1,014 records from Bangladesh rural health clinics', color: '#9C6FDE' },
];

const FEATURES_LIST = [
  { icon: '👤', name: 'Age',          desc: 'Maternal age in years (10–70)' },
  { icon: '🫀', name: 'Systolic BP',  desc: 'Upper blood pressure in mmHg' },
  { icon: '💓', name: 'Diastolic BP', desc: 'Lower blood pressure in mmHg' },
  { icon: '🩸', name: 'Blood Glucose',desc: 'Blood sugar level in mmol/L' },
  { icon: '🌡️', name: 'Body Temp',    desc: 'Body temperature in °F' },
  { icon: '📈', name: 'Heart Rate',   desc: 'Resting heart rate in bpm' },
];

export default function AboutPage() {
  return (
    <div style={s.page}>
      <div style={s.hero}>
        <span style={s.eyebrow}>About the Project</span>
        <h1 style={s.title}>BabyBloom AI</h1>
        <p style={s.sub}>
          A machine learning system for predicting maternal health risk
          during pregnancy, built with Python, Flask, and React.
        </p>
      </div>

      {/* How it works */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>How It Works</h2>
        <div style={s.stepsGrid}>
          {STEPS.map(step => (
            <div key={step.n} style={s.step}>
              <div style={s.stepNum}>{step.n}</div>
              <div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Features */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Input Features</h2>
        <div style={s.featureGrid}>
          {FEATURES_LIST.map(f => (
            <div key={f.name} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <div style={s.featureName}>{f.name}</div>
              <div style={s.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Tech Stack</h2>
        <div style={s.techGrid}>
          {TECH.map(t => (
            <div key={t.name} style={s.techCard(t.color)}>
              <div style={s.techIcon}>{t.icon}</div>
              <div style={s.techName}>{t.name}</div>
              <div style={s.techDesc}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Levels */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Risk Level Definitions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '🟢', label: 'Low Risk (0)',  color: '#2D7A4F', bg: '#EBF4EF', border: '#A8D5B8',
              desc: 'Vitals are within normal ranges. Routine antenatal visits every 4 weeks are advised.' },
            { icon: '🟡', label: 'Mid Risk (1)',  color: '#9A6B1A', bg: '#FDF3E7', border: '#F5C97B',
              desc: 'Some indicators require attention. A medical consultation within 1–2 weeks is recommended.' },
            { icon: '🔴', label: 'High Risk (2)', color: '#8A00F3', bg: '#F5E6FF', border: '#E8CCFF',
              desc: 'Critical indicators detected. Immediate medical evaluation is strongly advised.' },
          ].map(r => (
            <div key={r.label} style={{
              background: r.bg, borderRadius: 'var(--radius-md)',
              border: `1px solid ${r.border}`, padding: '16px 20px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 24 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: r.color, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 13, color: '#4A4A4A', lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={s.disclaimer}>
        ⚠️ <strong>Medical Disclaimer:</strong> BabyBloom AI is an educational
        project built for learning purposes. The predictions provided are based
        on a machine learning model trained on a limited dataset and should
        <strong> never</strong> be used as a substitute for professional medical
        diagnosis, advice, or treatment. Always consult a qualified healthcare
        provider for any pregnancy-related concerns.
      </div>
    </div>
  );
}
