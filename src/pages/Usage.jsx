import { useState, useEffect, useMemo } from 'react';
import { BarChart3, AlertCircle, Clock, Zap } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.dragonsellerbot.com';

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
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const maxDayCalls = useMemo(() => {
    if (!data?.byDay) return 1;
    return Math.max(1, ...data.byDay.map((d) => d.calls));
  }, [data]);

  const c = (base, darkVal, lightVal) => dark ? darkVal : lightVal;

  return (
    <div className={`min-h-screen px-4 py-8 ${c('bg', 'bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`font-clash font-semibold text-2xl ${c('', 'text-white', 'text-[#1A1A1A]')}`}>Usage</h1>
            <p className={`text-sm font-satoshi ${c('', 'text-white/40', 'text-[#1A1A1A]/40')}`}>
              API calls and tool usage for your DragonBot
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
                    : c('', 'bg-white/5 text-white/50 hover:bg-white/10', 'bg-gray-100 text-gray-500 hover:bg-gray-200')
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className={`text-sm font-satoshi ${c('', 'text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
        ) : !data ? (
          <p className={`text-sm font-satoshi ${c('', 'text-white/40', 'text-[#1A1A1A]/40')}`}>Failed to load usage data.</p>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard dark={dark} icon={<Zap size={18} />} label="Total Calls" value={data.totalCalls.toLocaleString()} />
              <StatCard dark={dark} icon={<AlertCircle size={18} />} label="Errors" value={data.totalErrors.toLocaleString()} color={data.totalErrors > 0 ? '#ef4444' : undefined} />
              <StatCard dark={dark} icon={<Clock size={18} />} label="Avg Latency" value={avgLatency(toolRows)} />
            </div>

            {/* Activity chart */}
            <div className={`rounded-2xl border p-6 mb-8 ${c('', 'bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
              <h2 className={`text-sm font-satoshi font-medium mb-4 ${c('', 'text-white/60', 'text-[#1A1A1A]/60')}`}>
                Daily Activity
              </h2>
              {data.byDay.length === 0 ? (
                <p className={`text-sm font-satoshi ${c('', 'text-white/30', 'text-[#1A1A1A]/30')}`}>No activity yet.</p>
              ) : (
                <div className="flex items-end gap-[3px] h-32">
                  {data.byDay.map((day) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                      <div
                        className="w-full rounded-t-sm bg-[#2F7D4F] min-h-[2px] transition-all hover:bg-[#3a9960]"
                        style={{ height: `${(day.calls / maxDayCalls) * 100}%` }}
                        title={`${day.date}: ${day.calls} calls, ${day.errors} errors`}
                      />
                      {day.errors > 0 && (
                        <div
                          className="w-full bg-red-500/60 min-h-[1px]"
                          style={{ height: `${(day.errors / maxDayCalls) * 100}%` }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {data.byDay.length > 0 && (
                <div className="flex justify-between mt-2">
                  <span className={`text-[10px] font-satoshi ${c('', 'text-white/20', 'text-[#1A1A1A]/20')}`}>{data.byDay[0]?.date}</span>
                  <span className={`text-[10px] font-satoshi ${c('', 'text-white/20', 'text-[#1A1A1A]/20')}`}>{data.byDay[data.byDay.length - 1]?.date}</span>
                </div>
              )}
            </div>

            {/* By tool table */}
            <div className={`rounded-2xl border p-6 mb-8 ${c('', 'bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
              <h2 className={`text-sm font-satoshi font-medium mb-4 ${c('', 'text-white/60', 'text-[#1A1A1A]/60')}`}>
                <BarChart3 size={14} className="inline mr-2" />
                By Tool
              </h2>
              {toolRows.length === 0 ? (
                <p className={`text-sm font-satoshi ${c('', 'text-white/30', 'text-[#1A1A1A]/30')}`}>No tool calls yet.</p>
              ) : (
                <div className="space-y-2">
                  {toolRows.map((row) => (
                    <div key={row.tool} className={`flex items-center justify-between py-2 px-3 rounded-xl ${c('', 'hover:bg-white/5', 'hover:bg-gray-50')}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <code className={`text-xs font-mono truncate ${c('', 'text-white/80', 'text-[#1A1A1A]/80')}`}>{row.tool}</code>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className={`text-xs font-satoshi tabular-nums ${c('', 'text-white/50', 'text-[#1A1A1A]/50')}`}>
                          {row.count.toLocaleString()} calls
                        </span>
                        {row.errors > 0 && (
                          <span className="text-xs font-satoshi text-red-400 tabular-nums">{row.errors} err</span>
                        )}
                        <span className={`text-xs font-satoshi tabular-nums w-16 text-right ${c('', 'text-white/30', 'text-[#1A1A1A]/30')}`}>
                          {row.count > 0 ? `${Math.round(row.totalMs / row.count)}ms` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent logs */}
            <div className={`rounded-2xl border p-6 ${c('', 'bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
              <h2 className={`text-sm font-satoshi font-medium mb-4 ${c('', 'text-white/60', 'text-[#1A1A1A]/60')}`}>
                Recent Calls
              </h2>
              {data.recentLogs.length === 0 ? (
                <p className={`text-sm font-satoshi ${c('', 'text-white/30', 'text-[#1A1A1A]/30')}`}>No calls yet.</p>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {data.recentLogs.map((log, i) => (
                    <div key={i} className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-satoshi ${c('', 'hover:bg-white/5', 'hover:bg-gray-50')}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.success ? 'bg-[#2F7D4F]' : 'bg-red-400'}`} />
                        <code className={`font-mono truncate ${c('', 'text-white/70', 'text-[#1A1A1A]/70')}`}>{log.tool}</code>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {log.latencyMs && (
                          <span className={`tabular-nums ${c('', 'text-white/30', 'text-[#1A1A1A]/30')}`}>{log.latencyMs}ms</span>
                        )}
                        <span className={`tabular-nums ${c('', 'text-white/20', 'text-[#1A1A1A]/20')}`}>
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
      <div className={`text-xs font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>{label}</div>
    </div>
  );
}

function avgLatency(toolRows) {
  let total = 0, count = 0;
  for (const r of toolRows) {
    total += r.totalMs;
    count += r.count;
  }
  return count > 0 ? `${Math.round(total / count)}ms` : '—';
}