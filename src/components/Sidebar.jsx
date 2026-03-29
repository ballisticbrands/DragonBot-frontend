import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Clock, Puzzle, Plug, LogOut, Menu, X, Sun, Moon, Monitor } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { path: '/usage', label: 'Usage', icon: BarChart3 },
  { path: '/tasks', label: 'Scheduled Tasks', icon: Clock },
  { path: '/connections', label: 'Connections', icon: Plug },
  { path: '/skills', label: 'Skills', icon: Puzzle },
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

  const c = (dv, lv) => dark ? dv : lv;

  const displayName = session?.firstName
    ? `${session.firstName}${session.lastName ? ' ' + session.lastName : ''}`
    : 'User';
  const avatarUrl = session?.avatarUrl ?? session?.avatar;

  function handleLogout() {
    localStorage.removeItem('dragonbot_token');
    localStorage.removeItem('dragonbot_session');
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
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-8">
        <img src="/logos/dragonbot_fire.png" alt="DragonBot" className="w-7 h-7" />
        <span className={`font-clash font-semibold text-lg ${c('text-white', 'text-[#1A1A1A]')}`}>
          DragonBot
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <button
              key={path}
              onClick={() => { navigate(path); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-satoshi font-medium transition-colors ${
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-satoshi font-medium flex-shrink-0 ${
                c('bg-white/10 text-white', 'bg-gray-200 text-[#1A1A1A]')
              }`}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`text-sm font-satoshi font-medium truncate ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
              {displayName}
            </span>
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
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-satoshi transition-colors ${
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