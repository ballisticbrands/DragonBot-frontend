import { useState, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

function getSince(key) {
  const now = new Date();
  switch (key) {
    case '7d': return new Date(now.getTime() - 7 * 86400000);
    case '30d': return new Date(now.getTime() - 30 * 86400000);
    case '90d': return new Date(now.getTime() - 90 * 86400000);
    default: return new Date(now.getTime() - 7 * 86400000);
  }
}

const TIMEFRAMES = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

function formatMs(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(d) {
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ResponseTimes({ dark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [tfOpen, setTfOpen] = useState(false);
  const [botId, setBotId] = useState('');
  const [bots, setBots] = useState([]);
  const [botOpen, setBotOpen] = useState(false);

  // Load bot list for admin filter
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/dragonbots-list`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.bots) setBots(d.bots); })
      .catch(() => {});
  }, []);

  // Load response time data
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const since = getSince(timeframe).toISOString();
        const params = new URLSearchParams({ since });
        if (botId) params.set('botId', botId);
        const res = await fetch(`${BACKEND_URL}/api/admin/response-times?${params}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Failed to load response times:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [timeframe, botId]);

  const maxMs = useMemo(() => {
    if (!data?.byDay) return 1;
    return Math.max(1, ...data.byDay.map(d => (d.avgTotalMs || 0)));
  }, [data]);

  const stats = useMemo(() => {
    if (!data?.byDay?.length) return { avg: 0, p50: 0, p95: 0, count: 0 };
    const totalMsgs = data.byDay.reduce((s, d) => s + (d.messageCount || 0), 0);
    const weightedTotal = data.byDay.reduce((s, d) => s + (d.avgTotalMs || 0) * (d.messageCount || 0), 0);
    const avgTotal = totalMsgs > 0 ? Math.round(weightedTotal / totalMsgs) : 0;
    const lastDay = data.byDay[data.byDay.length - 1];
    return { avg: avgTotal, p50: lastDay?.p50TotalMs || 0, p95: lastDay?.p95TotalMs || 0, count: totalMsgs };
  }, [data]);

  const c = (dv, lv) => dark ? dv : lv;
  const tfLabel = TIMEFRAMES.find(t => t.value === timeframe)?.label || 'Last 7 days';
  const botLabel = botId ? (bots.find(b => b.id === botId)?.name || 'Bot') : 'All bots';

  if (loading) return <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}><p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p></div>;
  if (!data) return <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}><p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Failed to load.</p></div>;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-[1000px] mx-auto flex flex-col gap-5">
        {/* Header + filters */}
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${c('text-white', 'text-[#1A1A1A]')}`}>Response Times</h1>
          <div className="flex gap-2">
            <Dropdown dark={dark} label={botLabel} open={botOpen} setOpen={setBotOpen}
              items={[
                { label: 'All bots', onClick: () => { setBotId(''); setBotOpen(false); } },
                ...bots.map(b => ({ label: b.name || b.slackTeamName, onClick: () => { setBotId(b.id); setBotOpen(false); } })),
              ]} />
            <Dropdown dark={dark} label={tfLabel} open={tfOpen} setOpen={setTfOpen}
              items={TIMEFRAMES.map(t => ({ label: t.label, onClick: () => { setTimeframe(t.value); setTfOpen(false); } }))} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatBox dark={dark} label="Avg Response" value={formatMs(stats.avg)} />
          <StatBox dark={dark} label="P50" value={formatMs(stats.p50)} />
          <StatBox dark={dark} label="P95" value={formatMs(stats.p95)} />
          <StatBox dark={dark} label="Messages" value={stats.count.toLocaleString()} />
        </div>

        {/* Daily chart */}
        <div className={`rounded-xl ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
          <div className="flex items-center justify-between p-5 pb-0">
            <p className={`text-[11px] font-medium ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>Avg Response Time by Day</p>
            <div className={`flex gap-4 text-[11px] ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-amber-500/70" />
                <span>OpenClaw overhead</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-blue-500/70" />
                <span>LLM time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-purple-500/60" />
                <span>Tool calls</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-[2px] ${c('bg-white/10', 'bg-gray-200')}`} />
                <span>Other</span>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 pt-3">
            {data.byDay.length === 0 ? (
              <p className={`text-sm py-8 text-center ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>No data yet.</p>
            ) : (() => {
              const yTicks = [0, Math.round(maxMs / 2), Math.round(maxMs)];
              const formatTick = (n) => n >= 1000 ? `${(n / 1000).toFixed(0)}s` : `${n}ms`;
              return (
                <div className="flex gap-2">
                  <div className="flex flex-col justify-between h-40 flex-shrink-0 py-0.5">
                    {[...yTicks].reverse().map((tick, i) => (
                      <span key={i} className={`text-[10px] tabular-nums text-right w-8 ${c('text-white/25', 'text-[#1A1A1A]/25')}`}>
                        {formatTick(tick)}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-[2px] h-40 flex-1 relative overflow-visible">
                    {yTicks.map((tick, i) => (
                      <div key={i} className={`absolute left-0 right-0 border-t ${c('border-white/5', 'border-gray-100')}`}
                        style={{ bottom: `${(tick / maxMs) * 100}%` }} />
                    ))}
                    {data.byDay.map((day) => {
                      const overhead = Math.max(0, day.avgOverheadMs || 0);
                      const llm = Math.max(0, day.avgLlmMs || 0);
                      const tool = Math.max(0, day.avgToolMs || 0);
                      const total = Math.max(0, day.avgTotalMs || 0);
                      const other = Math.max(0, total - overhead - llm - tool);
                      const pctOverhead = (overhead / maxMs) * 100;
                      const pctLlm = (llm / maxMs) * 100;
                      const pctTool = (tool / maxMs) * 100;
                      const pctOther = (other / maxMs) * 100;
                      return (
                        <div key={day.date} className="flex-1 flex flex-col justify-end group relative h-full z-10">
                          <div className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] px-2.5 py-2 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg ${c('bg-[#333] text-white', 'bg-gray-800 text-white')}`} style={{ zIndex: 100 }}>
                            <div className="font-medium mb-0.5">{formatDate(day.date)} ({day.messageCount} msgs)</div>
                            <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-[2px] bg-amber-500/70" />Overhead: {formatMs(overhead)}</div>
                            <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-[2px] bg-blue-500/70" />LLM: {formatMs(llm)}</div>
                            <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-[2px] bg-purple-500/60" />Tools: {formatMs(tool)}</div>
                            <div className="flex items-center gap-1.5"><span className={`inline-block h-2 w-2 rounded-[2px] ${c('bg-white/10', 'bg-gray-200')}`} />Other: {formatMs(other)}</div>
                            <div className={`mt-0.5 pt-0.5 border-t border-white/20 font-medium`}>Total: {formatMs(total)}</div>
                            {day.p50TotalMs && <div>P50: {formatMs(day.p50TotalMs)} · P95: {formatMs(day.p95TotalMs)}</div>}
                          </div>
                          {pctOverhead > 0 && <div className="w-full bg-amber-500/70 rounded-t-[2px]" style={{ height: `${Math.max(pctOverhead, 1)}%` }} />}
                          {pctLlm > 0 && <div className="w-full bg-blue-500/70" style={{ height: `${Math.max(pctLlm, 1)}%` }} />}
                          {pctTool > 0 && <div className="w-full bg-purple-500/60" style={{ height: `${Math.max(pctTool, 1)}%` }} />}
                          {pctOther > 0 && <div className={`w-full ${c('bg-white/10', 'bg-gray-200')}`} style={{ height: `${Math.max(pctOther, 1)}%` }} />}
                          {total === 0 && <div className={`w-full rounded-t-[2px] ${c('bg-white/5', 'bg-gray-100')}`} style={{ height: '1px' }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {data.byDay.length > 0 && (
              <div className="flex justify-between mt-2 ml-10">
                <span className={`text-[10px] ${c('text-white/20', 'text-[#1A1A1A]/20')}`}>{data.byDay[0]?.date}</span>
                <span className={`text-[10px] ${c('text-white/20', 'text-[#1A1A1A]/20')}`}>{data.byDay[data.byDay.length - 1]?.date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Per-message table */}
        <div className={`rounded-xl overflow-hidden ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
          <div className="p-5 pb-0">
            <p className={`text-[11px] font-medium ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>Recent Messages</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${c('border-white/5', 'border-gray-100')}`}>
                  <th className={`text-[11px] font-medium py-2 px-4 text-left ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Time</th>
                  <th className={`text-[11px] font-medium py-2 px-2 text-left ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Bot</th>
                  <th className={`text-[11px] font-medium py-2 px-2 text-right ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Total</th>
                  <th className={`text-[11px] font-medium py-2 px-2 text-right ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Overhead</th>
                  <th className={`text-[11px] font-medium py-2 px-2 text-right ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>LLM</th>
                  <th className={`text-[11px] font-medium py-2 px-2 text-right ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Tools</th>
                  <th className={`text-[11px] font-medium py-2 px-2 text-right ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>LLM Calls</th>
                  <th className={`text-[11px] font-medium py-2 px-4 text-left ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Model</th>
                </tr>
              </thead>
              <tbody>
                {(!data.messages || data.messages.length === 0) ? (
                  <tr><td colSpan={8} className={`py-6 px-4 text-center text-sm ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>No messages yet.</td></tr>
                ) : data.messages.slice(0, 50).map((m, i) => (
                  <tr key={i} className={`border-b last:border-0 ${c('border-white/5 hover:bg-white/[0.02]', 'border-gray-50 hover:bg-gray-50/50')}`}>
                    <td className={`py-2 px-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>{formatTime(m.eventReceivedAt)}</td>
                    <td className={`py-2 px-2 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>{m.botName || '—'}</td>
                    <td className={`py-2 px-2 text-right font-medium ${c('text-white', 'text-[#1A1A1A]')}`}>{formatMs(m.totalResponseMs)}</td>
                    <td className={`py-2 px-2 text-right text-amber-500/80`}>{formatMs(m.overheadMs)}</td>
                    <td className={`py-2 px-2 text-right text-blue-400`}>{formatMs(m.llmTotalMs)}</td>
                    <td className={`py-2 px-2 text-right text-purple-400`}>{formatMs(m.toolTotalMs)}</td>
                    <td className={`py-2 px-2 text-right ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>{m.llmCallCount ?? '—'}</td>
                    <td className={`py-2 px-4 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}><code className="text-[11px]">{m.model || '—'}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ dark, label, value }) {
  const c = (dv, lv) => dark ? dv : lv;
  return (
    <div className={`rounded-xl p-4 ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
      <p className={`text-[11px] font-medium mb-1 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>{label}</p>
      <p className={`text-2xl font-bold ${c('text-white', 'text-[#1A1A1A]')}`}>{value}</p>
    </div>
  );
}

function Dropdown({ dark, label, open, setOpen, items }) {
  const c = (dv, lv) => dark ? dv : lv;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium ${c('border-white/10 bg-[#1a1a1a] text-white hover:bg-white/5', 'border-gray-200 bg-white text-[#1A1A1A] hover:bg-gray-50')}`}>
        {label}
        <ChevronDown size={14} className={c('text-white/40', 'text-[#1A1A1A]/40')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border shadow-lg py-1 ${c('bg-[#222] border-white/10', 'bg-white border-gray-200')}`}>
            {items.map((item, i) => (
              <button key={i} onClick={item.onClick}
                className={`w-full text-left px-3 py-2 text-sm ${c('text-white/80 hover:bg-white/5', 'text-[#1A1A1A]/80 hover:bg-gray-50')}`}>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
