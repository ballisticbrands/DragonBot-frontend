import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Check, Hash, Loader2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';
function getToken() { return localStorage.getItem('dragonbot_token'); }

export default function Slack({ dark }) {
  const [channels, setChannels] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(new Set());
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

  const memberCount = useMemo(() => channels.filter((c) => c.is_member).length, [channels]);

  const toggleChannel = useCallback(async (channelId, isMember) => {
    if (isMember) return; // Can't leave channels via API — only join
    setSaving((prev) => new Set([...prev, channelId]));
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/slack/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ channels: [channelId] }),
      });
      if (!res.ok) throw new Error('Failed to join channel');
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, is_member: true } : c))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  }, []);

  async function joinAll() {
    const toJoin = channels.filter((c) => !c.is_member).map((c) => c.id);
    if (toJoin.length === 0) return;
    setSaving(new Set(toJoin));
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/slack/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ channels: toJoin }),
      });
      if (!res.ok) throw new Error('Failed to join channels');
      setChannels((prev) =>
        prev.map((c) => (toJoin.includes(c.id) ? { ...c, is_member: true } : c))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(new Set());
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className={`font-clash font-semibold text-2xl mb-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        Slack Integration
      </h1>
      <p className={`text-sm font-satoshi mb-6 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
        Manage which channels DragonBot monitors and responds in.
        {!loading && ` ${memberCount} of ${channels.length} channels active.`}
      </p>

      {/* Actions row */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={joinAll}
          disabled={saving.size > 0 || channels.every((c) => c.is_member)}
          className={`px-4 py-2 rounded-xl text-sm font-satoshi font-medium transition-colors border disabled:opacity-40 disabled:cursor-not-allowed ${
            dark
              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              : 'bg-white border-gray-200 text-[#1A1A1A] hover:bg-gray-50'
          }`}
        >
          Join all channels
        </button>
      </div>

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
      <div className={`rounded-xl border overflow-hidden ${dark ? 'border-white/10' : 'border-gray-200'}`}>
        {loading && (
          <div className={`flex items-center gap-2 p-4 text-sm font-satoshi ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
            <Loader2 size={16} className="animate-spin" /> Loading channels...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className={`p-4 text-sm font-satoshi ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
            {search ? 'No channels match your search' : 'No channels found'}
          </p>
        )}
        <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
          {filtered.map((ch) => {
            const isMember = ch.is_member;
            const isSaving = saving.has(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id, isMember)}
                disabled={isMember || isSaving}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-satoshi transition-colors border-b last:border-b-0 ${
                  dark
                    ? `border-white/5 ${isMember ? 'bg-white/[0.02]' : 'hover:bg-white/5'}`
                    : `border-gray-100 ${isMember ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`
                } ${isMember ? 'cursor-default' : ''}`}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isMember
                      ? 'bg-[#2F7D4F] border-[#2F7D4F]'
                      : isSaving
                        ? 'border-[#2F7D4F]/50 bg-[#2F7D4F]/20'
                        : dark
                          ? 'border-white/20'
                          : 'border-gray-300'
                  }`}
                >
                  {isMember && <Check size={12} className="text-white" />}
                  {isSaving && <Loader2 size={12} className="text-[#2F7D4F] animate-spin" />}
                </div>
                <Hash size={14} className={dark ? 'text-white/30' : 'text-[#1A1A1A]/30'} />
                <span className={`flex-1 text-left ${dark ? 'text-white/80' : 'text-[#1A1A1A]/80'}`}>
                  {ch.name ?? ch.id}
                </span>
                <span className={`text-xs ${dark ? 'text-white/20' : 'text-[#1A1A1A]/20'}`}>
                  {ch.num_members} members
                </span>
                {isMember && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    dark ? 'bg-[#2F7D4F]/20 text-[#4ADE80]' : 'bg-[#2F7D4F]/10 text-[#2F7D4F]'
                  }`}>
                    Joined
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm font-satoshi text-red-500 mt-3">{error}</p>
      )}
    </div>
  );
}