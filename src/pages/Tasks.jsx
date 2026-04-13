import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Play, Pause, Calendar, Timer, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

function cronToHuman(expr) {
  if (!expr) return '—';
  if (expr.startsWith('every ')) return expr;
  const parts = expr.split(' ');
  if (parts.length < 5) return expr;
  const [min, hour, , , dow] = parts;

  const dowNames = { '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun' };

  if (dow !== '*' && hour !== '*') {
    const days = dow.split(',').map(d => dowNames[d] || d).join(', ');
    const hours = hour.split(',').map(h => `${h}:${min.padStart(2, '0')}`).join(', ');
    return `${days} at ${hours} UTC`;
  }
  if (hour.includes(',')) {
    const hours = hour.split(',').map(h => `${h}:${min.padStart(2, '0')}`).join(', ');
    return `Daily at ${hours} UTC`;
  }
  if (hour !== '*') {
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

function formatDuration(ms) {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function formatTs(ts) {
  if (!ts) return '—';
  try {
    return new Date(typeof ts === 'number' ? ts : ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch { return '—'; }
}

export default function Tasks({ dark }) {
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Derive selected job/run from URL params
  const jobParam = searchParams.get('job');
  const runParam = searchParams.get('run'); // run timestamp

  const selectedJob = jobParam && data
    ? data.jobs.find(j => j.id === jobParam) || null
    : null;

  const selectedRun = runParam && data
    ? data.runs.find(r => String(r.ts) === runParam) || null
    : null;

  const selectJob = useCallback((job) => {
    setSearchParams(job ? { job: job.id } : {});
  }, [setSearchParams]);

  const selectRun = useCallback((run) => {
    setSearchParams(run ? { run: String(run.ts) } : {});
  }, [setSearchParams]);

  const closeModal = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const c = (dv, lv) => dark ? dv : lv;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className={`font-semibold text-2xl ${c('text-white', 'text-[#1A1A1A]')}`}>Scheduled Tasks</h1>
          <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
            Cron jobs and heartbeat running on your DragonBot
          </p>
        </div>

        {loading ? (
          <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
        ) : !data ? (
          <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Failed to load tasks.</p>
        ) : data.jobs.length === 0 ? (
          <div className={`rounded-2xl border p-8 text-center ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
            <Clock size={40} className={`mx-auto mb-4 ${c('text-white/20', 'text-[#1A1A1A]/20')}`} />
            <h2 className={`font-semibold text-lg mb-2 ${c('text-white', 'text-[#1A1A1A]')}`}>
              No scheduled tasks yet
            </h2>
            <p className={`text-sm max-w-md mx-auto ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              DragonBot can run tasks on a schedule — like daily reports, inventory checks, or review monitoring.
              Ask DragonBot in Slack to set up a recurring task and it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.jobs.map((job, i) => (
              <JobCard key={job.id || i} job={job} dark={dark} onClick={() => selectJob(job)} />
            ))}
          </div>
        )}

        {/* Recent runs */}
        {data?.runs?.length > 0 && (
          <div className="mt-8">
            <h2 className={`text-sm font-medium mb-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
              Recent Runs
            </h2>
            <div className={`rounded-2xl border p-4 ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {data.runs.map((run, i) => (
                  <button key={i} onClick={() => selectRun(run)} className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-sm text-left ${c('hover:bg-white/5', 'hover:bg-gray-50')}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${run.status === 'ok' ? 'bg-[#2F7D4F]' : 'bg-red-400'}`} />
                      <span className={`truncate ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>{run.jobId || 'Unknown'}</span>
                      {run.durationMs && (
                        <span className={c('text-white/30', 'text-[#1A1A1A]/30')}>{formatDuration(run.durationMs)}</span>
                      )}
                    </div>
                    <span className={`tabular-nums flex-shrink-0 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                      {run.ts ? timeAgo(new Date(run.ts).toISOString()) : '—'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task detail popup */}
      {selectedJob && !selectedRun && (
        <TaskDetailPopup job={selectedJob} runs={data?.runs || []} dark={dark} onClose={closeModal} onSelectRun={selectRun} />
      )}

      {/* Run detail popup */}
      {selectedRun && (
        <RunDetailPopup run={selectedRun} dark={dark} onClose={closeModal} />
      )}
    </div>
  );
}

function JobCard({ job, dark, onClick }) {
  const c = (dv, lv) => dark ? dv : lv;
  const enabled = job.enabled !== false;
  const isNative = job.native === true;
  const schedule = job.schedule?.kind === 'interval'
    ? job.schedule.expr
    : job.schedule?.expr || job.schedule || job.cron || '';
  const lastRun = job.lastRun;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-5 transition-colors ${c('bg-[#1a1a1a] border-white/10 hover:border-white/20', 'bg-white border-gray-200 hover:border-gray-300')}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${enabled ? 'bg-[#2F7D4F]/10' : c('bg-white/5', 'bg-gray-100')}`}>
            {enabled
              ? <Play size={16} className="text-[#2F7D4F]" />
              : <Pause size={16} className={c('text-white/30', 'text-[#1A1A1A]/30')} />
            }
          </div>
          <div>
            <h3 className={`font-medium text-base ${c('text-white', 'text-[#1A1A1A]')}`}>
              {job.name || job.id || 'Unnamed Task'}
            </h3>
            {job.id && job.id !== (job.name || '').toLowerCase().replace(/\s+/g, '_') && job.id !== job.name && (
              <code className={`text-sm ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>{job.id}</code>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isNative && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${c('bg-white/5 text-white/30', 'bg-gray-100 text-gray-400')}`}>
              Native
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full ${
            enabled
              ? 'bg-[#2F7D4F]/10 text-[#2F7D4F]'
              : c('bg-white/5 text-white/30', 'bg-gray-100 text-gray-400')
          }`}>
            {enabled ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>

      <div className={`flex items-center gap-4 text-sm ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>
        <div className="flex items-center gap-1.5">
          <Calendar size={14} />
          <span>{cronToHuman(schedule)}</span>
        </div>
        {schedule && !schedule.startsWith('every ') && (
          <div className="flex items-center gap-1.5">
            <Timer size={14} />
            <code className={c('text-white/30', 'text-[#1A1A1A]/30')}>{schedule}</code>
          </div>
        )}
      </div>

      {lastRun && (
        <div className={`mt-3 flex items-center gap-2 text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${lastRun.status === 'ok' ? 'bg-[#2F7D4F]' : 'bg-red-400'}`} />
          <span>Last run: {timeAgo(new Date(lastRun.ts).toISOString())}</span>
          {lastRun.durationMs && <span>({formatDuration(lastRun.durationMs)})</span>}
        </div>
      )}

      {!lastRun && job.payload?.message && (
        <p className={`mt-3 text-sm leading-relaxed line-clamp-2 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
          {job.payload.message.slice(0, 200)}{job.payload.message.length > 200 ? '...' : ''}
        </p>
      )}
    </button>
  );
}

function TaskDetailPopup({ job, runs, dark, onClose, onSelectRun }) {
  const c = (dv, lv) => dark ? dv : lv;
  const enabled = job.enabled !== false;
  const isNative = job.native === true;
  const schedule = job.schedule?.kind === 'interval'
    ? job.schedule.expr
    : job.schedule?.expr || job.schedule || job.cron || '';

  // Filter runs for this job
  const jobRuns = runs
    .filter(r => r.jobId === job.id)
    .slice(0, 30);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${enabled ? 'bg-[#2F7D4F]/10' : c('bg-white/5', 'bg-gray-100')}`}>
              {enabled ? <Play size={16} className="text-[#2F7D4F]" /> : <Pause size={16} className={c('text-white/30', 'text-[#1A1A1A]/30')} />}
            </div>
            <div>
              <h2 className={`font-semibold text-lg ${c('text-white', 'text-[#1A1A1A]')}`}>
                {job.name || job.id}
              </h2>
              <div className={`flex items-center gap-2 text-xs ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
                <Calendar size={12} />
                <span>{cronToHuman(schedule)}</span>
                {isNative && <span className={`px-1.5 py-0.5 rounded ${c('bg-white/5', 'bg-gray-100')}`}>Native</span>}
                <span className={`px-1.5 py-0.5 rounded ${enabled ? 'bg-[#2F7D4F]/10 text-[#2F7D4F]' : c('bg-white/5', 'bg-gray-100')}`}>
                  {enabled ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${c('hover:bg-white/10', 'hover:bg-gray-100')}`}>
            <X size={16} className={c('text-white/50', 'text-[#1A1A1A]/50')} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Task description */}
          {job.payload?.message && (
            <div className={`mb-5 rounded-xl p-4 max-h-64 overflow-y-auto text-sm leading-relaxed prose prose-sm max-w-none ${c('bg-white/5 text-white/60 prose-invert prose-headings:text-white/70 prose-strong:text-white/70 prose-code:text-white/50 prose-li:text-white/60', 'bg-gray-50 text-[#1A1A1A]/60 prose-headings:text-[#1A1A1A]/70 prose-strong:text-[#1A1A1A]/70 prose-code:text-[#1A1A1A]/50 prose-li:text-[#1A1A1A]/60')}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.payload.message}</ReactMarkdown>
            </div>
          )}

          {/* Run history */}
          <h3 className={`text-xs font-medium uppercase tracking-wider mb-3 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
            Run History ({jobRuns.length})
          </h3>

          {jobRuns.length === 0 ? (
            <p className={`text-sm ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>No runs recorded yet.</p>
          ) : (
            <div className="space-y-1">
              {jobRuns.map((run, i) => (
                <button key={i} onClick={() => onSelectRun(run)} className={`w-full text-left flex items-start gap-3 py-2.5 px-3 rounded-lg text-sm ${c('hover:bg-white/5', 'hover:bg-gray-50')}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${run.status === 'ok' ? 'bg-[#2F7D4F]' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={c('text-white/60', 'text-[#1A1A1A]/60')}>
                        {formatTs(run.ts)}
                      </span>
                      <div className={`flex items-center gap-2 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                        {run.durationMs && <span>{formatDuration(run.durationMs)}</span>}
                        <span className={run.status === 'ok' ? 'text-[#2F7D4F]' : 'text-red-400'}>{run.status}</span>
                      </div>
                    </div>
                    {run.summary && run.summary !== 'HEARTBEAT_OK' && (
                      <p className={`mt-1 text-xs leading-relaxed ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
                        {run.summary.slice(0, 300)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RunDetailPopup({ run, dark, onClose }) {
  const c = (dv, lv) => dark ? dv : lv;
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [memory, setMemory] = useState(null);
  const [loadingMemory, setLoadingMemory] = useState(false);

  useEffect(() => {
    if (!run.sessionId) return;
    setLoadingSession(true);
    fetch(`${BACKEND_URL}/api/tasks/session/${run.sessionId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(setSession)
      .catch(() => {})
      .finally(() => setLoadingSession(false));
  }, [run.sessionId]);

  // For heartbeat runs, fetch the memory file for the day the run occurred
  const isHeartbeat = run.jobId === 'heartbeat';
  const runDate = run.ts ? new Date(typeof run.ts === 'number' ? run.ts : run.ts).toISOString().slice(0, 10) : null;

  useEffect(() => {
    if (!isHeartbeat || !runDate) return;
    setLoadingMemory(true);
    fetch(`${BACKEND_URL}/api/tasks/memory/${runDate}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(setMemory)
      .catch(() => {})
      .finally(() => setLoadingMemory(false));
  }, [isHeartbeat, runDate]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h2 className={`font-semibold text-lg ${c('text-white', 'text-[#1A1A1A]')}`}>
              {run.jobId || 'Unknown'}
            </h2>
            <div className={`flex items-center gap-2 mt-1 text-xs ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              <span className={`w-2 h-2 rounded-full ${run.status === 'ok' ? 'bg-[#2F7D4F]' : 'bg-red-400'}`} />
              <span>{run.status === 'ok' ? 'Completed' : 'Failed'}</span>
              <span>&middot;</span>
              <span>{run.ts ? formatTs(run.ts) : '—'}</span>
              {run.durationMs && <><span>&middot;</span><span>{formatDuration(run.durationMs)}</span></>}
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${c('hover:bg-white/10', 'hover:bg-gray-100')}`}>
            <X size={16} className={c('text-white/50', 'text-[#1A1A1A]/50')} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {/* Metadata */}
          <div className={`rounded-xl p-3 mb-4 text-xs space-y-1.5 ${c('bg-white/5', 'bg-gray-50')}`}>
            {run.model && (
              <div className="flex justify-between">
                <span className={c('text-white/40', 'text-[#1A1A1A]/40')}>Model</span>
                <span className={c('text-white/60', 'text-[#1A1A1A]/60')}>{run.model}</span>
              </div>
            )}
            {run.usage?.total_tokens && (
              <div className="flex justify-between">
                <span className={c('text-white/40', 'text-[#1A1A1A]/40')}>Tokens</span>
                <span className={c('text-white/60', 'text-[#1A1A1A]/60')}>{run.usage.total_tokens.toLocaleString()}</span>
              </div>
            )}
            {run.nextRunAtMs && (
              <div className="flex justify-between">
                <span className={c('text-white/40', 'text-[#1A1A1A]/40')}>Next run</span>
                <span className={c('text-white/60', 'text-[#1A1A1A]/60')}>{formatTs(run.nextRunAtMs)}</span>
              </div>
            )}
          </div>

          {/* Summary */}
          {run.summary && (
            <div className="mb-4">
              <h3 className={`text-xs font-medium uppercase tracking-wider mb-2 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                Summary
              </h3>
              <div className={`rounded-xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${c('bg-white/5 text-white/60', 'bg-gray-50 text-[#1A1A1A]/60')}`}>
                {run.summary}
              </div>
            </div>
          )}

          {/* Memory notes for the day (heartbeat runs) */}
          {isHeartbeat && runDate && (
            <div className="mb-4">
              <h3 className={`text-xs font-medium uppercase tracking-wider mb-2 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                Memory — {runDate}
              </h3>
              {loadingMemory ? (
                <p className={`text-xs ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>Loading...</p>
              ) : memory?.content ? (
                <div className={`rounded-xl p-4 text-sm leading-relaxed prose prose-sm max-w-none overflow-y-auto max-h-96 ${c('bg-white/5 text-white/60 prose-invert prose-headings:text-white/70 prose-strong:text-white/70 prose-code:text-white/50', 'bg-gray-50 text-[#1A1A1A]/60 prose-headings:text-[#1A1A1A]/70 prose-strong:text-[#1A1A1A]/70 prose-code:text-[#1A1A1A]/50')}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{memory.content}</ReactMarkdown>
                </div>
              ) : (
                <p className={`text-xs ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>No memory file for this day.</p>
              )}
            </div>
          )}

          {/* Full session transcript */}
          {run.sessionId && (
            <div>
              <h3 className={`text-xs font-medium uppercase tracking-wider mb-2 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                Full Transcript
              </h3>
              {loadingSession ? (
                <p className={`text-xs ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>Loading session...</p>
              ) : session?.messages?.length > 0 ? (
                <div className="space-y-3">
                  {session.messages.map((msg, i) => (
                    <div key={i} className={`rounded-lg p-3 text-sm ${
                      msg.role === 'assistant'
                        ? c('bg-[#2F7D4F]/5 border border-[#2F7D4F]/10', 'bg-[#2F7D4F]/5 border border-[#2F7D4F]/10')
                        : c('bg-white/5', 'bg-gray-50')
                    }`}>
                      <div className={`flex items-center gap-2 mb-1 text-xs ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                        <span className="font-medium">{msg.role === 'assistant' ? 'DragonBot' : 'System'}</span>
                        <span>{formatTs(msg.timestamp)}</span>
                      </div>
                      <div className={`leading-relaxed whitespace-pre-wrap break-words ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
                        {msg.text.slice(0, 2000)}{msg.text.length > 2000 ? '...' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !loadingSession && (
                <p className={`text-xs ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                  {run.sessionId ? 'Session not found or empty.' : 'No session linked.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}