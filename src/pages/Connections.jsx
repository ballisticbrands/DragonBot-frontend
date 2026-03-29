import { useState, useEffect } from 'react';
import { Plug, Globe, User, Trash2, Plus } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.dragonsellerbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

const PROVIDER_META = {
  anthropic: { icon: '🤖', label: 'Claude API' },
  keepa: { icon: '📊', label: 'Keepa' },
  jungle_scout: { icon: '🌿', label: 'Jungle Scout' },
  brave: { icon: '🔍', label: 'Brave Search' },
  transcript: { icon: '🎬', label: 'YouTube Transcript' },
  amazon_selling_partner: { icon: '🛒', label: 'Amazon SP-API' },
  google_drive: { icon: '📁', label: 'Google Drive' },
  notion: { icon: '📝', label: 'Notion' },
  shopify: { icon: '🛍️', label: 'Shopify' },
  gmail: { icon: '✉️', label: 'Gmail' },
  airtable_oauth: { icon: '📊', label: 'Airtable' },
  hubspot: { icon: '🔶', label: 'HubSpot' },
};

function getProviderMeta(provider) {
  return PROVIDER_META[provider] || { icon: '🔌', label: provider };
}

export default function Connections() {
  const [connections, setConnections] = useState([]);
  const [globalConnections, setGlobalConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = systemDark;

  useEffect(() => {
    (async () => {
      try {
        const [connsRes, globalRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/connections`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          fetch(`${BACKEND_URL}/api/connections/global`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }).catch(() => null),
        ]);

        if (connsRes.ok) {
          const data = await connsRes.json();
          setConnections(data.connections || []);
        }
        if (globalRes?.ok) {
          const data = await globalRes.json();
          setGlobalConnections(data.connections || []);
        }
      } catch (err) {
        console.error('Failed to load connections:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDisconnect(id) {
    if (!confirm('Disconnect this tool?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/connections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }

  const c = (dv, lv) => dark ? dv : lv;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`font-clash font-semibold text-2xl ${c('text-white', 'text-[#1A1A1A]')}`}>Connections</h1>
            <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              Tools and services your DragonBot can access
            </p>
          </div>
          <a
            href="#/getting-started?step=connect-tools"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-satoshi font-medium transition-colors"
          >
            <Plus size={14} />
            Add
          </a>
        </div>

        {loading ? (
          <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
        ) : (
          <>
            {/* Platform connections (global) */}
            {globalConnections.length > 0 && (
              <div className="mb-8">
                <h2 className={`flex items-center gap-2 text-sm font-satoshi font-medium mb-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
                  <Globe size={14} />
                  Platform Tools
                </h2>
                <div className="space-y-2">
                  {globalConnections.map((conn) => {
                    const meta = getProviderMeta(conn.provider);
                    return (
                      <div
                        key={conn.id}
                        className={`flex items-center justify-between p-4 rounded-xl border ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{meta.icon}</span>
                          <div>
                            <h3 className={`text-sm font-satoshi font-medium ${c('text-white', 'text-[#1A1A1A]')}`}>
                              {conn.name}
                            </h3>
                            <span className={`text-xs font-satoshi ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                              {conn.provider} · shared
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-satoshi px-2.5 py-1 rounded-full bg-[#2F7D4F]/10 text-[#2F7D4F]">
                          Active
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User connections */}
            <div>
              <h2 className={`flex items-center gap-2 text-sm font-satoshi font-medium mb-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
                <User size={14} />
                Your Connected Tools
              </h2>
              {connections.length === 0 ? (
                <div className={`rounded-2xl border p-8 text-center ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
                  <Plug size={40} className={`mx-auto mb-4 ${c('text-white/20', 'text-[#1A1A1A]/20')}`} />
                  <h3 className={`font-clash font-semibold text-lg mb-2 ${c('text-white', 'text-[#1A1A1A]')}`}>
                    No tools connected yet
                  </h3>
                  <p className={`text-sm font-satoshi max-w-md mx-auto mb-4 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
                    Connect your business tools so DragonBot can pull data and take actions on your behalf.
                  </p>
                  <a
                    href="#/getting-started?step=connect-tools"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-satoshi font-medium transition-colors"
                  >
                    <Plus size={14} />
                    Connect Tools
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {connections.map((conn) => {
                    const meta = getProviderMeta(conn.provider);
                    return (
                      <div
                        key={conn.id}
                        className={`flex items-center justify-between p-4 rounded-xl border ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{meta.icon}</span>
                          <div>
                            <h3 className={`text-sm font-satoshi font-medium ${c('text-white', 'text-[#1A1A1A]')}`}>
                              {conn.name}
                            </h3>
                            <span className={`text-xs font-satoshi ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                              {conn.provider} · {conn.authType}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-satoshi px-2.5 py-1 rounded-full ${
                            conn.enabled
                              ? 'bg-[#2F7D4F]/10 text-[#2F7D4F]'
                              : c('bg-white/5 text-white/30', 'bg-gray-100 text-gray-400')
                          }`}>
                            {conn.enabled ? 'Active' : 'Disabled'}
                          </span>
                          <button
                            onClick={() => handleDisconnect(conn.id)}
                            className={`p-1.5 rounded-lg transition-colors ${c('hover:bg-white/10 text-white/30', 'hover:bg-gray-100 text-gray-400')}`}
                            title="Disconnect"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}