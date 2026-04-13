import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

/* ── Markdown renderer ─────────────────────────────────────── */
function inlineFormat(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index} style={{ fontStyle: 'italic' }}>{match[3]}</em>);
    else if (match[4]) parts.push(
      <code key={match.index} style={{
        background: 'rgba(232,102,122,0.12)', padding: '1px 5px',
        borderRadius: 4, fontSize: 12, fontFamily: 'monospace', color: '#C0394F',
      }}>{match[4]}</code>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const out = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    out.push(
      <ul key={`ul${out.length}`} style={{ margin: '6px 0 8px', paddingLeft: 0, listStyle: 'none' }}>
        {listItems.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 14, lineHeight: 1.65 }}>
            <span style={{ color: 'var(--rose)', flexShrink: 0, marginTop: 3, fontSize: 10 }}>●</span>
            <span>{inlineFormat(item)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, idx) => {
    if (!line.trim()) { flushList(); out.push(<div key={`br${idx}`} style={{ height: 5 }} />); return; }

    if (line.startsWith('### ')) {
      flushList();
      out.push(<p key={idx} style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--slate)', margin: '10px 0 5px' }}>{line.slice(4)}</p>);
      return;
    }
    if (line.startsWith('## ')) {
      flushList();
      out.push(<p key={idx} style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--slate)', margin: '12px 0 5px' }}>{line.slice(3)}</p>);
      return;
    }

    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      flushList();
      out.push(
        <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 14, lineHeight: 1.65 }}>
          <span style={{
            minWidth: 20, height: 20, borderRadius: '50%',
            background: 'rgba(232,102,122,0.15)', color: 'var(--rose-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2,
          }}>{numMatch[1]}</span>
          <span>{inlineFormat(numMatch[2])}</span>
        </div>
      );
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
      return;
    }

    if (line.trim() === '---') {
      flushList();
      out.push(<hr key={idx} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />);
      return;
    }

    if (line.startsWith('> ')) {
      flushList();
      out.push(
        <div key={idx} style={{
          borderLeft: '3px solid var(--rose)', paddingLeft: 12,
          margin: '5px 0', color: 'var(--slate-mid)', fontSize: 13, fontStyle: 'italic',
        }}>{inlineFormat(line.slice(2))}</div>
      );
      return;
    }

    flushList();
    out.push(<p key={idx} style={{ margin: '3px 0', fontSize: 14, lineHeight: 1.7 }}>{inlineFormat(line)}</p>);
  });

  flushList();
  return out;
}

/* ── Typing dots ───────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 20 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: 'var(--rose-mid)',
          animation: `typingBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%,60%,100% { transform: translateY(0); opacity: 0.5; }
          30%          { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Provider badge ────────────────────────────────────────── */
const PROVIDER_CFG = {
  groq: {
    label: 'Groq · Llama 3.1', icon: '⚡',
    color: '#F97316', bg: '#FFF7ED', border: '#FED7AA',
    desc: 'Fast, free, no credit card',
  },
  gemini: {
    label: 'Google Gemini', icon: '✦',
    color: '#4285F4', bg: '#EFF6FF', border: '#BFDBFE',
    desc: 'Free with Google account',
  },
};

/* ── Styles ─────────────────────────────────────────────────── */
const s = {
  page: {
    height: 'calc(100vh - 62px)', display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-body)', background: 'var(--cream)', overflow: 'hidden',
  },
  header: {
    background: 'var(--white)', borderBottom: '1px solid var(--border)',
    padding: '12px 24px', display: 'flex', alignItems: 'center',
    gap: 12, flexShrink: 0,
  },
  headerAvatar: {
    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, var(--rose) 0%, var(--rose-dark) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, boxShadow: '0 3px 10px rgba(232,102,122,0.3)',
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontFamily: 'var(--font-display)', fontSize: 16,
    fontWeight: 600, color: 'var(--slate)', lineHeight: 1.2,
  },
  headerSub: { fontSize: 11, color: 'var(--slate-light)', marginTop: 1 },
  providerBtn: (active, cfg) => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
    borderRadius: 99, border: `1.5px solid ${active ? cfg.color : 'var(--border)'}`,
    background: active ? cfg.bg : 'transparent',
    color: active ? cfg.color : 'var(--slate-mid)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.18s ease', fontFamily: 'var(--font-body)',
  }),
  onlineDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#5A8A72',
    animation: 'onlinePulse 2.5s ease-in-out infinite',
  },
  clearBtn: {
    padding: '5px 12px', borderRadius: 99, border: '1.5px solid var(--border)',
    background: 'transparent', color: 'var(--slate-mid)', fontSize: 12,
    fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'var(--font-body)',
  },

  /* Setup banner */
  setupBanner: {
    margin: '12px 20px', padding: '14px 18px',
    background: '#FFF7ED', border: '1.5px solid #FED7AA',
    borderRadius: 14, animation: 'fadeIn 0.3s ease',
  },
  setupTitle: { fontSize: 14, fontWeight: 700, color: '#9A3412', marginBottom: 10 },
  setupGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  setupCard: (color, bg, border) => ({
    padding: '12px 14px', borderRadius: 10,
    background: bg, border: `1.5px solid ${border}`,
  }),
  setupCardTitle: (color) => ({
    fontSize: 13, fontWeight: 700, color, marginBottom: 4,
    display: 'flex', alignItems: 'center', gap: 6,
  }),
  setupStep: { fontSize: 12, color: 'var(--slate-mid)', lineHeight: 1.6 },
  setupLink: (color) => ({
    color, fontWeight: 600, textDecoration: 'none',
    borderBottom: `1px solid ${color}44`,
  }),

  /* Chat area */
  chatArea: {
    flex: 1, overflowY: 'auto', padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  msgRow: (isUser) => ({
    display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
    gap: 8, alignItems: 'flex-end', animation: 'fadeUp 0.25s ease both',
  }),
  botAvatar: {
    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, var(--rose) 0%, var(--rose-dark) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
  },
  bubble: (isUser) => ({
    maxWidth: '74%', padding: '11px 15px',
    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: isUser
      ? 'linear-gradient(135deg, var(--rose) 0%, var(--rose-dark) 100%)'
      : 'var(--white)',
    color: isUser ? '#fff' : 'var(--slate)',
    boxShadow: isUser ? '0 3px 14px rgba(192,57,79,0.22)' : '0 2px 8px rgba(44,62,80,0.07)',
    border: isUser ? 'none' : '1px solid var(--border)',
  }),
  bubbleTime: (isUser) => ({
    fontSize: 10, marginTop: 5, opacity: 0.55, textAlign: isUser ? 'right' : 'left',
  }),
  cursor: {
    display: 'inline-block', width: 2, height: 13, background: 'var(--rose)',
    marginLeft: 2, verticalAlign: 'middle',
    animation: 'cursorBlink 1s step-end infinite',
  },

  /* Welcome */
  welcome: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '32px 24px', textAlign: 'center',
  },
  welcomeOrb: {
    width: 80, height: 80, borderRadius: '50%',
    background: 'linear-gradient(135deg, #FBEEF1 0%, var(--rose-mid) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 38, marginBottom: 18,
    boxShadow: '0 6px 28px rgba(232,102,122,0.2)',
    animation: 'orbFloat 3s ease-in-out infinite',
  },
  welcomeTitle: {
    fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600,
    color: 'var(--slate)', marginBottom: 8, letterSpacing: '-0.3px',
  },
  welcomeSub: {
    fontSize: 14, color: 'var(--slate-mid)', maxWidth: 380,
    lineHeight: 1.7, marginBottom: 28,
  },
  suggGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 560 },
  suggTitle: {
    fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)',
    letterSpacing: '0.07em', textTransform: 'uppercase',
    marginBottom: 10, alignSelf: 'flex-start',
    width: '100%', maxWidth: 560,
  },
  suggChip: {
    padding: '10px 12px', borderRadius: 11,
    background: 'var(--white)', border: '1.5px solid var(--border)',
    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
    fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 8,
  },
  suggEmoji: { fontSize: 15, flexShrink: 0 },
  suggText: { fontSize: 12, color: 'var(--slate)', lineHeight: 1.4 },

  /* Quick chips in chat */
  quickRow: {
    padding: '8px 20px 4px', display: 'flex', gap: 6, flexWrap: 'wrap',
    borderTop: '1px solid var(--border)', background: 'var(--white)', flexShrink: 0,
  },
  quickChip: {
    padding: '4px 11px', borderRadius: 99, fontSize: 12, fontWeight: 500,
    background: 'var(--rose-light)', border: '1px solid var(--rose-mid)',
    color: 'var(--rose-dark)', cursor: 'pointer', transition: 'all 0.14s',
    fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
  },

  /* Input bar */
  inputBar: {
    background: 'var(--white)', borderTop: '1px solid var(--border)',
    padding: '12px 18px', display: 'flex', gap: 8,
    alignItems: 'flex-end', flexShrink: 0,
  },
  textarea: (focused) => ({
    flex: 1, padding: '10px 15px', borderRadius: 22,
    border: `1.5px solid ${focused ? 'var(--rose)' : 'var(--border)'}`,
    background: focused ? 'var(--blush)' : '#fdfaf7',
    fontSize: 14, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', lineHeight: 1.5,
    resize: 'none', minHeight: 42, maxHeight: 130,
    transition: 'all 0.18s ease',
    boxShadow: focused ? '0 0 0 3px rgba(232,102,122,0.1)' : 'none',
    overflowY: 'auto',
  }),
  sendBtn: (canSend) => ({
    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
    background: canSend
      ? 'linear-gradient(135deg, var(--rose) 0%, var(--rose-dark) 100%)'
      : 'var(--border)',
    border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, transition: 'all 0.18s ease',
    boxShadow: canSend ? '0 3px 10px rgba(192,57,79,0.3)' : 'none',
    color: '#fff',
  }),

  /* Error */
  errBar: {
    margin: '0 20px 6px', padding: '9px 14px',
    background: 'var(--rose-light)', border: '1px solid var(--rose-mid)',
    borderRadius: 10, fontSize: 13, color: 'var(--rose-dark)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    animation: 'fadeIn 0.2s ease',
  },
};

const QUICK = [
  { text: 'What should I eat?',    icon: '🥗' },
  { text: 'Safe exercises?',       icon: '🏃' },
  { text: 'Morning sickness tips', icon: '🤢' },
  { text: 'Sleep advice',          icon: '😴' },
];

export default function ChatAssistant() {
  const { user, token } = useAuth();

  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [focused,     setFocused]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [streaming,   setStreaming]   = useState(false);
  const [streamText,  setStreamText]  = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error,       setError]       = useState('');
  const [provider,    setProvider]    = useState('groq');
  const [providerStatus, setProviderStatus] = useState({ groq: false, gemini: false, any_ready: false, checked: false });

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  /* ── Check which providers are configured ─────────────────── */
  useEffect(() => {
    fetch('http://localhost:5000/chat/providers', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProviderStatus({ ...d, checked: true });
          if (d.gemini && !d.groq) setProvider('gemini');
        }
      })
      .catch(() => setProviderStatus(p => ({ ...p, checked: true })));
  }, [token]);

  /* ── Fetch suggestions ─────────────────────────────────────── */
  useEffect(() => {
    fetch('http://localhost:5000/chat/suggestions', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setSuggestions(d.suggestions); })
      .catch(() => {});
  }, [token]);

  /* ── Auto scroll ───────────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  /* ── Auto resize textarea ──────────────────────────────────── */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
  }, [input]);

  const fmtTime = d => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  /* ── Send with streaming ───────────────────────────────────── */
  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading || streaming) return;

    setInput('');
    setError('');
    if (textareaRef.current) textareaRef.current.style.height = '42px';

    const userMsg  = { role: 'user', content, ts: new Date() };
    const history  = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    const apiMessages = history.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('http://localhost:5000/chat/stream', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ messages: apiMessages, provider }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      setLoading(false);
      setStreaming(true);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   full    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.done)  break;
            if (data.chunk) { full += data.chunk; setStreamText(full); }
          } catch (e) {
            if (e.message && e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: full, ts: new Date() }]);
      setStreamText('');
      setStreaming(false);

    } catch (err) {
      setLoading(false);
      setStreaming(false);
      setStreamText('');
      setError(err.message || 'Something went wrong. Please try again.');
    }
  }, [input, messages, loading, streaming, token, provider]);

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setStreamText(''); setError(''); };

  const hasMessages = messages.length > 0 || streaming;
  const showSetup   = providerStatus.checked && !providerStatus.any_ready;

  return (
    <div style={s.page}>
      <style>{`
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes onlinePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={s.headerAvatar}>🌸</div>
        <div style={s.headerInfo}>
          <div style={s.headerName}>BabyBloom AI Assistant</div>
          <div style={s.headerSub}>Pregnancy health Q&A · Free AI powered</div>
        </div>

        {/* Provider switcher */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['groq', 'gemini'].map(p => {
            const cfg = PROVIDER_CFG[p];
            const isActive = provider === p;
            return (
              <button key={p} style={s.providerBtn(isActive, cfg)} onClick={() => setProvider(p)}
                title={cfg.desc}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {cfg.icon} {cfg.label.split('·')[0].trim()}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5,
          background: 'var(--sage-light)', color: 'var(--sage)',
          fontSize: 11, fontWeight: 600, padding: '4px 10px',
          borderRadius: 99, border: '1px solid #A8D5B8',
        }}>
          <div style={s.onlineDot} /> Ready
        </div>

        {hasMessages && (
          <button style={s.clearBtn} onClick={clearChat}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--rose-light)'; e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.color = 'var(--rose-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--slate-mid)'; }}
          >
            🗑 Clear
          </button>
        )}
      </div>

      {/* ── Setup guide (shown when no API key is set) ─────── */}
      {showSetup && (
        <div style={s.setupBanner}>
          <div style={s.setupTitle}>⚙️ Set up your free AI provider to start chatting</div>
          <div style={s.setupGrid}>
            {/* Groq card */}
            <div style={s.setupCard('#F97316', '#FFF7ED', '#FED7AA')}>
              <div style={s.setupCardTitle('#C2410C')}>⚡ Groq (Recommended)</div>
              <div style={s.setupStep}>
                1. Go to{' '}
                <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={s.setupLink('#F97316')}>
                  console.groq.com
                </a>
                <br />2. Sign up free (email only, no card)<br />
                3. Click <strong>API Keys → Create API Key</strong><br />
                4. Add to your <code style={{ fontSize: 11 }}>.env</code>:<br />
                <code style={{ fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: '2px 5px', borderRadius: 4 }}>
                  GROQ_API_KEY=gsk_...
                </code>
              </div>
            </div>
            {/* Gemini card */}
            <div style={s.setupCard('#4285F4', '#EFF6FF', '#BFDBFE')}>
              <div style={s.setupCardTitle('#1D4ED8')}>✦ Google Gemini (Fallback)</div>
              <div style={s.setupStep}>
                1. Go to{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={s.setupLink('#4285F4')}>
                  aistudio.google.com
                </a>
                <br />2. Sign in with your Google account<br />
                3. Click <strong>Get API Key → Create</strong><br />
                4. Add to your <code style={{ fontSize: 11 }}>.env</code>:<br />
                <code style={{ fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: '2px 5px', borderRadius: 4 }}>
                  GEMINI_API_KEY=AIza...
                </code>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--slate-light)', marginTop: 10 }}>
            After adding the key, restart Flask: <code style={{ fontSize: 11 }}>python app.py</code>
          </p>
        </div>
      )}

      {/* ── Chat area ──────────────────────────────────────── */}
      {!hasMessages ? (
        <div style={s.welcome}>
          <div style={s.welcomeOrb}>🌸</div>
          <h2 style={s.welcomeTitle}>
            Hello, {user?.full_name?.split(' ')[0]}! 👋
          </h2>
          <p style={s.welcomeSub}>
            I'm your personal pregnancy health assistant — powered by{' '}
            {provider === 'groq' ? 'Groq · Llama 3.1 (free)' : 'Google Gemini (free)'}.
            Ask me anything about your{' '}
            {user?.trimester === 1 ? 'first' : user?.trimester === 2 ? 'second' : 'third'} trimester.
          </p>
          <p style={s.suggTitle}>Try asking me about…</p>
          <div style={s.suggGrid}>
            {suggestions.map((sg, i) => (
              <button key={i} style={s.suggChip} onClick={() => sendMessage(sg.text)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.background = 'var(--rose-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--white)'; }}
              >
                <span style={s.suggEmoji}>{sg.icon}</span>
                <span style={s.suggText}>{sg.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={s.chatArea}>
          {messages.map((msg, i) => (
            <div key={i} style={s.msgRow(msg.role === 'user')}>
              {msg.role === 'assistant' && <div style={s.botAvatar}>🌸</div>}
              <div style={s.bubble(msg.role === 'user')}>
                {msg.role === 'user' ? (
                  <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>{msg.content}</p>
                ) : (
                  <div style={{ color: 'var(--slate)' }}>{renderMarkdown(msg.content)}</div>
                )}
                <div style={s.bubbleTime(msg.role === 'user')}>
                  {fmtTime(msg.ts instanceof Date ? msg.ts : new Date(msg.ts))}
                  {msg.role === 'assistant' && (
                    <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.6 }}>
                      {PROVIDER_CFG[provider].icon} {provider === 'groq' ? 'Llama 3.1' : 'Gemini'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing / streaming bubble */}
          {(loading || streaming) && (
            <div style={s.msgRow(false)}>
              <div style={s.botAvatar}>🌸</div>
              <div style={s.bubble(false)}>
                {loading
                  ? <TypingDots />
                  : (
                    <div style={{ color: 'var(--slate)' }}>
                      {renderMarkdown(streamText)}
                      <span style={s.cursor} />
                    </div>
                  )
                }
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Error bar ──────────────────────────────────────── */}
      {error && (
        <div style={s.errBar}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={{
            background: 'none', border: 'none', color: 'var(--rose-dark)',
            fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 14,
          }}>✕</button>
        </div>
      )}

      {/* ── Quick chips (in chat) ───────────────────────────── */}
      {hasMessages && (
        <div style={s.quickRow}>
          {QUICK.map((q, i) => (
            <button key={i} style={s.quickChip} onClick={() => sendMessage(q.text)}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--rose)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--rose-light)'; e.currentTarget.style.color = 'var(--rose-dark)'; }}
            >
              {q.icon} {q.text}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ──────────────────────────────────────── */}
      <div style={s.inputBar}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          placeholder={`Ask anything, ${user?.full_name?.split(' ')[0]}… (Enter to send, Shift+Enter for new line)`}
          style={s.textarea(focused)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          style={s.sendBtn(!!(input.trim()) && !loading && !streaming)}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading || streaming}
          onMouseEnter={e => { if (input.trim()) e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >
          {loading || streaming ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}