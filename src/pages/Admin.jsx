import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, User, Loader2, MessageSquare, Search } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';
function getToken() { return localStorage.getItem('dragonbot_token'); }

async function apiFetch(path) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 403) throw new Error('Admin access required');
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── URL parsing ─────────────────────────────────────────────────────
// Routes:
//   /admin                                      → no bot selected
//   /admin/:botId                               → bot selected, no session
//   /admin/:botId/sessions/:sessionFileName     → session selected

function parsePath(pathname) {
  const m = pathname.match(/^\/admin(?:\/([^/]+))?(?:\/sessions\/(.+))?\/?$/);
  return {
    botId: m?.[1] ? decodeURIComponent(m[1]) : null,
    sessionFileName: m?.[2] ? decodeURIComponent(m[2]) : null,
  };
}

function buildPath(botId, sessionFileName) {
  if (!botId) return '/admin';
  if (!sessionFileName) return `/admin/${encodeURIComponent(botId)}`;
  return `/admin/${encodeURIComponent(botId)}/sessions/${encodeURIComponent(sessionFileName)}`;
}

// ─── Bots column (left) ──────────────────────────────────────────────

function BotsColumn({ dark, activeBotId, onSelectBot }) {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/conversations/bots')
      .then(setBots)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return bots;
    return bots.filter((b) =>
      [b.slackTeamName, b.name, ...(b.users || [])].filter(Boolean).some((s) => String(s).toLowerCase().includes(q))
    );
  }, [bots, filter]);

  return (
    <div className={`w-60 flex-shrink-0 flex flex-col border-r ${dark ? 'bg-[#0d0d0d] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
      <div className={`px-4 py-3 border-b ${dark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className={`text-xs uppercase tracking-wider mb-2 ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>DragonBots</div>
        <div className="relative">
          <Search size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            className={`w-full text-xs pl-7 pr-2 py-1.5 rounded-md outline-none border ${
              dark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30'
            }`}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && <Loading dark={dark} text="Loading…" />}
        {error && <p className="text-red-500 text-xs px-4 py-3">{error}</p>}
        {filtered.map((bot) => {
          const active = bot.id === activeBotId;
          return (
            <button
              key={bot.id}
              onClick={() => onSelectBot(bot.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? dark ? 'bg-[#2F7D4F]/20 text-white' : 'bg-[#2F7D4F]/10 text-[#1A1A1A]'
                  : dark ? 'text-white/70 hover:bg-white/5' : 'text-[#1A1A1A]/70 hover:bg-gray-100'
              }`}
            >
              <Bot size={14} className={dark ? 'text-[#4ADE80]' : 'text-[#2F7D4F]'} />
              <div className="flex-1 min-w-0">
                <div className="truncate">{bot.slackTeamName || bot.name || bot.id.slice(0, 12)}</div>
                <div className={`text-[10px] truncate ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>
                  {(bot.users || []).join(', ') || bot.status}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sessions column (middle) ────────────────────────────────────────

function SessionsColumn({ dark, botId, activeSessionFileName, onSelectSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!botId) { setSessions([]); setLoading(false); return; }
    setLoading(true);
    apiFetch(`/api/admin/conversations/${encodeURIComponent(botId)}/sessions`)
      .then((d) => setSessions(d.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [botId]);

  const sources = useMemo(() => [...new Set(sessions.map((s) => s.source).filter(Boolean))].sort(), [sessions]);
  const filtered = useMemo(() => {
    let r = sessions;
    if (filter !== 'all') r = r.filter((s) => s.source === filter);
    const q = search.trim().toLowerCase();
    if (q) r = r.filter((s) => [s.source, s.preview].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
    return r;
  }, [sessions, filter, search]);

  if (!botId) {
    return (
      <div className={`w-72 flex-shrink-0 border-r ${dark ? 'bg-[#0f0f0f] border-white/5' : 'bg-white border-gray-200'} flex items-center justify-center`}>
        <p className={`text-xs ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>Pick a DragonBot</p>
      </div>
    );
  }

  return (
    <div className={`w-80 flex-shrink-0 flex flex-col border-r ${dark ? 'bg-[#0f0f0f] border-white/5' : 'bg-white border-gray-200'}`}>
      <div className={`px-4 py-3 border-b ${dark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className={`text-xs uppercase tracking-wider mb-2 ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
          Conversations · {sessions.length}
        </div>
        <div className="relative mb-2">
          <Search size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className={`w-full text-xs pl-7 pr-2 py-1.5 rounded-md outline-none border ${
              dark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30' : 'bg-gray-50 border-gray-200 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30'
            }`}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <FilterPill dark={dark} label="All" active={filter === 'all'} onClick={() => setFilter('all')} count={sessions.length} />
          {sources.map((s) => (
            <FilterPill key={s} dark={dark} label={s} active={filter === s} onClick={() => setFilter(s)} count={sessions.filter((ss) => ss.source === s).length} />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && <Loading dark={dark} text="Loading…" />}
        {!loading && filtered.map((s) => {
          const active = s.fileName === activeSessionFileName;
          return (
            <button
              key={s.fileName}
              onClick={() => onSelectSession(s.fileName)}
              className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors border-b ${
                dark ? 'border-white/5' : 'border-gray-100'
              } ${
                active
                  ? dark ? 'bg-[#2F7D4F]/20' : 'bg-[#2F7D4F]/10'
                  : dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
              }`}
            >
              <MessageSquare size={14} className={`mt-0.5 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className={`text-xs font-medium truncate ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
                    # {s.source || 'unknown'}
                  </div>
                  <div className={`text-[10px] flex-shrink-0 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>{formatTs(s.timestamp)}</div>
                </div>
                <div className={`text-[11px] truncate ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>{s.preview}</div>
                <div className={`text-[10px] ${dark ? 'text-white/20' : 'text-[#1A1A1A]/20'}`}>{s.messageCount} msgs</div>
              </div>
            </button>
          );
        })}
        {!loading && filtered.length === 0 && (
          <p className={`text-xs px-4 py-6 text-center ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>No conversations</p>
        )}
      </div>
    </div>
  );
}

// ─── Chat column (right) ─────────────────────────────────────────────

function ChatColumn({ dark, botId, sessionFileName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!botId || !sessionFileName) { setData(null); return; }
    setLoading(true);
    setError('');
    apiFetch(`/api/admin/conversations/${encodeURIComponent(botId)}/sessions/${encodeURIComponent(sessionFileName)}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [botId, sessionFileName]);

  if (!botId || !sessionFileName) {
    return (
      <div className={`flex-1 flex items-center justify-center ${dark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <p className={`text-sm ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>
          {botId ? 'Pick a conversation' : 'Pick a DragonBot, then a conversation'}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${dark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <div className={`px-6 py-3 border-b flex-shrink-0 ${dark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className={`text-sm font-semibold ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
          # {data?.source || sessionFileName}
        </div>
        {data && (
          <div className={`text-xs ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
            {formatTs(data.sessionTs)} · {data.messages.length} messages
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && <Loading dark={dark} text="Loading conversation…" />}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {data && (
          <div className="space-y-4">
            {data.messages.map((msg, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === 'assistant'
                    ? dark ? 'bg-[#2F7D4F]/20' : 'bg-[#2F7D4F]/10'
                    : dark ? 'bg-white/10' : 'bg-gray-200'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot size={14} className={dark ? 'text-[#4ADE80]' : 'text-[#2F7D4F]'} />
                    : <User size={14} className={dark ? 'text-white/50' : 'text-[#1A1A1A]/50'} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs mb-1 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>
                    {msg.role === 'assistant' ? 'DragonBot' : 'User'} · {formatTs(msg.timestamp)}
                  </div>
                  <div className={`text-sm whitespace-pre-wrap break-words ${dark ? 'text-white/80' : 'text-[#1A1A1A]/80'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function Loading({ dark, text }) {
  return (
    <div className={`flex items-center gap-2 py-6 justify-center text-xs ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
      <Loader2 size={14} className="animate-spin" /> {text}
    </div>
  );
}

function FilterPill({ dark, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${
        active
          ? 'bg-[#2F7D4F] text-white'
          : dark ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-gray-100 text-[#1A1A1A]/50 hover:bg-gray-200'
      }`}
    >
      {label} ({count})
    </button>
  );
}

function formatTs(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return String(ts); }
}

// ─── Main ────────────────────────────────────────────────────────────

export default function Admin({ dark }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { botId, sessionFileName } = parsePath(location.pathname);

  const goBot = (id) => navigate(buildPath(id, null));
  const goSession = (file) => navigate(buildPath(botId, file));

  return (
    <div className="flex h-screen overflow-hidden">
      <BotsColumn dark={dark} activeBotId={botId} onSelectBot={goBot} />
      <SessionsColumn dark={dark} botId={botId} activeSessionFileName={sessionFileName} onSelectSession={goSession} />
      <ChatColumn dark={dark} botId={botId} sessionFileName={sessionFileName} />
    </div>
  );
}