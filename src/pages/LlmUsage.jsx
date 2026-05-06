import { useState, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

function getSince(key) {
  const now = new Date();
  switch (key) {
    case 'today': { const d = new Date(now); d.setHours(0,0,0,0); return d; }
    case '7d': return new Date(now.getTime() - 7 * 86400000);
    case 'month': return new Date(now.getFullYear(), now.getMonth(), 1);
    case '30d': return new Date(now.getTime() - 30 * 86400000);
    case '90d': return new Date(now.getTime() - 90 * 86400000);
    default: return new Date(now.getTime() - 30 * 86400000);
  }
}

const TIMEFRAMES = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'This month', value: 'month' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

const THREAD_SORTS = [
  { label: 'Top spend', value: 'top' },
  { label: 'Newest', value: 'newest' },
];

function formatCredits(n) {
  if (n == null || n === 0) return '0 credits';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k credits`;
  return `${Math.round(n).toLocaleString()} credits`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function sessionTagToTitle(tag) {
  if (!tag || tag === 'unknown::') return 'One-off task';
  if (tag.startsWith('heartbeat::')) return 'Heartbeat';
  if (tag.startsWith('cron::')) {
    const parts = tag.slice(6).split('::');
    return `Scheduled task: ${parts[1] || parts[0] || 'Unknown'}`;
  }
  if (tag.startsWith('slack::')) {
    const parts = tag.slice(7).split('::');
    const name = parts[1] || parts[0] || 'Unknown';
    return `DM: ${name}`;
  }
  return tag;
}

export default function LlmUsage({ dark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [tfOpen, setTfOpen] = useState(false);
  const [threadSort, setThreadSort] = useState('top');
  const [tsOpen, setTsOpen] = useState(false);
  const [threadPage, setThreadPage] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const THREADS_PER_PAGE = 10;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const since = getSince(timeframe).toISOString();
        const res = await fetch(`${BACKEND_URL}/api/admin/llm-usage?since=${since}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Failed to load llm-usage:', err);
      } finally {
        setLoading(false);
      }
    })();
    setThreadPage(0);
    setSelectedDay(null);
  }, [timeframe]);

  const maxDayCredits = useMemo(() => {
    if (!data?.byDay) return 1;
    return Math.max(0.01, ...data.byDay.map((d) => d.credits || 0));
  }, [data]);

  const [dayThreads, setDayThreads] = useState(null);
  const [dayThreadsLoading, setDayThreadsLoading] = useState(false);

  useEffect(() => {
    if (!selectedDay) { setDayThreads(null); return; }
    setDayThreadsLoading(true);
    const since = getSince(timeframe).toISOString();
    fetch(`${BACKEND_URL}/api/admin/llm-usage?since=${since}&day=${selectedDay}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setDayThreads(d.threads); })
      .catch(() => {})
      .finally(() => setDayThreadsLoading(false));
  }, [selectedDay, timeframe]);

  const sortedThreads = useMemo(() => {
    const threads = dayThreads ?? data?.threads ?? [];
    const sorted = [...threads];
    if (threadSort === 'newest') sorted.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
    return sorted;
  }, [dayThreads, data, threadSort]);

  const pagedThreads = useMemo(() => {
    const start = threadPage * THREADS_PER_PAGE;
    return sortedThreads.slice(start, start + THREADS_PER_PAGE);
  }, [sortedThreads, threadPage]);

  const totalThreadPages = Math.ceil((sortedThreads.length || 1) / THREADS_PER_PAGE);

  const c = (dv, lv) => dark ? dv : lv;
  const tfLabel = TIMEFRAMES.find(t => t.value === timeframe)?.label || 'This month';

  if (loading) return <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}><p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p></div>;
  if (!data) return <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}><p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Failed to load usage data.</p></div>;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-[1000px] mx-auto flex flex-col gap-5">
        {/* Header + Timeframe */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${c('text-white', 'text-[#1A1A1A]')}`}>LLM Usage</h1>
            <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>All DragonBots combined</p>
          </div>
          <Dropdown dark={dark} label={tfLabel} open={tfOpen} setOpen={setTfOpen}
            items={TIMEFRAMES.map(t => ({ label: t.label, onClick: () => { setTimeframe(t.value); setTfOpen(false); } }))} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox dark={dark} label="Total Spend" value={formatCredits(data.totalCredits)} />
          <StatBox dark={dark} label="Today" value={formatCredits(data.todayCredits)} />
          <StatBox dark={dark} label="Avg / Day" value={formatCredits(data.avgPerDay)} />
        </div>

        {/* Daily Spend Chart */}
        <div className={`rounded-xl ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
          <div className="flex items-center justify-between p-5 pb-0">
            <p className={`text-[11px] font-medium ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>Daily Spend</p>
            <div className={`flex gap-4 text-[11px] ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[#2F7D4F]" />
                <span>One-off tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-[2px] ${c('bg-[#4a6741]', 'bg-[#a3d99c]')}`} />
                <span>Scheduled tasks</span>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 pt-3">
            {(() => {
              const yTicks = [0, Math.round(maxDayCredits / 2), Math.round(maxDayCredits)];
              const formatTick = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
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
                        style={{ bottom: `${(tick / maxDayCredits) * 100}%` }} />
                    ))}
                    {data.byDay.map((day) => {
                      const oneOff = day.oneOffCredits || 0;
                      const scheduled = day.scheduledCredits || 0;
                      const total = oneOff + scheduled;
                      const pctOneOff = total > 0 ? (oneOff / maxDayCredits) * 100 : 0;
                      const pctScheduled = total > 0 ? (scheduled / maxDayCredits) * 100 : 0;
                      const isSelected = selectedDay === day.date;
                      return (
                        <div key={day.date}
                          onClick={() => { setSelectedDay(prev => prev === day.date ? null : day.date); setThreadPage(0); }}
                          className={`flex-1 flex flex-col justify-end group relative h-full z-10 cursor-pointer transition-opacity ${selectedDay && !isSelected ? 'opacity-30' : ''}`}>
                          <div className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] px-2.5 py-2 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg ${c('bg-[#333] text-white', 'bg-gray-800 text-white')}`} style={{ zIndex: 100 }}>
                            <div className="font-medium mb-0.5">{formatDate(day.date)}</div>
                            <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-[2px] bg-[#2F7D4F]" />One-off: {oneOff.toLocaleString(undefined, { maximumFractionDigits: 0 })} credits</div>
                            <div className="flex items-center gap-1.5"><span className={`inline-block h-2 w-2 rounded-[2px] ${c('bg-[#4a6741]', 'bg-[#a3d99c]')}`} />Scheduled: {scheduled.toLocaleString(undefined, { maximumFractionDigits: 0 })} credits</div>
                            <div className={`mt-0.5 pt-0.5 border-t ${c('border-white/20', 'border-white/20')} font-medium`}>Total: {total.toLocaleString(undefined, { maximumFractionDigits: 0 })} credits</div>
                          </div>
                          {pctOneOff > 0 && (
                            <div className="w-full bg-[#2F7D4F] rounded-t-[2px]" style={{ height: `${Math.max(pctOneOff, 1)}%` }} />
                          )}
                          {pctScheduled > 0 && (
                            <div className={`w-full ${c('bg-[#4a6741]', 'bg-[#a3d99c]')} ${pctOneOff === 0 ? 'rounded-t-[2px]' : ''}`} style={{ height: `${Math.max(pctScheduled, 1)}%` }} />
                          )}
                          {total === 0 && (
                            <div className={`w-full rounded-t-[2px] ${c('bg-white/5', 'bg-gray-100')}`} style={{ height: '1px' }} />
                          )}
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

        {/* Threads Table */}
        <div className={`rounded-xl overflow-hidden ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
          <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-2">
              <p className={`text-[11px] font-medium ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>Breakdown by caller</p>
              {selectedDay && (
                <button
                  onClick={() => setSelectedDay(null)}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${c('bg-[#2F7D4F]/15 text-[#2F7D4F] hover:bg-[#2F7D4F]/25', 'bg-[#2F7D4F]/10 text-[#2F7D4F] hover:bg-[#2F7D4F]/20')}`}
                >
                  {formatDate(selectedDay)} <span className="text-[9px]">✕</span>
                </button>
              )}
            </div>
            <Dropdown dark={dark} label={THREAD_SORTS.find(s => s.value === threadSort)?.label} open={tsOpen} setOpen={setTsOpen}
              items={THREAD_SORTS.map(s => ({ label: s.label, onClick: () => { setThreadSort(s.value); setTsOpen(false); setThreadPage(0); } }))} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${c('border-white/5', 'border-gray-100')}`}>
                  <th className={`text-[11px] font-medium py-2 px-5 text-left ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Bot</th>
                  <th className={`text-[11px] font-medium py-2 px-2 text-left ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Title</th>
                  <th className={`text-[11px] font-medium py-2 px-2 text-left ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Created</th>
                  <th className={`text-[11px] font-medium py-2 px-5 text-right ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Credits</th>
                </tr>
              </thead>
              <tbody>
                {dayThreadsLoading ? (
                  <tr><td colSpan={4} className={`py-6 px-5 text-center text-sm ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>Loading...</td></tr>
                ) : pagedThreads.length === 0 ? (
                  <tr><td colSpan={4} className={`py-6 px-5 text-center text-sm ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>No threads yet.</td></tr>
                ) : pagedThreads.map((t, i) => (
                  <tr key={i} className={`border-b last:border-0 ${c('border-white/5 hover:bg-white/[0.02]', 'border-gray-50 hover:bg-gray-50/50')}`}>
                    <td className={`py-2.5 px-5 max-w-[160px] truncate ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
                      {t.botName || (t.dragonBotId ? t.dragonBotId.slice(0, 8) : '—')}
                    </td>
                    <td className={`py-2.5 px-2 max-w-[300px] truncate ${c('text-white', 'text-[#1A1A1A]')}`}>
                      {sessionTagToTitle(t.sessionTag)}
                    </td>
                    <td className={`py-2.5 px-2 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
                      {formatDate(t.firstSeen)}
                    </td>
                    <td className={`py-2.5 px-5 text-right font-medium ${c('text-white', 'text-[#1A1A1A]')}`}>
                      {Math.round(t.credits).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`flex items-center justify-between p-5 pt-3 text-xs ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
            <button onClick={() => setThreadPage(p => Math.max(0, p - 1))} disabled={threadPage === 0}
              className={`px-3 py-1.5 rounded-md border ${c('border-white/10 hover:bg-white/5 disabled:opacity-30', 'border-gray-200 hover:bg-gray-50 disabled:opacity-30')}`}>
              Prev
            </button>
            {totalThreadPages > 1 && <span>Page {threadPage + 1} of {totalThreadPages}</span>}
            <button onClick={() => setThreadPage(p => Math.min(totalThreadPages - 1, p + 1))} disabled={threadPage >= totalThreadPages - 1}
              className={`px-3 py-1.5 rounded-md border ${c('border-white/10 hover:bg-white/5 disabled:opacity-30', 'border-gray-200 hover:bg-gray-50 disabled:opacity-30')}`}>
              Next
            </button>
          </div>
        </div>

        {/* Recent Calls */}
        <div className={`rounded-xl overflow-hidden ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
          <div className="p-5 pb-0">
            <p className={`text-[11px] font-medium ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>Recent Calls</p>
          </div>
          <div className="max-h-80 overflow-y-auto p-5 pt-3">
            {data.recentLogs.length === 0 ? (
              <p className={`text-sm ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>No calls yet.</p>
            ) : (
              <div className="space-y-1">
                {data.recentLogs.map((log, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${c('hover:bg-white/5', 'hover:bg-gray-50')}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.success ? 'bg-[#2F7D4F]' : 'bg-red-400'}`} />
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${c('bg-white/5 text-white/60', 'bg-gray-100 text-[#1A1A1A]/60')}`}>
                        {log.botName || (log.dragonBotId ? log.dragonBotId.slice(0, 8) : '—')}
                      </span>
                      <code className={`font-mono text-xs truncate ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>{log.tool}</code>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                      {log.creditCount > 0 && (
                        <span className="tabular-nums text-[#2F7D4F] font-medium">{log.creditCount.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                      )}
                      {log.latencyMs && (
                        <span className={`tabular-nums ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>{log.latencyMs}ms</span>
                      )}
                      <span className={`tabular-nums ${c('text-white/20', 'text-[#1A1A1A]/20')}`}>
                        {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
