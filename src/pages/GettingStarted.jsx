import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Search } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.dragonsellerbot.com';

const STEPS = ['add-to-slack', 'select-channels', 'complete'];

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

function StepIndicator({ currentStep, dark }) {
  const currentIdx = STEPS.indexOf(currentStep);
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            i <= currentIdx
              ? 'bg-[#2F7D4F]'
              : dark
                ? 'bg-white/15'
                : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

function AddToSlack({ dark }) {
  const token = getToken();
  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
        <img src="/logos/dragonbot_fire.png" alt="" className="w-10 h-10" />
      </div>
      <h1 className={`font-clash font-semibold text-2xl mb-3 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        Add DragonBot to your Slack workspace
      </h1>
      <p className={`text-sm font-satoshi mb-8 leading-relaxed max-w-md mx-auto ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
        DragonBot needs access to your Slack workspace to read and respond to messages in the channels you choose. We only request the minimum permissions needed.
      </p>
      <a
        href={`${BACKEND_URL}/api/slack/install?token=${encodeURIComponent(token)}`}
        className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-satoshi font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20"
      >
        Add to Slack
      </a>
    </div>
  );
}

function SelectChannels({ dark, onComplete }) {
  const [channels, setChannels] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/slack/channels`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error('Failed to load channels');
        const data = await res.json();
        setChannels(Array.isArray(data) ? data : data.channels ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return channels;
    const q = search.toLowerCase();
    return channels.filter((c) => (c.name ?? c.id ?? '').toLowerCase().includes(q));
  }, [channels, search]);

  const toggleChannel = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function selectAll() {
    setSelected(new Set(channels.map((c) => c.id)));
  }

  async function handleContinue() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/slack/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ channels: [...selected] }),
      });
      if (!res.ok) throw new Error('Failed to save channels');
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="text-center">
      <h1 className={`font-clash font-semibold text-2xl mb-3 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        Choose where DragonBot should listen
      </h1>
      <p className={`text-sm font-satoshi mb-6 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
        Select the Slack channels DragonBot should monitor and respond in.
      </p>

      <button
        onClick={selectAll}
        className={`mb-4 px-4 py-2 rounded-xl text-sm font-satoshi font-medium transition-colors border ${
          dark
            ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            : 'bg-white border-gray-200 text-[#1A1A1A] hover:bg-gray-50'
        }`}
      >
        Invite DragonBot to all public channels
      </button>

      {/* Search */}
      <div className={`relative mb-3 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/40'}`}>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channels..."
          className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-sm font-satoshi outline-none border transition-colors ${
            dark
              ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#4ADE80]/50'
              : 'bg-gray-50 border-gray-200 text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#2F7D4F]/50'
          }`}
        />
      </div>

      {/* Channel list */}
      <div className={`max-h-60 overflow-y-auto rounded-xl border mb-4 text-left ${dark ? 'border-white/10' : 'border-gray-200'}`}>
        {loading && (
          <p className={`p-4 text-sm font-satoshi ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>Loading channels...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className={`p-4 text-sm font-satoshi ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>No channels found</p>
        )}
        {filtered.map((ch) => {
          const isSelected = selected.has(ch.id);
          return (
            <button
              key={ch.id}
              onClick={() => toggleChannel(ch.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-satoshi transition-colors ${
                dark
                  ? `hover:bg-white/5 ${isSelected ? 'bg-white/5' : ''}`
                  : `hover:bg-gray-50 ${isSelected ? 'bg-gray-50' : ''}`
              }`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                isSelected
                  ? 'bg-[#2F7D4F] border-[#2F7D4F]'
                  : dark
                    ? 'border-white/20'
                    : 'border-gray-300'
              }`}>
                {isSelected && <Check size={12} className="text-white" />}
              </div>
              <span className={dark ? 'text-white/80' : 'text-[#1A1A1A]/80'}>#{ch.name ?? ch.id}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm font-satoshi text-red-500 mb-3">{error}</p>}

      <button
        onClick={handleContinue}
        disabled={saving || selected.size === 0}
        className="w-full py-2.5 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-satoshi font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20"
      >
        {saving ? 'Saving...' : `Continue (${selected.size} selected)`}
      </button>
    </div>
  );
}

function Complete({ dark }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2F7D4F]/10 mb-6">
        <Check size={32} className="text-[#2F7D4F]" />
      </div>
      <h1 className={`font-clash font-semibold text-2xl mb-3 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        You're all set! Meet DragonBot in Slack!
      </h1>
      <p className={`text-sm font-satoshi mb-8 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
        DragonBot is now listening in your selected channels. Try mentioning @DragonBot to get started.
      </p>
      <div className="flex flex-col gap-3">
        <a
          href="https://slack.com/open"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center py-2.5 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-satoshi font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20"
        >
          Open Slack
        </a>
        <a
          href="#/"
          className={`text-sm font-satoshi font-medium transition-colors ${dark ? 'text-white/50 hover:text-white/70' : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70'}`}
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

export default function GettingStarted() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const step = searchParams.get('step') ?? 'add-to-slack';

  const [systemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = systemDark;

  function handleChannelsComplete() {
    setSearchParams({ step: 'complete' });
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#fafafa]'}`}>
      <div className={`w-full max-w-lg rounded-2xl border p-8 shadow-xl ${dark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`}>
        <StepIndicator currentStep={step} dark={dark} />

        {step === 'add-to-slack' && <AddToSlack dark={dark} />}
        {step === 'select-channels' && <SelectChannels dark={dark} onComplete={handleChannelsComplete} />}
        {step === 'complete' && <Complete dark={dark} />}
      </div>
    </div>
  );
}