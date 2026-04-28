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
import Slack from './pages/Slack.jsx';
import Admin from './pages/Admin.jsx';
import ResponseTimes from './pages/ResponseTimes.jsx';
import Settings from './pages/Settings.jsx';
import Sidebar from './components/Sidebar.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

// Monkey-patch window.fetch so every request to the backend automatically carries
// the admin "view as DragonBot" header, when set. This avoids touching the dozens
// of individual fetch() call sites scattered across pages.
if (typeof window !== 'undefined' && !window.__dragonbotFetchPatched) {
  window.__dragonbotFetchPatched = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input?.url ?? '');
    const impersonateId = localStorage.getItem('dragonbot_impersonate_id');
    if (impersonateId && url.startsWith(BACKEND_URL)) {
      const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
      headers.set('X-Impersonate-DragonBot-Id', impersonateId);
      init = { ...init, headers };
    }
    return originalFetch(input, init).then((resp) => {
      // If any backend call returns 401, the session is invalid (user deleted, token expired, etc.)
      // Clear local state and redirect to sign-in.
      if (resp.status === 401 && url.startsWith(BACKEND_URL)) {
        localStorage.removeItem('dragonbot_token');
        localStorage.removeItem('dragonbot_session');
        localStorage.removeItem('dragonbot_is_admin');
        localStorage.removeItem('dragonbot_impersonate_id');
        if (window.location.hash !== '#/signin') {
          window.location.href = '/#/signin';
          window.location.reload();
        }
      }
      return resp;
    });
  };
}

// Maps DB setupStage to the Getting Started URL step param
const STAGE_TO_STEP = {
  SLACK_INSTALL: 'add-to-slack',
  CONNECT_SPAPI: 'connect-spapi',
  CONNECT_TOOLS: 'connect-tools',
  SELECT_CHANNELS: 'select-channels',
  COMPLETE: null, // no redirect needed
};

function PrivateRoute({ children, skipSetupCheck }) {
  const token = localStorage.getItem('dragonbot_token');
  const [validated, setValidated] = useState(false);
  const [setupRedirect, setSetupRedirect] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${BACKEND_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) { setValidated(true); return; }
        const profile = await res.json();
        localStorage.setItem('dragonbot_session', JSON.stringify(profile));
        if (profile.isAdmin) localStorage.setItem('dragonbot_is_admin', '1');
        // If setup isn't complete, redirect to Getting Started (unless we're already there)
        if (!skipSetupCheck) {
          const stage = profile.setupStage;
          if (stage && stage !== 'COMPLETE') {
            const step = STAGE_TO_STEP[stage] || 'add-to-slack';
            setSetupRedirect(`/getting-started?step=${step}`);
          }
        }
        setValidated(true);
      })
      .catch(() => setValidated(true));
  }, [token]);

  if (!token) return <Navigate to="/signin" replace />;
  if (!validated) return null;
  if (setupRedirect) return <Navigate to={setupRedirect} replace />;
  return children;
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
          if (profile.isAdmin) localStorage.setItem('dragonbot_is_admin', '1');
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
  const [theme, setTheme] = useState(() => localStorage.getItem('dragonbot_theme') || 'dark');
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
              <PrivateRoute skipSetupCheck>
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
            path="/slack"
            element={
              <PrivateRoute>
                <Slack dark={dark} />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings dark={dark} />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/response-times"
            element={
              <PrivateRoute>
                <ResponseTimes dark={dark} />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <PrivateRoute>
                <Admin dark={dark} />
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
