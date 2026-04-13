import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ── Config ─────────────────────────────────────────────────── */
const RISK_CFG = {
  0: { label: 'Low Risk',  color: '#2D7A4F', bg: '#EBF4EF', border: '#A8D5B8', icon: '🟢' },
  1: { label: 'Mid Risk',  color: '#9A6B1A', bg: '#FDF3E7', border: '#F5C97B', icon: '🟡' },
  2: { label: 'High Risk', color: '#8A00F3', bg: '#F5E6FF', border: '#E8CCFF', icon: '🔴' },
};
const TRIM_CFG = {
  1: { label: '1st', emoji: '🌱', color: '#5A8A72' },
  2: { label: '2nd', emoji: '🌷', color: '#D4924A' },
  3: { label: '3rd', emoji: '🌸', color: '#8A00F3' },
};

/* ── Styles ─────────────────────────────────────────────────── */
const s = {
  page: {
    maxWidth: 1280, margin: '0 auto',
    padding: '40px 32px 80px',
    fontFamily: 'var(--font-body)',
  },
  pageHeader: { marginBottom: 36, animation: 'fadeUp 0.5s ease both' },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  eyebrow: {
    display: 'inline-block', background: '#2C3E50', color: '#fff',
    fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
  },
  pageTitle: {
    fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600,
    color: 'var(--slate)', letterSpacing: '-0.4px', marginBottom: 6, lineHeight: 1.2,
  },
  pageSub: { fontSize: 15, color: 'var(--slate-mid)' },
  adminBadge: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 99, background: '#2C3E50', color: '#fff',
    fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
    flexShrink: 0,
  },

  /* Access denied */
  denied: {
    textAlign: 'center', padding: '80px 32px',
    animation: 'fadeUp 0.5s ease both',
  },
  deniedIcon: { fontSize: 64, marginBottom: 20 },
  deniedTitle: {
    fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--slate)',
    marginBottom: 10,
  },
  deniedSub: { fontSize: 15, color: 'var(--slate-mid)', marginBottom: 28, lineHeight: 1.6 },
  promoteBtn: {
    padding: '12px 28px', borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, #2C3E50, #546A7B)',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
    boxShadow: '0 4px 18px rgba(44,62,80,0.3)',
    transition: 'all 0.2s',
  },

  /* Stats row */
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 14, marginBottom: 28,
    animation: 'fadeUp 0.5s ease 0.05s both',
  },
  statCard: (color) => ({
    background: 'var(--white)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', padding: '16px 18px',
    boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden',
  }),
  statBar: (color) => ({
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: color, borderRadius: '10px 10px 0 0',
  }),
  statIcon: { fontSize: 20, marginBottom: 6, marginTop: 4 },
  statVal: {
    fontFamily: 'var(--font-display)', fontSize: 24,
    fontWeight: 600, color: 'var(--slate)', lineHeight: 1, marginBottom: 3,
  },
  statLabel: { fontSize: 10, color: 'var(--slate-light)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' },

  /* Charts row */
  chartsRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    gap: 18, marginBottom: 28,
    animation: 'fadeUp 0.5s ease 0.1s both',
  },
  card: (delay = 0) => ({
    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '22px 24px',
    boxShadow: 'var(--shadow-sm)',
    animation: `fadeUp 0.5s ease ${delay}ms both`,
  }),
  cardTitle: {
    fontFamily: 'var(--font-display)', fontSize: 17,
    fontWeight: 600, color: 'var(--slate)', marginBottom: 3,
  },
  cardSub: { fontSize: 11, color: 'var(--slate-light)', marginBottom: 18 },

  /* User table */
  tableCard: {
    background: 'var(--white)', borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)', padding: '26px 28px',
    boxShadow: 'var(--shadow-sm)',
    animation: 'fadeUp 0.5s ease 0.15s both',
  },
  tableTopRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    marginBottom: 20, flexWrap: 'wrap',
  },
  tableTitle: {
    fontFamily: 'var(--font-display)', fontSize: 19,
    fontWeight: 600, color: 'var(--slate)', flex: 1,
  },
  searchInput: (focused) => ({
    padding: '9px 14px', borderRadius: 99, minWidth: 220,
    border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
    background: focused ? 'var(--blush)' : 'var(--cream)',
    fontSize: 13, color: 'var(--slate)', outline: 'none',
    fontFamily: 'var(--font-body)', transition: 'all 0.2s',
    boxShadow: focused ? '0 0 0 3px rgba(177,0,231,0.15)' : 'none',
  }),
  filterSelect: {
    padding: '9px 14px', borderRadius: 99,
    border: '1.5px solid var(--border)', background: 'var(--cream)',
    fontSize: 13, color: 'var(--slate)', cursor: 'pointer',
    fontFamily: 'var(--font-body)', outline: 'none',
    appearance: 'none',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    fontSize: 10, fontWeight: 700, color: 'var(--slate-mid)',
    letterSpacing: '0.07em', textTransform: 'uppercase',
    padding: '8px 12px', textAlign: 'left',
    borderBottom: '2px solid var(--border)',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 12px', fontSize: 13, color: 'var(--slate)',
    borderBottom: '1px solid var(--border)', verticalAlign: 'middle',
  },
  userNameCell: { display: 'flex', alignItems: 'center', gap: 10 },
  userAvatar: (color) => ({
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: `linear-gradient(135deg, ${color}, #6E01F4)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, color: '#fff', fontWeight: 700,
  }),
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--slate)' },
  userEmail: { fontSize: 11, color: 'var(--slate-light)', marginTop: 1 },
  trimPill: (cfg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
    color: cfg.color,
    background: cfg.color + '18',
    border: `1px solid ${cfg.color}44`,
  }),
  riskPill: (cfg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
  }),
  actionBtn: (color, bg) => ({
    padding: '5px 10px', borderRadius: 8,
    background: bg, color, border: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
    fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
  }),
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)',
  },
  pageInfo: { fontSize: 13, color: 'var(--slate-mid)' },
  pageBtn: (active) => ({
    padding: '5px 12px', borderRadius: 8,
    border: `1.5px solid ${active ? 'var(--slate)' : 'var(--border)'}`,
    background: active ? 'var(--slate)' : 'transparent',
    color: active ? '#fff' : 'var(--slate-mid)',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: 'var(--font-body)',
    margin: '0 2px',
  }),

  /* User detail modal */
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(44,62,80,0.5)',
    backdropFilter: 'blur(4px)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: 'var(--white)', borderRadius: 'var(--radius-xl)',
    width: '100%', maxWidth: 680, maxHeight: '88vh', overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(44,62,80,0.25)',
    animation: 'bounceIn 0.35s cubic-bezier(.36,.07,.19,.97) both',
  },
  modalHeader: {
    padding: '22px 28px 18px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: 'var(--font-display)', fontSize: 20,
    fontWeight: 600, color: 'var(--slate)',
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--blush)', border: '1px solid var(--border)',
    cursor: 'pointer', fontSize: 14, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { padding: '20px 28px 28px' },
  infoGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22,
  },
  infoItem: {
    background: 'var(--blush)', borderRadius: 10, padding: '10px 14px',
    border: '1px solid var(--border)',
  },
  infoLabel: { fontSize: 10, fontWeight: 700, color: 'var(--slate-light)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 },
  infoVal: { fontSize: 14, fontWeight: 600, color: 'var(--slate)' },
  detailSection: { marginBottom: 20 },
  detailTitle: {
    fontSize: 12, fontWeight: 700, color: 'var(--slate-mid)',
    letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12,
    paddingBottom: 8, borderBottom: '1px solid var(--border)',
  },
  logRow: {
    display: 'flex', gap: 8, padding: '8px 0', fontSize: 12,
    borderBottom: '1px solid var(--border)', color: 'var(--slate-mid)',
    alignItems: 'center',
  },
  pdfBtn: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '10px 20px', borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, #8A00F3, #6E01F4)',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
    fontFamily: 'var(--font-body)',
    boxShadow: '0 4px 16px rgba(110,1,244,0.3)',
  },
  customTooltip: {
    background: 'var(--white)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 14px', fontSize: 12,
    boxShadow: 'var(--shadow-md)',
  },
};

/* ── Custom tooltip ─────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={s.customTooltip}>
      <div style={{ fontWeight: 600, color: 'var(--slate)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

/* ── Main component ─────────────────────────────────────────── */
export default function AdminPanel() {
  const { user, token, authFetch, updateUser } = useAuth();

  const [stats,       setStats]       = useState(null);
  const [users,       setUsers]       = useState([]);
  const [totalUsers,  setTotalUsers]  = useState(0);
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const [search,      setSearch]      = useState('');
  const [trimFilter,  setTrimFilter]  = useState('');
  const [riskFilter,  setRiskFilter]  = useState('');
  const [focusSearch, setFocusSearch] = useState(false);
  const [selectedUser,setSelectedUser]= useState(null);
  const [userDetail,  setUserDetail]  = useState(null);
  const [promoting,   setPromoting]   = useState(false);
  const [promoteMsg,  setPromoteMsg]  = useState('');
  const [downloading, setDownloading] = useState(null);
  const [reportAvail, setReportAvail] = useState(true);
  const [loadingUsers,setLoadingUsers]= useState(false);

  const isAdmin = user?.is_admin;

  /* ── Fetch stats ────────────────────────────────────────── */
  useEffect(() => {
    if (!isAdmin) return;
    authFetch('/admin/stats').then(d => { if (d.success) setStats(d.stats); });
    authFetch('/reports/check').then(d => setReportAvail(d.available));
  }, [isAdmin, authFetch]);

  /* ── Fetch users ────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    const params = new URLSearchParams({
      page, per_page: 15,
      ...(search     ? { search }                   : {}),
      ...(trimFilter ? { trimester: trimFilter }    : {}),
      ...(riskFilter ? { risk: riskFilter }         : {}),
    });
    const d = await authFetch(`/admin/users?${params}`);
    if (d.success) {
      setUsers(d.users);
      setTotalUsers(d.total);
      setPages(d.pages);
    }
    setLoadingUsers(false);
  }, [isAdmin, authFetch, page, search, trimFilter, riskFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── Load user detail ───────────────────────────────────── */
  const openUserDetail = async (u) => {
    setSelectedUser(u);
    const d = await authFetch(`/admin/users/${u.id}`);
    if (d.success) setUserDetail(d);
  };

  /* ── Promote self to admin ──────────────────────────────── */
  const handlePromote = async () => {
    setPromoting(true);
    const res = await authFetch('/admin/make-admin', { method: 'POST' });
    setPromoting(false);
    if (res.success) {
      updateUser(res.user);
      setPromoteMsg('');
    } else {
      setPromoteMsg(res.error || 'Failed.');
    }
  };

  /* ── Delete user ────────────────────────────────────────── */
  const handleDeleteUser = async (uid) => {
    if (!window.confirm('Delete this user and all their data? This cannot be undone.')) return;
    await authFetch(`/admin/users/${uid}`, { method: 'DELETE' });
    setSelectedUser(null);
    setUserDetail(null);
    fetchUsers();
  };

  /* ── Download PDF ───────────────────────────────────────── */
  const downloadPDF = async (uid, username) => {
    setDownloading(uid);
    try {
      const res = await fetch(`http://localhost:5000/reports/user/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `BloomCare_report_${username}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('PDF download failed. Make sure reportlab is installed.');
    } finally {
      setDownloading(null);
    }
  };

  /* ── My own PDF ─────────────────────────────────────────── */
  const downloadMyPDF = async () => {
    setDownloading('me');
    try {
      const res = await fetch('http://localhost:5000/reports/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `BloomCare_report_${user.username}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('PDF download failed. Make sure reportlab is installed: pip install reportlab');
    } finally {
      setDownloading(null);
    }
  };

  /* ── Chart data ─────────────────────────────────────────── */
  const riskChartData = stats ? [
    { name: 'Low',  value: stats.risk_distribution[0], fill: '#5A8A72' },
    { name: 'Mid',  value: stats.risk_distribution[1], fill: '#D4924A' },
    { name: 'High', value: stats.risk_distribution[2], fill: '#B100E7' },
  ] : [];

  const trimChartData = stats ? [
    { name: '1st Trimester', value: stats.trim_distribution[1], fill: '#5A8A72' },
    { name: '2nd Trimester', value: stats.trim_distribution[2], fill: '#D4924A' },
    { name: '3rd Trimester', value: stats.trim_distribution[3], fill: '#8A00F3' },
  ] : [];

  const activityData = stats?.daily_activity?.map(d => ({
    date:  new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: d.users,
  })) || [];

  /* ── Not admin — show promotion screen ─────────────────── */
  if (!isAdmin) {
    return (
      <div style={s.page}>
        <div style={s.denied}>
          <div style={s.deniedIcon}>🔐</div>
          <h2 style={s.deniedTitle}>Admin Access Required</h2>
          <p style={s.deniedSub}>
            This panel is only accessible to administrators.<br />
            If you're the first user, you can promote yourself to admin below.<br />
            Once an admin exists, only they can grant admin access to others.
          </p>
          {promoteMsg && (
            <p style={{ color: 'var(--primary-dark)', fontSize: 14, marginBottom: 16 }}>
              ⚠️ {promoteMsg}
            </p>
          )}
          <button
            style={s.promoteBtn}
            onClick={handlePromote}
            disabled={promoting}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {promoting ? 'Promoting…' : '🛡 Make Me Admin (First-Time Setup)'}
          </button>

          {/* Download own report even without admin */}
          <div style={{ marginTop: 32, padding: '20px 24px', background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'inline-block' }}>
            <p style={{ fontSize: 14, color: 'var(--slate-mid)', marginBottom: 12 }}>
              📄 You can still download your own health report:
            </p>
            <button
              style={s.pdfBtn}
              onClick={downloadMyPDF}
              disabled={downloading === 'me' || !reportAvail}
            >
              {downloading === 'me' ? '⏳ Generating…' : '📥 Download My PDF Report'}
            </button>
            {!reportAvail && (
              <p style={{ fontSize: 11, color: 'var(--slate-light)', marginTop: 8 }}>
                Install reportlab first: <code>pip install reportlab</code>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Admin view ─────────────────────────────────────────── */
  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.pageHeader}>
        <div style={s.headerRow}>
          <div>
            <span style={s.eyebrow}>🛡 Admin Panel</span>
            <h1 style={s.pageTitle}>Platform Overview</h1>
            <p style={s.pageSub}>Monitor all users, predictions, and platform health.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 8 }}>
            <div style={s.adminBadge}>
              🛡 {user?.full_name?.split(' ')[0]} · Admin
            </div>
            <button
              style={s.pdfBtn}
              onClick={downloadMyPDF}
              disabled={downloading === 'me' || !reportAvail}
              title={!reportAvail ? 'Install: pip install reportlab' : ''}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {downloading === 'me' ? '⏳ Generating…' : '📥 My Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div style={s.statsRow}>
          {[
            { icon: '👥', label: 'Total Users',       val: stats.total_users,       color: '#2C3E50' },
            { icon: '🆕', label: 'New This Week',      val: stats.new_users_week,    color: '#5A8A72' },
            { icon: '🩺', label: 'Total Predictions',  val: stats.total_predictions, color: '#8A00F3' },
            { icon: '📔', label: 'Journal Entries',    val: stats.total_journals,    color: '#D4924A' },
            { icon: '💊', label: 'Medicines Tracked',  val: stats.total_medicines,   color: '#9B59B6' },
            { icon: '🎯', label: 'Goals Created',      val: stats.total_goals,       color: '#546A7B' },
          ].map((st, i) => (
            <div key={i} style={s.statCard(st.color)}>
              <div style={s.statBar(st.color)} />
              <div style={{ ...s.statIcon, marginTop: 8 }}>{st.icon}</div>
              <div style={s.statVal}>{st.val}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div style={s.chartsRow}>

        {/* Risk distribution pie */}
        <div style={s.card(100)}>
          <h3 style={s.cardTitle}>Risk Distribution</h3>
          <p style={s.cardSub}>All predictions across all users</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskChartData} cx="50%" cy="50%"
                innerRadius={50} outerRadius={80}
                paddingAngle={3} dataKey="value">
                {riskChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} predictions`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Trimester distribution */}
        <div style={s.card(150)}>
          <h3 style={s.cardTitle}>Trimester Distribution</h3>
          <p style={s.cardSub}>Active users by pregnancy stage</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trimChartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--slate-light)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--slate-light)' }} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="value" name="Users" radius={[4, 4, 0, 0]}>
                {trimChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily activity */}
        <div style={s.card(200)}>
          <h3 style={s.cardTitle}>Daily Activity (7 days)</h3>
          <p style={s.cardSub}>Unique active users per day</p>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--slate-light)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--slate-light)' }} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="users" name="Active Users" fill="#8A00F3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--slate-light)', fontSize: 13 }}>
              No activity data yet.
            </div>
          )}
        </div>
      </div>

      {/* Users table */}
      <div style={s.tableCard}>
        <div style={s.tableTopRow}>
          <h2 style={s.tableTitle}>
            All Users
            <span style={{ fontSize: 13, color: 'var(--slate-light)', fontWeight: 400, marginLeft: 10 }}>
              {totalUsers} total
            </span>
          </h2>

          {/* Search */}
          <input
            placeholder="🔍 Search name, email, username…"
            value={search}
            style={s.searchInput(focusSearch)}
            onFocus={() => setFocusSearch(true)}
            onBlur={() => setFocusSearch(false)}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />

          {/* Filters */}
          <select style={s.filterSelect} value={trimFilter}
            onChange={e => { setTrimFilter(e.target.value); setPage(1); }}>
            <option value="">All Trimesters</option>
            <option value="1">1st Trimester</option>
            <option value="2">2nd Trimester</option>
            <option value="3">3rd Trimester</option>
          </select>

          <select style={s.filterSelect} value={riskFilter}
            onChange={e => { setRiskFilter(e.target.value); setPage(1); }}>
            <option value="">All Risk Levels</option>
            <option value="0">Low Risk</option>
            <option value="1">Mid Risk</option>
            <option value="2">High Risk</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                {['User', 'Age', 'Trimester', 'Last Risk', 'Confidence', 'Predictions', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '32px', color: 'var(--slate-light)' }}>Loading users…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '32px', color: 'var(--slate-light)' }}>No users found.</td></tr>
              ) : users.map(u => {
                const riskCfg = u.last_risk !== null && u.last_risk !== undefined ? RISK_CFG[u.last_risk] : null;
                const trimCfg = TRIM_CFG[u.trimester];
                const colors  = ['#8A00F3', '#D4924A', '#5A8A72', '#546A7B', '#9B59B6'];
                const avatarColor = colors[u.id % colors.length];
                return (
                  <tr key={u.id}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--blush)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    style={{ transition: 'background 0.12s' }}>
                    <td style={s.td}>
                      <div style={s.userNameCell}>
                        <div style={s.userAvatar(avatarColor)}>
                          {u.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={s.userName}>
                            {u.full_name}
                            {u.is_admin && <span style={{ marginLeft: 5, fontSize: 10, background: '#2C3E50', color: '#fff', padding: '1px 6px', borderRadius: 99 }}>admin</span>}
                          </div>
                          <div style={s.userEmail}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>{u.age}y</td>
                    <td style={s.td}>
                      <span style={s.trimPill(trimCfg)}>{trimCfg.emoji} {trimCfg.label}</span>
                    </td>
                    <td style={s.td}>
                      {riskCfg
                        ? <span style={s.riskPill(riskCfg)}>{riskCfg.icon} {riskCfg.label}</span>
                        : <span style={{ color: 'var(--slate-light)', fontSize: 12 }}>—</span>
                      }
                    </td>
                    <td style={s.td}>
                      {u.last_conf != null ? `${u.last_conf}%` : '—'}
                    </td>
                    <td style={s.td}>{u.pred_count}</td>
                    <td style={s.td} style={{ ...s.td, whiteSpace: 'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button style={s.actionBtn('#546A7B', '#EDF2F5')}
                          onClick={() => openUserDetail(u)}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                          👁 View
                        </button>
                        <button style={s.actionBtn('#8A00F3', '#F5E6FF')}
                          disabled={downloading === u.id || !reportAvail}
                          onClick={() => downloadPDF(u.id, u.username)}
                          title={!reportAvail ? 'pip install reportlab' : ''}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                          {downloading === u.id ? '⏳' : '📥 PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={s.pagination}>
            <span style={s.pageInfo}>
              Showing {users.length} of {totalUsers} users
            </span>
            <div>
              <button style={s.pageBtn(false)} disabled={page === 1}
                onClick={() => setPage(p => p - 1)}>← Prev</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} style={s.pageBtn(p === page)}
                  onClick={() => setPage(p)}>{p}</button>
              ))}
              <button style={s.pageBtn(false)} disabled={page === pages}
                onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) { setSelectedUser(null); setUserDetail(null); } }}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{selectedUser.full_name}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={s.pdfBtn}
                  disabled={downloading === selectedUser.id || !reportAvail}
                  onClick={() => downloadPDF(selectedUser.id, selectedUser.username)}
                >
                  {downloading === selectedUser.id ? '⏳ Generating…' : '📥 Download PDF'}
                </button>
                <button style={s.closeBtn}
                  onClick={() => { setSelectedUser(null); setUserDetail(null); }}>✕</button>
              </div>
            </div>

            <div style={s.modalBody}>
              <div style={s.infoGrid}>
                {[
                  ['Username',  `@${selectedUser.username}`],
                  ['Email',      selectedUser.email],
                  ['Age',        `${selectedUser.age} years`],
                  ['Trimester',  `Trimester ${selectedUser.trimester}`],
                  ['Due Date',   selectedUser.due_date || 'Not set'],
                  ['Joined',     new Date(selectedUser.created_at).toLocaleDateString()],
                  ['Predictions',selectedUser.pred_count],
                  ['Admin',      selectedUser.is_admin ? '✓ Yes' : '✗ No'],
                ].map(([label, val]) => (
                  <div key={label} style={s.infoItem}>
                    <div style={s.infoLabel}>{label}</div>
                    <div style={s.infoVal}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Recent vital logs */}
              {userDetail?.logs?.length > 0 && (
                <div style={s.detailSection}>
                  <p style={s.detailTitle}>Recent Vital Logs</p>
                  {userDetail.logs.slice(0, 5).map(log => {
                    const rc = log.risk_level !== null ? RISK_CFG[log.risk_level] : null;
                    return (
                      <div key={log.id} style={s.logRow}>
                        <span style={{ minWidth: 110 }}>
                          {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>SBP: {log.systolic_bp}</span>
                        <span>DBP: {log.diastolic_bp}</span>
                        <span>Gluc: {log.blood_glucose}</span>
                        <span>HR: {log.heart_rate}</span>
                        {rc && <span style={s.riskPill(rc)}>{rc.icon} {rc.label}</span>}
                        {log.confidence && <span style={{ color: rc?.color }}>{log.confidence}%</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Danger zone */}
              <div style={{
                padding: '14px 16px', background: 'var(--primary-tint)',
                borderRadius: 10, border: '1px solid var(--primary-light)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 10 }}>
                  ⚠️ Danger Zone
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    ...s.actionBtn('var(--primary-dark)', 'var(--white)'),
                    border: '1.5px solid var(--primary-light)',
                    padding: '8px 16px',
                  }}
                    onClick={() => handleDeleteUser(selectedUser.id)}>
                    🗑 Delete User & All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}