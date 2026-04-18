import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage       from './components/auth/LoginPage';
import RegisterPage    from './components/auth/RegisterPage';
import Navbar          from './components/Navbar';
import MainDashboard   from './components/dashboard/MainDashboard';
import DailyJournal    from './components/dashboard/DailyJournal';
import RiskAnalysis    from './components/dashboard/RiskAnalysis';
import ChatAssistant   from './components/dashboard/ChatAssistant';
import MedicineTracker from './components/dashboard/MedicineTracker';
import GoalTracker     from './components/dashboard/GoalTracker';
import AdminPanel      from './components/admin/AdminPanel';
import DashboardPage   from './components/DashboardPage';
import AboutPage       from './components/AboutPage';

function AppInner() {
  const { isAuthenticated, loading, user } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [page,     setPage]     = useState('home');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--accent-tint)',
        fontFamily: 'var(--font-body)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌸</div>
          <div style={{ color: 'var(--slate-mid)', fontSize: 15 }}>Loading BloomCare…</div>
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
    <div style={{ minHeight: '100vh', background: 'var(--accent-tint)' }}>
      <Navbar currentPage={page} onNavigate={setPage} />
      <main>
        {page === 'home'      && <MainDashboard onNavigate={setPage} />}
        {page === 'journal'   && <DailyJournal />}
        {page === 'risk'      && <RiskAnalysis />}
        {page === 'chat'      && <ChatAssistant />}
        {page === 'medicines' && <MedicineTracker />}
        {page === 'goals'     && <GoalTracker />}
        {page === 'admin'     && <AdminPanel />}
        {page === 'dashboard' && <DashboardPage />}
        {page === 'about'     && <AboutPage />}
      </main>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}