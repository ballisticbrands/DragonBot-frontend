import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import SignIn from './pages/SignIn.jsx';
import GettingStarted from './pages/GettingStarted.jsx';
import Dashboard from './pages/Dashboard.jsx';
// import Chat from './pages/Chat.jsx';
import Usage from './pages/Usage.jsx';
import Tasks from './pages/Tasks.jsx';
import Skills from './pages/Skills.jsx';
import Connections from './pages/Connections.jsx';
import Sidebar from './components/Sidebar.jsx';

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

// Pages that should NOT show the sidebar
const NO_SIDEBAR_ROUTES = ['/signin', '/getting-started'];

function AppLayout() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('dragonbot_theme') || 'system');
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('dragonbot_theme', theme);
  }, [theme]);

  const dark = theme === 'dark' || (theme === 'system' && systemDark);

  const showSidebar = !NO_SIDEBAR_ROUTES.some(r => location.pathname.startsWith(r));
  const isAuthenticated = !!localStorage.getItem('dragonbot_token');

  return (
    <div className={`flex min-h-screen ${dark ? 'bg-[#0f0f0f]' : 'bg-[#fafafa]'}`}>
      {showSidebar && isAuthenticated && <Sidebar dark={dark} theme={theme} onSetTheme={setTheme} />}
      <main className="flex-1 min-w-0">
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
          {/* <Route
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
          /> */}
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Tasks dark={dark} />
              </PrivateRoute>
            }
          />
          <Route
            path="/usage"
            element={
              <PrivateRoute>
                <Usage dark={dark} />
              </PrivateRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <PrivateRoute>
                <Connections dark={dark} />
              </PrivateRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <PrivateRoute>
                <Skills dark={dark} />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard dark={dark} />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <TokenHandler>
        <AppLayout />
      </TokenHandler>
    </HashRouter>
  );
}
