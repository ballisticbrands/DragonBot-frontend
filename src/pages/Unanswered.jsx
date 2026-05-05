import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

function formatTime(d) {
  return new Date(d).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatAge(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return h ? `${d}d ${h}h` : `${d}d`;
}

function ageColor(seconds, dark) {
  if (seconds < 300) return dark ? 'text-white/50' : 'text-[#1A1A1A]/50';
  if (seconds < 1800) return dark ? 'text-yellow-400' : 'text-yellow-600';
  return dark ? 'text-red-400' : 'text-red-600';
}

export default function Unanswered({ dark }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  async function load() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/unanswered`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 403) {
        setError('Admin access required');
        return;
      }
      if (!res.ok) {
        setError(`Failed to load (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      setRows(data.rows ?? []);
      setLastLoadedAt(new Date());
      setError('');
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const c = (dv, lv) => (dark ? dv : lv);

  // Re-tick the displayed ages every 5s without re-fetching.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const displayRows = useMemo(() => {
    if (!lastLoadedAt) return rows;
    const elapsed = Math.floor((Date.now() - lastLoadedAt.getTime()) / 1000);
    return rows.map((r) => ({ ...r, displayedAge: r.ageSeconds + elapsed }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, lastLoadedAt, tick]);

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${c('text-white', 'text-[#1A1A1A]')}`}>
              <AlertCircle size={24} className={displayRows.length > 0 ? 'text-yellow-500' : ''} />
              Unanswered messages
            </h1>
            <p className={`mt-1 text-sm ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>
              DMs and @-mentions every DragonBot has received but hasn't replied to. Updates every 30 seconds.
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); load(); }}
            disabled={loading}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border transition-colors ${
              c('bg-white/5 border-white/10 text-white hover:bg-white/10', 'bg-white border-gray-200 text-[#1A1A1A] hover:bg-gray-50')
            } ${loading ? 'opacity-50 cursor-wait' : ''}`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className={`mb-4 px-4 py-3 rounded-md text-sm ${c('bg-red-500/10 text-red-400', 'bg-red-50 text-red-700')}`}>
            {error}
          </div>
        )}

        {loading && rows.length === 0 ? (
          <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading…</p>
        ) : displayRows.length === 0 ? (
          <div className={`rounded-xl px-6 py-12 text-center ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
            <p className={`text-sm ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>
              No unanswered messages. Every DM and @-mention has a reply.
            </p>
          </div>
        ) : (
          <div className={`rounded-xl overflow-hidden ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
            <div className={`px-5 py-3 border-b text-xs flex items-baseline gap-3 ${c('border-white/5 text-white/50', 'border-gray-200 text-[#1A1A1A]/50')}`}>
              <span>{displayRows.length} pending</span>
              {lastLoadedAt && <span>· loaded {formatTime(lastLoadedAt)}</span>}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left text-xs uppercase tracking-wider ${c('text-white/40 border-b border-white/5', 'text-[#1A1A1A]/40 border-b border-gray-200')}`}>
                  <th className="px-5 py-2 font-medium">DragonBot</th>
                  <th className="px-5 py-2 font-medium">Channel</th>
                  <th className="px-5 py-2 font-medium">User</th>
                  <th className="px-5 py-2 font-medium">Sent at</th>
                  <th className="px-5 py-2 font-medium text-right">Age</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((r) => (
                  <tr key={r.id} className={`border-t ${c('border-white/5', 'border-gray-100')}`}>
                    <td className={`px-5 py-2 ${c('text-white', 'text-[#1A1A1A]')}`}>
                      <div className="flex flex-col">
                        <span>{r.botName ?? '—'}</span>
                        {r.slackTeamName && r.slackTeamName !== r.botName && (
                          <span className={`text-xs ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>{r.slackTeamName}</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-5 py-2 font-mono text-xs ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
                      {r.slackChannel}
                    </td>
                    <td className={`px-5 py-2 font-mono text-xs ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
                      {r.slackUserId}
                    </td>
                    <td className={`px-5 py-2 ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
                      {formatTime(r.eventReceivedAt)}
                    </td>
                    <td className={`px-5 py-2 text-right tabular-nums ${ageColor(r.displayedAge ?? r.ageSeconds, dark)}`}>
                      {formatAge(r.displayedAge ?? r.ageSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}