import { useState, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

// Distinct, color-blind-friendly palette. Heaviest-spend models get the
// first colors so the dominant stacks stay visually consistent.
const MODEL_COLORS = [
  '#2F7D4F', '#4a90e2', '#f5a623', '#bd10e0', '#50e3c2',
  '#e94e77', '#9013fe', '#7ed321', '#ff7043', '#00bcd4',
];
const FALLBACK_COLOR = '#888';

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

function formatCredits(n) {
  if (n == null || n === 0) return '0 credits';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k credits`;
  return `${Math.round(n).toLocaleString()} credits`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function LlmUsage({ dark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [tfOpen, setTfOpen] = useState(false);

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
  }, [timeframe]);

  const maxDayCredits = useMemo(() => {
    if (!data?.byDay) return 1;
    return Math.max(0.01, ...data.byDay.map((d) => d.credits || 0));
  }, [data]);

  const maxDayModelCredits = useMemo(() => {
    if (!data?.byDayModel) return 1;
    return Math.max(0.01, ...data.byDayModel.map((d) => d.total || 0));
  }, [data]);

  // Map model name → palette color, ranked by total credits.
  const modelColorMap = useMemo(() => {
    const map = {};
    (data?.models || []).forEach((m, i) => {
      map[m.model] = MODEL_COLORS[i % MODEL_COLORS.length];
    });
    return map;
  }, [data]);

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
                      return (
                        <div key={day.date}
                          className="flex-1 flex flex-col justify-end group relative h-full z-10">
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

        {/* Daily Spend by Model */}
        <div className={`rounded-xl ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
          <div className="flex items-center justify-between p-5 pb-0 gap-4">
            <p className={`text-[11px] font-medium ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>Daily Spend by Model</p>
            <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[11px] justify-end ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              {data.models?.map((m) => (
                <div key={m.model} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: modelColorMap[m.model] || FALLBACK_COLOR }} />
                  <span className="font-mono text-[10px]">{m.model}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-5 pb-5 pt-3">
            {(() => {
              const yTicks = [0, Math.round(maxDayModelCredits / 2), Math.round(maxDayModelCredits)];
              const formatTick = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
              const orderedModels = (data.models || []).map((m) => m.model);
              return (
                <div className="flex gap-2">
                  {/* Y axis labels */}
                  <div className="flex flex-col justify-between h-40 flex-shrink-0 py-0.5">
                    {[...yTicks].reverse().map((tick, i) => (
                      <span key={i} className={`text-[10px] tabular-nums text-right w-8 ${c('text-white/25', 'text-[#1A1A1A]/25')}`}>
                        {formatTick(tick)}
                      </span>
                    ))}
                  </div>
                  {/* Bars */}
                  <div className="flex gap-[2px] h-40 flex-1 relative overflow-visible">
                    {yTicks.map((tick, i) => (
                      <div key={i} className={`absolute left-0 right-0 border-t ${c('border-white/5', 'border-gray-100')}`}
                        style={{ bottom: `${(tick / maxDayModelCredits) * 100}%` }} />
                    ))}
                    {data.byDayModel?.map((day) => {
                      // Stack heaviest model first (at bottom) using the global ordering.
                      const stack = orderedModels
                        .map((model) => ({ model, credits: day.credits[model] || 0 }))
                        .filter((s) => s.credits > 0);
                      const total = day.total || 0;
                      return (
                        <div key={day.date} className="flex-1 flex flex-col justify-end group relative h-full z-10">
                          <div className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] px-2.5 py-2 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg ${c('bg-[#333] text-white', 'bg-gray-800 text-white')}`} style={{ zIndex: 100 }}>
                            <div className="font-medium mb-0.5">{formatDate(day.date)}</div>
                            {stack.map((s) => (
                              <div key={s.model} className="flex items-center gap-1.5">
                                <span className="inline-block h-2 w-2 rounded-[2px]" style={{ backgroundColor: modelColorMap[s.model] || FALLBACK_COLOR }} />
                                <span className="font-mono text-[9px]">{s.model}</span>: {s.credits.toLocaleString(undefined, { maximumFractionDigits: 0 })} credits
                              </div>
                            ))}
                            <div className={`mt-0.5 pt-0.5 border-t ${c('border-white/20', 'border-white/20')} font-medium`}>Total: {total.toLocaleString(undefined, { maximumFractionDigits: 0 })} credits</div>
                          </div>
                          {stack.map((s, idx) => {
                            const pct = (s.credits / maxDayModelCredits) * 100;
                            // Round only the topmost stack to keep edges crisp.
                            const isTop = idx === stack.length - 1;
                            return (
                              <div
                                key={s.model}
                                className={`w-full ${isTop ? 'rounded-t-[2px]' : ''}`}
                                style={{ height: `${Math.max(pct, 1)}%`, backgroundColor: modelColorMap[s.model] || FALLBACK_COLOR }}
                              />
                            );
                          })}
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
            {data.byDayModel?.length > 0 && (
              <div className="flex justify-between mt-2 ml-10">
                <span className={`text-[10px] ${c('text-white/20', 'text-[#1A1A1A]/20')}`}>{data.byDayModel[0]?.date}</span>
                <span className={`text-[10px] ${c('text-white/20', 'text-[#1A1A1A]/20')}`}>{data.byDayModel[data.byDayModel.length - 1]?.date}</span>
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
