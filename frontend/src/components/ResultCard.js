const RISK_CONFIG = {
  0: {
    label: 'Low Risk',
    emoji: '🟢',
    color: '#2D7A4F',
    bg: '#EBF4EF',
    border: '#A8D5B8',
    gradient: 'linear-gradient(135deg, #EBF4EF 0%, #D4EDDA 100%)',
    bar: '#5A8A72',
  },
  1: {
    label: 'Mid Risk',
    emoji: '🟡',
    color: '#9A6B1A',
    bg: '#FDF3E7',
    border: '#F5C97B',
    gradient: 'linear-gradient(135deg, #FDF3E7 0%, #FAECD4 100%)',
    bar: '#D4924A',
  },
  2: {
    label: 'High Risk',
    emoji: '🔴',
    color: '#8A00F3',
    bg: '#F5E6FF',
    border: '#E8CCFF',
    gradient: 'linear-gradient(135deg, #F5E6FF 0%, #EDD5FF 100%)',
    bar: '#B100E7',
  },
};

function ProbBar({ label, value, color, delay }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--slate-mid)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)' }}>{value}%</span>
      </div>
      <div style={{
        height: 7, borderRadius: 99,
        background: 'var(--border)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: color, width: `${value}%`,
          transition: `width 1s cubic-bezier(.4,0,.2,1) ${delay}ms`,
          animation: `slideIn 0.5s ease ${delay}ms both`,
        }} />
      </div>
    </div>
  );
}

export default function ResultCard({ result }) {
  const cfg = RISK_CONFIG[result.prediction];
  const probs = result.probabilities;

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius-lg)',
      border: `1.5px solid ${cfg.border}`,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
      animation: 'bounceIn 0.5s cubic-bezier(.36,.07,.19,.97) both',
    }}>
      {/* Header band */}
      <div style={{
        background: cfg.gradient,
        padding: '28px 32px 24px',
        borderBottom: `1px solid ${cfg.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <span style={{ fontSize: 42 }}>{cfg.emoji}</span>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: cfg.color, marginBottom: 2,
            }}>
              Prediction Result
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 30, fontWeight: 600, color: cfg.color, lineHeight: 1.1,
            }}>
              {cfg.label}
            </h2>
          </div>
        </div>

        {/* Confidence meter */}
        <div style={{
          background: 'rgba(255,255,255,0.6)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 7,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>
              Model Confidence
            </span>
            <span style={{
              fontSize: 18, fontWeight: 700, color: cfg.color,
              fontFamily: 'var(--font-display)',
            }}>
              {result.confidence}%
            </span>
          </div>
          <div style={{
            height: 8, borderRadius: 99,
            background: 'rgba(255,255,255,0.5)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: cfg.bar, width: `${result.confidence}%`,
              transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
            }} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 32px' }}>

        {/* Message + Action */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.7, marginBottom: 10 }}>
            {result.message}
          </p>
          <div style={{
            background: cfg.bg, borderRadius: 'var(--radius-sm)',
            padding: '10px 14px', border: `1px solid ${cfg.border}`,
            fontSize: 13, color: cfg.color, fontWeight: 500,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span>📋</span>
            <span>{result.action}</span>
          </div>
        </div>

        {/* Probability breakdown */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{
            fontSize: 12, fontWeight: 700, color: 'var(--slate-mid)',
            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14,
          }}>
            Probability Breakdown
          </h4>
          <ProbBar label="Low Risk"  value={probs.low_risk}  color="#5A8A72" delay={100} />
          <ProbBar label="Mid Risk"  value={probs.mid_risk}  color="#D4924A" delay={200} />
          <ProbBar label="High Risk" value={probs.high_risk} color="#B100E7" delay={300} />
        </div>

        {/* Input summary */}
        <div>
          <h4 style={{
            fontSize: 12, fontWeight: 700, color: 'var(--slate-mid)',
            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12,
          }}>
            Input Summary
          </h4>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
          }}>
            {Object.entries(result.input_received).map(([key, val]) => (
              <div key={key} style={{
                background: 'var(--blush)', borderRadius: 8,
                padding: '8px 12px', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--slate-light)', fontWeight: 600, marginBottom: 2 }}>
                  {key}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate)' }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
