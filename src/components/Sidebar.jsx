import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Clock, Puzzle, Plug, LogOut, Menu, X, Sun, Moon, Monitor, MessageSquare, Shield, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

const NAV_ITEMS = [
  { path: '/usage', label: 'Usage', icon: BarChart3 },
  { path: '/tasks', label: 'Scheduled Tasks', icon: Clock },
  { path: '/connections', label: 'Connections', icon: Plug },
  { path: '/slack', label: 'Slack', icon: MessageSquare },
  { path: '/skills', label: 'Skills', icon: Puzzle },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV = [
  { path: '/admin', label: 'Admin', icon: Shield },
  { path: '/admin/response-times', label: 'Response Times', icon: Clock },
];

const THEME_OPTIONS = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('dragonbot_session') ?? 'null');
  } catch {
    return null;
  }
}

export default function Sidebar({ dark, theme, onSetTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  // isAdmin is sticky in localStorage so it survives an empty/stale session.
  // /api/me sets it; once true, the picker stays available across impersonation reloads.
  const isAdmin =
    session?.email === 'gershon@ballisticbrands.co' ||
    session?.isAdmin ||
    localStorage.getItem('dragonbot_is_admin') === '1';
  const [adminBots, setAdminBots] = useState([]);
  const [impersonateId, setImpersonateId] = useState(() => localStorage.getItem('dragonbot_impersonate_id') || '');

  useEffect(() => {
    if (!isAdmin) return;
    const token = localStorage.getItem('dragonbot_token');
    fetch(`${BACKEND_URL}/api/admin/dragonbots-list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { bots: [] }))
      .then((d) => setAdminBots(d.bots || []))
      .catch(() => {});
  }, [isAdmin]);

  // Refresh the cached profile if it's missing (e.g. after impersonation reload)
  // so the sidebar's team-name display and other session-derived UI stay accurate.
  useEffect(() => {
    if (session) return;
    const token = localStorage.getItem('dragonbot_token');
    if (!token) return;
    fetch(`${BACKEND_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((profile) => {
        if (!profile) return;
        localStorage.setItem('dragonbot_session', JSON.stringify(profile));
        if (profile.isAdmin) localStorage.setItem('dragonbot_is_admin', '1');
        // Force a re-render so the new session is reflected
        window.dispatchEvent(new Event('storage'));
      })
      .catch(() => {});
  }, [session]);

  async function onImpersonateChange(e) {
    const value = e.target.value;
    if (value) {
      localStorage.setItem('dragonbot_impersonate_id', value);
    } else {
      localStorage.removeItem('dragonbot_impersonate_id');
    }
    // Refetch /api/me with the new impersonation header and cache it before
    // reloading, so the Sidebar (and other pages) immediately see the right bot.
    const token = localStorage.getItem('dragonbot_token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        localStorage.setItem('dragonbot_session', JSON.stringify(profile));
        if (profile.isAdmin) localStorage.setItem('dragonbot_is_admin', '1');
      }
    } catch { /* ignore — page reload will retry */ }
    setImpersonateId(value);
    window.location.href = '/';
    window.location.reload();
  }

  const c = (dv, lv) => dark ? dv : lv;

  const displayName = session?.firstName
    ? `${session.firstName}${session.lastName ? ' ' + session.lastName : ''}`
    : 'User';
  const avatarUrl = session?.avatarUrl ?? session?.avatar;

  function handleLogout() {
    localStorage.removeItem('dragonbot_token');
    localStorage.removeItem('dragonbot_session');
    localStorage.removeItem('dragonbot_is_admin');
    localStorage.removeItem('dragonbot_impersonate_id');
    navigate('/signin', { replace: true });
  }

  function cycleTheme() {
    const order = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    onSetTheme(next);
  }

  const ThemeIcon = THEME_OPTIONS.find(o => o.value === theme)?.icon || Monitor;

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-1.5 px-4 pt-6 pb-8">
        <motion.img
          src="/DragonBot-logo.png"
          alt="DragonBot"
          className="h-6 flex-shrink-0"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className={`font-bold text-[14px] ${c('text-white', 'text-[#1A1A1A]')}`} style={{ lineHeight: '1' }}>
          get<span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">DragonBot</span><span className={c('text-white', 'text-[#1A1A1A]')}>.com</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {[...NAV_ITEMS, ...(isAdmin ? ADMIN_NAV : [])].map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <button
              key={path}
              onClick={() => { navigate(path); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? `bg-[#2F7D4F]/10 text-[#2F7D4F]`
                  : c('text-white/50 hover:text-white/70 hover:bg-white/5', 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 hover:bg-gray-100')
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={`px-3 pb-5 pt-4 border-t ${c('border-white/5', 'border-gray-200')}`}>
        <div className="flex items-center justify-between px-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                c('bg-white/10 text-white', 'bg-gray-200 text-[#1A1A1A]')
              }`}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              {session?.slackTeamName && (
                <span className={`block text-sm font-medium truncate ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
                  {session.slackTeamName}
                </span>
              )}
              <span className={`block text-xs truncate ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
                {displayName}
              </span>
            </div>
          </div>
          <button
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              c('text-white/30 hover:text-white/50 hover:bg-white/5', 'text-[#1A1A1A]/30 hover:text-[#1A1A1A]/50 hover:bg-gray-100')
            }`}
          >
            <ThemeIcon size={15} />
          </button>
        </div>
        {isAdmin && adminBots.length > 0 && (
          <div className="px-3 mb-2">
            <label className={`block text-[10px] uppercase tracking-wider mb-1 ${c('text-white/30', 'text-[#1A1A1A]/40')}`}>
              View as
            </label>
            <select
              value={impersonateId}
              onChange={onImpersonateChange}
              className={`w-full text-xs px-2 py-1.5 rounded-lg border outline-none ${
                c('bg-white/5 border-white/10 text-white/70', 'bg-white border-gray-200 text-[#1A1A1A]/70')
              }`}
            >
              <option value="">My own DragonBot</option>
              {adminBots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.slackTeamName || b.name || b.id}{b.ownerEmail ? ` — ${b.ownerEmail}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
            c('text-white/30 hover:text-white/50 hover:bg-white/5', 'text-[#1A1A1A]/30 hover:text-[#1A1A1A]/50 hover:bg-gray-100')
          }`}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`md:hidden fixed top-4 left-4 z-40 p-2 rounded-xl ${c('bg-[#1a1a1a] border border-white/10', 'bg-white border border-gray-200')} shadow-lg`}
      >
        <Menu size={20} className={c('text-white/70', 'text-[#1A1A1A]/70')} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className={`relative w-64 h-full ${c('bg-[#111]', 'bg-white')} shadow-2xl`}>
            <button
              onClick={() => setMobileOpen(false)}
              className={`absolute top-5 right-4 p-1 rounded-lg ${c('hover:bg-white/10', 'hover:bg-gray-100')}`}
            >
              <X size={18} className={c('text-white/50', 'text-[#1A1A1A]/50')} />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col w-56 flex-shrink-0 h-screen sticky top-0 border-r ${
        c('bg-[#111] border-white/5', 'bg-white border-gray-200')
      }`}>
        {navContent}
      </aside>
    </>
  );
}