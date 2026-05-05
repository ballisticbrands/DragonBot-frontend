import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, AlertCircle, Activity } from 'lucide-react';

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

function StatusBadge({ runStatus, runStatusReason, dark }) {
  const c = (dv, lv) => (dark ? dv : lv);
  if (runStatus === 'success') {
    return (
      <span
        title="OpenClaw run finished cleanly — but the bot didn't deliver a reply (or delivered one then went quiet)"
        className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${c('bg-emerald-500/15 text-emerald-400', 'bg-emerald-50 text-emerald-700')}`}
      >
        success (no reply)
      </span>
    );
  }
  if (runStatus === 'error') {
    return (
      <span
        title={runStatusReason ? `Failure flags: ${runStatusReason}` : 'OpenClaw run finalStatus = error'}
        className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${c('bg-red-500/15 text-red-400', 'bg-red-50 text-red-700')}`}
      >
        error{runStatusReason ? ` · ${runStatusReason.split(',')[0]}` : ''}
      </span>
    );
  }
  return (
    <span
      title="Run not yet checked, or still in flight on disk. Click 'Update job status' to refresh."
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${c('bg-white/5 text-white/40', 'bg-gray-100 text-gray-500')}`}
    >
      pending
    </span>
  );
}

export default function Unanswered({ dark }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

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

  async function scan() {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/unanswered/scan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        setScanResult({ error: `Scan failed (HTTP ${res.status})` });
        return;
      }
      const data = await res.json();
      setScanResult(data);
      await load();
    } catch (e) {
      setScanResult({ error: String(e?.message || e) });
    } finally {
      setScanning(false);
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
              DMs and @-mentions where the bot didn't deliver a reply, or whose OpenClaw run errored
              (timeout / abort / model error). Refreshes every 30 seconds; click <em>Update job status</em>
              to fold in any newly-completed runs from disk.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={scan}
              disabled={scanning || loading}
              title="Scan OpenClaw trajectory files for every pending row and stamp success/error"
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border transition-colors ${
                c('bg-white/5 border-white/10 text-white hover:bg-white/10', 'bg-white border-gray-200 text-[#1A1A1A] hover:bg-gray-50')
              } ${scanning ? 'opacity-50 cursor-wait' : ''}`}
            >
              <Activity size={14} className={scanning ? 'animate-pulse' : ''} />
              {scanning ? 'Scanning…' : 'Update job status'}
            </button>
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
        </div>

        {error && (
          <div className={`mb-4 px-4 py-3 rounded-md text-sm ${c('bg-red-500/10 text-red-400', 'bg-red-50 text-red-700')}`}>
            {error}
          </div>
        )}

        {scanResult && (
          <div className={`mb-4 px-4 py-3 rounded-md text-sm ${
            scanResult.error
              ? c('bg-red-500/10 text-red-400', 'bg-red-50 text-red-700')
              : c('bg-emerald-500/10 text-emerald-400', 'bg-emerald-50 text-emerald-700')
          }`}>
            {scanResult.error ? scanResult.error : (
              <>
                Scanned <b>{scanResult.scanned}</b> pending row{scanResult.scanned === 1 ? '' : 's'}:
                {' '}<b>{scanResult.updatedSuccess}</b> marked success,
                {' '}<b>{scanResult.updatedError}</b> marked error,
                {' '}<b>{scanResult.stillPending}</b> still pending (run in flight or trajectory missing).
              </>
            )}
          </div>
        )}

        {loading && rows.length === 0 ? (
          <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading…</p>
        ) : displayRows.length === 0 ? (
          <div className={`rounded-xl px-6 py-12 text-center ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
            <p className={`text-sm ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>
              No unanswered messages. Every DM and @-mention has a reply and a clean run.
            </p>
          </div>
        ) : (
          <div className={`rounded-xl ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
            <div className={`px-5 py-3 border-b text-xs flex items-baseline gap-3 ${c('border-white/5 text-white/50', 'border-gray-200 text-[#1A1A1A]/50')}`}>
              <span>{displayRows.length} unanswered</span>
              {lastLoadedAt && <span>· loaded {formatTime(lastLoadedAt)}</span>}
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left text-xs uppercase tracking-wider ${c('text-white/40 border-b border-white/5', 'text-[#1A1A1A]/40 border-b border-gray-200')}`}>
                  <th className="px-5 py-2 font-medium">DragonBot</th>
                  <th className="px-5 py-2 font-medium">Channel</th>
                  <th className="px-5 py-2 font-medium">User</th>
                  <th className="px-5 py-2 font-medium">Message</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Sent at</th>
                  <th className="px-5 py-2 font-medium">Client Msg ID</th>
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
                    <td className={`px-5 py-2 ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
                      {r.slackTeamId ? (
                        <a
                          href={`slack://channel?team=${r.slackTeamId}&id=${r.slackChannel}`}
                          className={`hover:underline ${r.slackChannelName ? '' : 'font-mono text-xs'}`}
                          title={`Open in Slack — ${r.slackChannel}`}
                        >
                          {r.slackChannelName ? `#${r.slackChannelName}` : r.slackChannel}
                        </a>
                      ) : r.slackChannelName ? (
                        <span>#{r.slackChannelName}</span>
                      ) : (
                        <span className="font-mono text-xs">{r.slackChannel}</span>
                      )}
                    </td>
                    <td className={`px-5 py-2 ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
                      {r.slackTeamId ? (
                        <a
                          href={`slack://user?team=${r.slackTeamId}&id=${r.slackUserId}`}
                          className={`hover:underline ${r.slackUserName ? '' : 'font-mono text-xs'}`}
                          title={`Open DM in Slack — ${r.slackUserId}`}
                        >
                          {r.slackUserName ?? r.slackUserId}
                        </a>
                      ) : r.slackUserName ? (
                        <span>{r.slackUserName}</span>
                      ) : (
                        <span className="font-mono text-xs">{r.slackUserId}</span>
                      )}
                    </td>
                    <td className={`px-5 py-2 max-w-md ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
                      {r.messageText ? (
                        r.slackTeamId ? (
                          <a
                            href={`slack://channel?team=${r.slackTeamId}&id=${r.slackChannel}&message=${r.slackEventTs}`}
                            className="hover:underline block truncate"
                            title={r.messageText}
                          >
                            {r.messageText}
                          </a>
                        ) : (
                          <span className="block truncate" title={r.messageText}>{r.messageText}</span>
                        )
                      ) : (
                        <span className={c('text-white/30', 'text-[#1A1A1A]/30')}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-2 whitespace-nowrap">
                      <StatusBadge runStatus={r.runStatus} runStatusReason={r.runStatusReason} dark={dark} />
                    </td>
                    <td className={`px-5 py-2 whitespace-nowrap ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
                      {formatTime(r.eventReceivedAt)}
                    </td>
                    <td className={`px-5 py-2 font-mono text-xs whitespace-nowrap ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>
                      {r.slackClientMsgId ? (
                        <span title={r.slackClientMsgId}>{r.slackClientMsgId.slice(0, 8)}…</span>
                      ) : (
                        <span className={c('text-white/20', 'text-[#1A1A1A]/20')}>—</span>
                      )}
                    </td>
                    <td className={`px-5 py-2 text-right tabular-nums ${ageColor(r.displayedAge ?? r.ageSeconds, dark)}`}>
                      {formatAge(r.displayedAge ?? r.ageSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}