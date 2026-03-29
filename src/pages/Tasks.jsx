import { useState, useEffect } from 'react';
import { Clock, Play, Pause, Calendar, Timer } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.dragonsellerbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

function cronToHuman(expr) {
  if (!expr) return '—';
  const parts = expr.split(' ');
  if (parts.length < 5) return expr;
  const [min, hour, dom, mon, dow] = parts;

  const dowNames = { '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun' };

  // Common patterns
  if (dow !== '*' && hour !== '*') {
    const days = dow.split(',').map(d => dowNames[d] || d).join(', ');
    const hours = hour.split(',').map(h => `${h}:${min.padStart(2, '0')}`).join(', ');
    return `${days} at ${hours} UTC`;
  }
  if (hour.includes(',')) {
    const hours = hour.split(',').map(h => `${h}:${min.padStart(2, '0')}`).join(', ');
    return `Daily at ${hours} UTC`;
  }
  if (hour !== '*' && dom === '*') {
    return `Daily at ${hour}:${min.padStart(2, '0')} UTC`;
  }
  return expr;
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Tasks({ dark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const c = (dv, lv) => dark ? dv : lv;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`font-clash font-semibold text-2xl ${c('text-white', 'text-[#1A1A1A]')}`}>Scheduled Tasks</h1>
          <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
            Cron jobs running on your DragonBot
          </p>
        </div>

        {loading ? (
          <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
        ) : !data ? (
          <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Failed to load tasks.</p>
        ) : data.jobs.length === 0 ? (
          <div className={`rounded-2xl border p-8 text-center ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
            <Clock size={40} className={`mx-auto mb-4 ${c('text-white/20', 'text-[#1A1A1A]/20')}`} />
            <h2 className={`font-clash font-semibold text-lg mb-2 ${c('text-white', 'text-[#1A1A1A]')}`}>
              No scheduled tasks yet
            </h2>
            <p className={`text-sm font-satoshi max-w-md mx-auto ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              DragonBot can run tasks on a schedule — like daily reports, inventory checks, or review monitoring.
              Ask DragonBot in Slack to set up a recurring task and it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.jobs.map((job, i) => (
              <JobCard key={job.id || i} job={job} dark={dark} />
            ))}
          </div>
        )}

        {/* Recent runs */}
        {data?.runs?.length > 0 && (
          <div className="mt-8">
            <h2 className={`text-sm font-satoshi font-medium mb-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
              Recent Runs
            </h2>
            <div className={`rounded-2xl border p-4 ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {data.runs.map((run, i) => (
                  <div key={i} className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-satoshi ${c('hover:bg-white/5', 'hover:bg-gray-50')}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${run.success !== false ? 'bg-[#2F7D4F]' : 'bg-red-400'}`} />
                      <span className={c('text-white/70', 'text-[#1A1A1A]/70')}>{run.name || run.id || 'Unknown'}</span>
                    </div>
                    <span className={`tabular-nums ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                      {timeAgo(run.startedAt || run.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, dark }) {
  const c = (dv, lv) => dark ? dv : lv;
  const enabled = job.enabled !== false;
  const schedule = job.schedule?.expr || job.schedule || job.cron || '';

  return (
    <div className={`rounded-2xl border p-5 transition-colors ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${enabled ? 'bg-[#2F7D4F]/10' : c('bg-white/5', 'bg-gray-100')}`}>
            {enabled
              ? <Play size={16} className="text-[#2F7D4F]" />
              : <Pause size={16} className={c('text-white/30', 'text-[#1A1A1A]/30')} />
            }
          </div>
          <div>
            <h3 className={`font-satoshi font-medium ${c('text-white', 'text-[#1A1A1A]')}`}>
              {job.name || job.id || 'Unnamed Task'}
            </h3>
            {job.id && job.id !== job.name && (
              <code className={`text-xs ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>{job.id}</code>
            )}
          </div>
        </div>
        <span className={`text-xs font-satoshi px-2.5 py-1 rounded-full ${
          enabled
            ? 'bg-[#2F7D4F]/10 text-[#2F7D4F]'
            : c('bg-white/5 text-white/30', 'bg-gray-100 text-gray-400')
        }`}>
          {enabled ? 'Active' : 'Paused'}
        </span>
      </div>

      {/* Schedule */}
      <div className={`flex items-center gap-4 text-xs font-satoshi ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} />
          <span>{cronToHuman(schedule)}</span>
        </div>
        {schedule && (
          <div className="flex items-center gap-1.5">
            <Timer size={12} />
            <code className={c('text-white/30', 'text-[#1A1A1A]/30')}>{schedule}</code>
          </div>
        )}
      </div>

      {/* Description */}
      {job.payload?.message && (
        <p className={`mt-3 text-xs font-satoshi leading-relaxed line-clamp-2 ${c('text-white/35', 'text-[#1A1A1A]/35')}`}>
          {job.payload.message.slice(0, 200)}{job.payload.message.length > 200 ? '...' : ''}
        </p>
      )}
    </div>
  );
}