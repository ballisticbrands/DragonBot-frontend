import { useState, useEffect } from 'react';
import { Plug, Globe, User, Trash2, Plus, ChevronDown, Search } from 'lucide-react';
import { createFrontendClient } from '@pipedream/sdk/browser';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.dragonsellerbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

export default function Connections() {
  const [connections, setConnections] = useState([]);
  const [globalConnections, setGlobalConnections] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const [customForm, setCustomForm] = useState(null); // { tool, values: {} }
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [systemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = systemDark;

  async function loadConnections() {
    try {
      const [connsRes, globalRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/connections`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
        fetch(`${BACKEND_URL}/api/connections/global`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }).catch(() => null),
      ]);

      if (connsRes.ok) setConnections((await connsRes.json()).connections || []);
      if (globalRes?.ok) setGlobalConnections((await globalRes.json()).connections || []);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTools(q = '') {
    setSearchLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connect/available?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setAvailableTools((await res.json()).tools || []);
    } catch (err) {
      console.error('Failed to load tools:', err);
    } finally {
      setSearchLoading(false);
    }
  }

  useEffect(() => { loadConnections(); }, []);
  useEffect(() => {
    if (showAddPanel) loadTools();
  }, [showAddPanel]);

  // Debounced search
  useEffect(() => {
    if (!showAddPanel) return;
    const timer = setTimeout(() => loadTools(search), 300);
    return () => clearTimeout(timer);
  }, [search, showAddPanel]);

  async function handleConnect(tool) {
    // Custom connections show a credential form instead of Pipedream OAuth
    if (tool.custom && tool.fields) {
      setCustomForm({ tool, values: {} });
      return;
    }

    // Pipedream OAuth flow
    setConnecting(tool.slug);
    setError('');
    try {
      const tokenRes = await fetch(`${BACKEND_URL}/api/connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ app_slug: tool.slug }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        setError(err.error || 'Failed to start connection');
        setConnecting(null);
        return;
      }

      const tokenData = await tokenRes.json();

      const pd = createFrontendClient({
        externalUserId: tokenData.externalUserId || 'user',
        tokenCallback: async () => tokenData,
      });

      await pd.connectAccount({
        app: tool.slug,
        token: tokenData.token,
        onSuccess: async (result) => {
          const saveRes = await fetch(`${BACKEND_URL}/api/connections`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
              provider: tool.slug,
              name: tool.name,
              pipedreamAccountId: result.id,
            }),
          });
          if (saveRes.ok) {
            await loadConnections();
            setShowAddPanel(false);
          } else {
            const err = await saveRes.json().catch(() => ({}));
            setError(err.error || 'Failed to save connection');
          }
          setConnecting(null);
        },
        onError: (err) => {
          setError(err.message || 'Connection failed');
          setConnecting(null);
        },
        onClose: () => {
          setConnecting(null);
        },
      });
    } catch (err) {
      setError(err.message || 'Connection failed');
      setConnecting(null);
    }
  }

  async function handleCustomSubmit() {
    if (!customForm) return;
    setConnecting(customForm.tool.slug);
    setError('');
    try {
      const saveRes = await fetch(`${BACKEND_URL}/api/connections/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          provider: customForm.tool.slug,
          name: customForm.tool.name,
          credentials: customForm.values,
        }),
      });
      if (saveRes.ok) {
        await loadConnections();
        setCustomForm(null);
        setShowAddPanel(false);
      } else {
        const err = await saveRes.json().catch(() => ({}));
        setError(err.error || 'Failed to save connection');
      }
    } catch (err) {
      setError(err.message || 'Failed');
    } finally {
      setConnecting(null);
    }
  }

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
          <button
            onClick={() => { setShowAddPanel(!showAddPanel); setError(''); setSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-satoshi font-medium transition-colors"
          >
            {showAddPanel ? <ChevronDown size={14} /> : <Plus size={14} />}
            {showAddPanel ? 'Close' : 'Add Connection'}
          </button>
        </div>

        {/* Add connection panel */}
        {showAddPanel && (
          <div className={`rounded-2xl border p-6 mb-8 ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-satoshi font-medium ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
                Choose a tool to connect
              </h2>
            </div>

            {/* Search */}
            <div className={`relative mb-4 ${c('text-white/50', 'text-[#1A1A1A]/40')}`}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 2000+ apps..."
                className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-sm font-satoshi outline-none border transition-colors ${
                  c(
                    'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#4ADE80]/50',
                    'bg-gray-50 border-gray-200 text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#2F7D4F]/50'
                  )
                }`}
              />
            </div>

            {error && (
              <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-satoshi">
                {error}
              </div>
            )}

            {/* Custom credential form */}
            {customForm && (
              <div className={`mb-4 p-4 rounded-xl border ${c('border-white/10 bg-white/5', 'border-gray-200 bg-gray-50')}`}>
                <div className="flex items-center gap-3 mb-4">
                  {customForm.tool.imgSrc ? (
                    <img src={customForm.tool.imgSrc} alt={customForm.tool.name} className="w-8 h-8 rounded-lg object-contain" />
                  ) : (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c('bg-white/10', 'bg-gray-200')}`}>
                      <Plug size={14} className={c('text-white/40', 'text-gray-400')} />
                    </div>
                  )}
                  <div className="text-left">
                    <h3 className={`text-sm font-satoshi font-medium ${c('text-white', 'text-[#1A1A1A]')}`}>{customForm.tool.name}</h3>
                    <p className={`text-xs font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>{customForm.tool.description}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {customForm.tool.fields.map((field) => (
                    <div key={field.key}>
                      <label className={`block text-xs font-satoshi font-medium mb-1 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
                        {field.label}
                      </label>
                      <input
                        type={field.type || 'text'}
                        placeholder={field.placeholder || ''}
                        value={customForm.values[field.key] || ''}
                        onChange={(e) => setCustomForm((prev) => ({
                          ...prev,
                          values: { ...prev.values, [field.key]: e.target.value },
                        }))}
                        className={`w-full rounded-lg px-3 py-2 text-sm font-satoshi outline-none border transition-colors ${
                          c(
                            'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4ADE80]/50',
                            'bg-white border-gray-200 text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#2F7D4F]/50'
                          )
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCustomSubmit}
                    disabled={connecting === customForm.tool.slug}
                    className="flex-1 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-satoshi font-medium transition-colors disabled:opacity-50"
                  >
                    {connecting === customForm.tool.slug ? 'Saving...' : 'Connect'}
                  </button>
                  <button
                    onClick={() => setCustomForm(null)}
                    className={`px-4 py-2 rounded-xl text-sm font-satoshi font-medium transition-colors ${c('bg-white/5 text-white/50 hover:bg-white/10', 'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {searchLoading ? (
              <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
            ) : availableTools.length === 0 ? (
              <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>No apps found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                {availableTools.map((tool) => {
                  const isConnecting = connecting === tool.slug;
                  return (
                    <button
                      key={tool.slug}
                      onClick={() => handleConnect(tool)}
                      disabled={isConnecting}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-colors disabled:opacity-50 ${
                        c(
                          'border-white/10 hover:border-white/20 hover:bg-white/5',
                          'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        )
                      }`}
                    >
                      {tool.imgSrc ? (
                        <img src={tool.imgSrc} alt={tool.name} className="w-8 h-8 rounded-lg object-contain" />
                      ) : (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-satoshi font-medium ${c('bg-white/10 text-white/50', 'bg-gray-100 text-gray-400')}`}>
                          {tool.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className={`text-xs font-satoshi font-medium leading-tight ${c('text-white/80', 'text-[#1A1A1A]/80')}`}>
                        {tool.name}
                      </span>
                      {isConnecting && (
                        <span className="text-[10px] font-satoshi text-[#2F7D4F]">Connecting...</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
                  {globalConnections.map((conn) => (
                    <ConnectionRow key={conn.id} conn={conn} dark={dark} isGlobal />
                  ))}
                </div>
              </div>
            )}

            {/* User connections */}
            <div>
              <h2 className={`flex items-center gap-2 text-sm font-satoshi font-medium mb-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
                <User size={14} />
                Your Connected Tools
              </h2>
              {connections.length === 0 && !showAddPanel ? (
                <div className={`rounded-2xl border p-8 text-center ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
                  <Plug size={40} className={`mx-auto mb-4 ${c('text-white/20', 'text-[#1A1A1A]/20')}`} />
                  <h3 className={`font-clash font-semibold text-lg mb-2 ${c('text-white', 'text-[#1A1A1A]')}`}>
                    No tools connected yet
                  </h3>
                  <p className={`text-sm font-satoshi max-w-md mx-auto mb-4 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
                    Connect your business tools so DragonBot can pull data and take actions on your behalf.
                  </p>
                  <button
                    onClick={() => setShowAddPanel(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-satoshi font-medium transition-colors"
                  >
                    <Plus size={14} />
                    Connect Tools
                  </button>
                </div>
              ) : connections.length > 0 && (
                <div className="space-y-2">
                  {connections.map((conn) => (
                    <ConnectionRow key={conn.id} conn={conn} dark={dark} onDisconnect={() => handleDisconnect(conn.id)} />
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

function ConnectionRow({ conn, dark, isGlobal, onDisconnect }) {
  const c = (dv, lv) => dark ? dv : lv;
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
      <div className="flex items-center gap-3 min-w-0">
        {conn.appImgSrc ? (
          <img src={conn.appImgSrc} alt={conn.name} className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
        ) : (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${c('bg-white/10', 'bg-gray-100')}`}>
            <Plug size={14} className={c('text-white/40', 'text-gray-400')} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className={`text-sm font-satoshi font-medium truncate ${c('text-white', 'text-[#1A1A1A]')}`}>
            {conn.name}
          </h3>
          <div className={`flex items-center gap-1.5 text-xs font-satoshi ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
            <span>{conn.provider}</span>
            {isGlobal && <span>· shared</span>}
            {conn.accountName && (
              <>
                <span>·</span>
                <span className={c('text-white/50', 'text-[#1A1A1A]/50')}>{conn.accountName}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-xs font-satoshi px-2.5 py-1 rounded-full ${
          conn.enabled !== false
            ? 'bg-[#2F7D4F]/10 text-[#2F7D4F]'
            : c('bg-white/5 text-white/30', 'bg-gray-100 text-gray-400')
        }`}>
          {conn.enabled !== false ? 'Active' : 'Disabled'}
        </span>
        {onDisconnect && (
          <button
            onClick={onDisconnect}
            className={`p-1.5 rounded-lg transition-colors ${c('hover:bg-white/10 text-white/30', 'hover:bg-gray-100 text-gray-400')}`}
            title="Disconnect"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}