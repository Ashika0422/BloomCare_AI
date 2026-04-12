import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage      from './components/auth/LoginPage';
import RegisterPage   from './components/auth/RegisterPage';
import Navbar         from './components/Navbar';
import MainDashboard  from './components/dashboard/MainDashboard';
import DailyJournal   from './components/dashboard/DailyJournal';
import RiskAnalysis   from './components/dashboard/RiskAnalysis';
import DashboardPage  from './components/DashboardPage';
import AboutPage      from './components/AboutPage';

function AppInner() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [page,     setPage]     = useState('home');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--cream)',
        fontFamily: 'var(--font-body)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌸</div>
          <div style={{ color: 'var(--slate-mid)', fontSize: 15 }}>Loading BabyBloom…</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'register'
      ? <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
      : <LoginPage    onSwitchToRegister={() => setAuthView('register')} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <Navbar currentPage={page} onNavigate={setPage} />
      <main>
        {page === 'home'      && <MainDashboard onNavigate={setPage} />}
        {page === 'journal'   && <DailyJournal />}
        {page === 'risk'      && <RiskAnalysis />}
        {page === 'dashboard' && <DashboardPage />}
        {page === 'about'     && <AboutPage />}
        {/* Upcoming modules */}
        {['chat', 'medicines', 'goals', 'stats'].includes(page) && (
          <div style={{
            maxWidth: 600, margin: '80px auto', textAlign: 'center',
            fontFamily: 'var(--font-body)', color: 'var(--slate-mid)',
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🚧</div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--slate)', marginBottom: 8,
            }}>
              Coming soon
            </h2>
            <p>The <strong>{page}</strong> module is being built in the next phase.</p>
            <button
              onClick={() => setPage('home')}
              style={{
                marginTop: 20, padding: '10px 24px', borderRadius: 99,
                background: 'var(--rose)', color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}