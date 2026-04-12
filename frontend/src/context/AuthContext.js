import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API = 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('bb_token'));
  const [loading, setLoading] = useState(true);   // verifying token on first load

  // ── Verify stored token on app start ──────────────────────
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setUser(data.user);
        else clearAuth();
      })
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const clearAuth = () => {
    localStorage.removeItem('bb_token');
    setToken(null);
    setUser(null);
  };

  const saveAuth = (newToken, newUser) => {
    localStorage.setItem('bb_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  // ── Register ───────────────────────────────────────────────
  const register = async (formData) => {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) saveAuth(data.token, data.user);
    return data;
  };

  // ── Login ──────────────────────────────────────────────────
  const login = async (username, password) => {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) saveAuth(data.token, data.user);
    return data;
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = () => clearAuth();

  // ── Update profile locally (after PUT /auth/profile) ──────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  // ── Authenticated fetch helper ─────────────────────────────
  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    return res.json();
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      register, login, logout,
      updateUser, authFetch,
      isAuthenticated: !!user,
      isAdmin: user?.is_admin ?? false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
