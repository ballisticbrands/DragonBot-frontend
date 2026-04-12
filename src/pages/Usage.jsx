import { useState, useEffect, useMemo } from 'react';
import { BarChart3, AlertCircle, Clock, Zap, Coins } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

export default function Usage({ dark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const res = await fetch(`${BACKEND_URL}/api/usage?since=${since}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Failed to load usage:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [days]);

  const toolRows = useMemo(() => {
    if (!data?.byTool) return [];
    return Object.entries(data.byTool)
      .map(([tool, stats]) => ({ tool, ...stats }))
      .sort((a, b) => (b.credits || 0) - (a.credits || 0) || b.count - a.count);
  }, [data]);

  const maxDayCredits = useMemo(() => {
    if (!data?.byDay) return 1;
    return Math.max(0.01, ...data.byDay.map((d) => d.credits || 0));
  }, [data]);

  const c = (dv, lv) => dark ? dv : lv;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`font-clash font-semibold text-2xl ${c('text-white', 'text-[#1A1A1A]')}`}>Usage</h1>
            <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              Credit usage and API activity
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-satoshi font-medium transition-colors ${
                  days === d
                    ? 'bg-[#2F7D4F] text-white'
                    : c('bg-white/5 text-white/50 hover:bg-white/10', 'bg-gray-100 text-gray-500 hover:bg-gray-200')
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
        ) : !data ? (
          <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Failed to load usage data.</p>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard dark={dark} icon={<Coins size={18} />} label="Credits Used" value={formatCredits(data.totalCredits)} color="#2F7D4F" />
              <StatCard dark={dark} icon={<Zap size={18} />} label="Total Calls" value={data.totalCalls.toLocaleString()} />
              <StatCard dark={dark} icon={<AlertCircle size={18} />} label="Errors" value={data.totalErrors.toLocaleString()} color={data.totalErrors > 0 ? '#ef4444' : undefined} />
              <StatCard dark={dark} icon={<Clock size={18} />} label="Avg Latency" value={avgLatency(toolRows)} />
            </div>

            {/* Daily credits chart */}
            <div className={`rounded-2xl border p-6 mb-8 ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
              <h2 className={`text-sm font-satoshi font-medium mb-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
                <Coins size={14} className="inline mr-2" />
                Daily Credit Usage
              </h2>
              {data.byDay.length === 0 ? (
                <p className={`text-sm font-satoshi ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>No activity yet.</p>
              ) : (
                <>
                  <div className="flex items-end gap-[3px] h-48">
                    {data.byDay.map((day) => {
                      const credits = day.credits || 0;
                      const pct = credits > 0 ? (credits / maxDayCredits) * 100 : 0;
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                          <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-satoshi whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 ${c('bg-white/10 text-white', 'bg-gray-800 text-white')}`}>
                            {day.date.slice(5)}: {credits.toLocaleString(undefined, { maximumFractionDigits: 1 })} credits ({day.calls} calls)
                          </div>
                          <div
                            className={`w-full rounded-t min-h-[1px] transition-all cursor-default ${credits > 0 ? 'bg-[#2F7D4F] hover:bg-[#3a9960]' : c('bg-white/5', 'bg-gray-100')}`}
                            style={{ height: credits > 0 ? `${Math.max(pct, 3)}%` : '1px' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className={`text-[10px] font-satoshi ${c('text-white/20', 'text-[#1A1A1A]/20')}`}>{data.byDay[0]?.date}</span>
                    <span className={`text-[10px] font-satoshi ${c('text-white/20', 'text-[#1A1A1A]/20')}`}>{data.byDay[data.byDay.length - 1]?.date}</span>
                  </div>
                </>
              )}
            </div>

            {/* By tool table */}
            <div className={`rounded-2xl border p-6 mb-8 ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
              <h2 className={`text-sm font-satoshi font-medium mb-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
                <BarChart3 size={14} className="inline mr-2" />
                By Tool
              </h2>
              {toolRows.length === 0 ? (
                <p className={`text-sm font-satoshi ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>No tool calls yet.</p>
              ) : (
                <div className="space-y-2">
                  {toolRows.map((row) => (
                    <div key={row.tool} className={`flex items-center justify-between py-2 px-3 rounded-xl ${c('hover:bg-white/5', 'hover:bg-gray-50')}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <code className={`text-sm font-mono truncate ${c('text-white/80', 'text-[#1A1A1A]/80')}`}>{row.tool}</code>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {row.credits > 0 && (
                          <span className="text-sm font-satoshi text-[#2F7D4F] tabular-nums font-medium">
                            {row.credits.toLocaleString(undefined, { maximumFractionDigits: 1 })} cr
                          </span>
                        )}
                        <span className={`text-sm font-satoshi tabular-nums ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>
                          {row.count.toLocaleString()} calls
                        </span>
                        {row.errors > 0 && (
                          <span className="text-sm font-satoshi text-red-400 tabular-nums">{row.errors} err</span>
                        )}
                        <span className={`text-sm font-satoshi tabular-nums w-16 text-right ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                          {row.count > 0 ? `${Math.round(row.totalMs / row.count)}ms` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent logs */}
            <div className={`rounded-2xl border p-6 ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
              <h2 className={`text-sm font-satoshi font-medium mb-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
                Recent Calls
              </h2>
              {data.recentLogs.length === 0 ? (
                <p className={`text-sm font-satoshi ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>No calls yet.</p>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {data.recentLogs.map((log, i) => (
                    <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm font-satoshi ${c('hover:bg-white/5', 'hover:bg-gray-50')}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.success ? 'bg-[#2F7D4F]' : 'bg-red-400'}`} />
                        <code className={`font-mono truncate ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>{log.tool}</code>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {log.creditCount > 0 && (
                          <span className="tabular-nums text-[#2F7D4F]">{log.creditCount.toLocaleString(undefined, { maximumFractionDigits: 1 })} cr</span>
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
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ dark, icon, label, value, color }) {
  const c = (dv, lv) => dark ? dv : lv;
  return (
    <div className={`rounded-2xl border p-5 ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
      <div className={`mb-2 ${color ? '' : c('text-white/40', 'text-[#1A1A1A]/40')}`} style={color ? { color } : undefined}>
        {icon}
      </div>
      <div className={`text-2xl font-clash font-semibold mb-1 ${c('text-white', 'text-[#1A1A1A]')}`} style={color ? { color } : undefined}>
        {value}
      </div>
      <div className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>{label}</div>
    </div>
  );
}

function formatCredits(n) {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function avgLatency(toolRows) {
  let total = 0, count = 0;
  for (const r of toolRows) {
    total += r.totalMs || 0;
    count += r.count || 0;
  }
  return count > 0 ? `${Math.round(total / count)}ms` : '—';
}