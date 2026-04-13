import { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft, Bot, User, Loader2, MessageSquare } from 'lucide-react';

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

// ─── Bot list ────────────────────────────────────────────────────────

function BotList({ dark, onSelect }) {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/conversations/bots')
      .then(setBots)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (loading) return <Loading dark={dark} text="Loading DragonBots..." />;

  return (
    <div className="space-y-2">
      {bots.map(bot => (
        <button
          key={bot.id}
          onClick={() => onSelect(bot)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
            dark ? 'hover:bg-white/5 border border-white/10' : 'hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Bot size={20} className={dark ? 'text-[#4ADE80]' : 'text-[#2F7D4F]'} />
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              {bot.slackTeamName || bot.name || bot.id.slice(0, 12)}
            </div>
            <div className={`text-xs ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
              {bot.users.join(', ')} &middot; {bot.status}
            </div>
          </div>
          <ChevronRight size={16} className={dark ? 'text-white/20' : 'text-[#1A1A1A]/20'} />
        </button>
      ))}
    </div>
  );
}

// ─── Session list ────────────────────────────────────────────────────

function SessionList({ dark, bot, onSelect, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    apiFetch(`/api/admin/conversations/${bot.id}/sessions`)
      .then(d => setSessions(d.sessions || []))
      .finally(() => setLoading(false));
  }, [bot.id]);

  const sources = [...new Set(sessions.map(s => s.source))].sort();
  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.source === filter);

  if (loading) return <Loading dark={dark} text="Loading sessions..." />;

  return (
    <div>
      <button onClick={onBack} className={`flex items-center gap-1 mb-4 text-sm ${dark ? 'text-white/50 hover:text-white/70' : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70'}`}>
        <ArrowLeft size={14} /> Back to DragonBots
      </button>
      <h2 className={`text-lg font-semibold mb-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        {bot.slackTeamName || bot.name}
      </h2>
      <p className={`text-xs mb-4 ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
        {sessions.length} conversations
      </p>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterPill dark={dark} label="All" active={filter === 'all'} onClick={() => setFilter('all')} count={sessions.length} />
        {sources.map(s => (
          <FilterPill key={s} dark={dark} label={s} active={filter === s} onClick={() => setFilter(s)}
            count={sessions.filter(ss => ss.source === s).length} />
        ))}
      </div>

      {/* Sessions */}
      <div className="space-y-1">
        {filtered.map(session => (
          <button
            key={session.fileName}
            onClick={() => onSelect(session)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              dark ? 'hover:bg-white/5 border border-white/10' : 'hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <MessageSquare size={16} className={dark ? 'text-white/30' : 'text-[#1A1A1A]/30'} />
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
                {session.source || 'Unknown'}
              </div>
              <div className={`text-xs truncate ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
                {session.preview}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-xs ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>
                {formatTs(session.timestamp)}
              </div>
              <div className={`text-xs ${dark ? 'text-white/20' : 'text-[#1A1A1A]/20'}`}>
                {session.messageCount} msgs
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className={`text-sm py-4 text-center ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>No conversations found</p>
        )}
      </div>
    </div>
  );
}

// ─── Chat viewer ─────────────────────────────────────────────────────

function ChatViewer({ dark, bot, session: sessionMeta, onBack }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/admin/conversations/${bot.id}/sessions/${sessionMeta.fileName}`)
      .then(setSession)
      .finally(() => setLoading(false));
  }, [bot.id, sessionMeta.fileName]);

  if (loading) return <Loading dark={dark} text="Loading conversation..." />;
  if (!session) return <p className="text-red-500 text-sm">Failed to load</p>;

  return (
    <div>
      <button onClick={onBack} className={`flex items-center gap-1 mb-4 text-sm ${dark ? 'text-white/50 hover:text-white/70' : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70'}`}>
        <ArrowLeft size={14} /> Back to sessions
      </button>
      <h2 className={`text-lg font-semibold mb-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        {session.source || 'Conversation'}
      </h2>
      <p className={`text-xs mb-6 ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
        {formatTs(session.sessionTs)} &middot; {session.messages.length} messages
      </p>

      <div className="space-y-4">
        {session.messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'assistant' ? '' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === 'assistant'
                ? dark ? 'bg-[#2F7D4F]/20' : 'bg-[#2F7D4F]/10'
                : dark ? 'bg-white/10' : 'bg-gray-200'
            }`}>
              {msg.role === 'assistant'
                ? <Bot size={14} className={dark ? 'text-[#4ADE80]' : 'text-[#2F7D4F]'} />
                : <User size={14} className={dark ? 'text-white/50' : 'text-[#1A1A1A]/50'} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-xs mb-1 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>
                {msg.role === 'assistant' ? 'DragonBot' : 'User'} &middot; {formatTs(msg.timestamp)}
              </div>
              <div className={`text-sm whitespace-pre-wrap break-words ${
                dark ? 'text-white/80' : 'text-[#1A1A1A]/80'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function Loading({ dark, text }) {
  return (
    <div className={`flex items-center gap-2 py-8 justify-center text-sm ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
      <Loader2 size={16} className="animate-spin" /> {text}
    </div>
  );
}

function FilterPill({ dark, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs transition-colors ${
        active
          ? 'bg-[#2F7D4F] text-white'
          : dark
            ? 'bg-white/5 text-white/50 hover:bg-white/10'
            : 'bg-gray-100 text-[#1A1A1A]/50 hover:bg-gray-200'
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
  } catch { return ts; }
}

// ─── Main ────────────────────────────────────────────────────────────

export default function Admin({ dark }) {
  const [view, setView] = useState('bots'); // bots | sessions | chat
  const [selectedBot, setSelectedBot] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className={`font-semibold text-2xl mb-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        Admin — Conversations
      </h1>
      <p className={`text-sm mb-6 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
        View all DragonBot conversations across all workspaces.
      </p>

      {view === 'bots' && (
        <BotList dark={dark} onSelect={(bot) => { setSelectedBot(bot); setView('sessions'); }} />
      )}
      {view === 'sessions' && selectedBot && (
        <SessionList
          dark={dark}
          bot={selectedBot}
          onSelect={(s) => { setSelectedSession(s); setView('chat'); }}
          onBack={() => { setSelectedBot(null); setView('bots'); }}
        />
      )}
      {view === 'chat' && selectedBot && selectedSession && (
        <ChatViewer
          dark={dark}
          bot={selectedBot}
          session={selectedSession}
          onBack={() => { setSelectedSession(null); setView('sessions'); }}
        />
      )}
    </div>
  );
}