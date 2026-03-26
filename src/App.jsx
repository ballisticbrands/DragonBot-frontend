import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import SignIn from './pages/SignIn.jsx';
import GettingStarted from './pages/GettingStarted.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Chat from './pages/Chat.jsx';
import Usage from './pages/Usage.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.dragonsellerbot.com';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('dragonbot_token');
  return token ? children : <Navigate to="/signin" replace />;
}

function TokenHandler({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) return;

    localStorage.setItem('dragonbot_token', token);

    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const profile = await res.json();
          localStorage.setItem('dragonbot_session', JSON.stringify(profile));
        }
      } catch (err) {
        console.error('[app] Failed to fetch user profile:', err);
      }

      // Remove ?token= from URL
      params.delete('token');
      const remaining = params.toString();
      const cleanPath = location.pathname + (remaining ? `?${remaining}` : '') + location.hash;
      navigate(cleanPath, { replace: true });
    })();
  }, [location.search, navigate, location.pathname, location.hash]);

  return children;
}

export default function App() {
  return (
    <HashRouter>
      <TokenHandler>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/getting-started"
            element={
              <PrivateRoute>
                <GettingStarted />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:sessionKey"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route
            path="/usage"
            element={
              <PrivateRoute>
                <Usage />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TokenHandler>
    </HashRouter>
  );
}