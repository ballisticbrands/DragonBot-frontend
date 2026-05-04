import { useState, useEffect } from 'react';
import { Plug, Globe, User, Trash2, Plus, ChevronDown, Search } from 'lucide-react';
import { createFrontendClient } from '@pipedream/sdk/browser';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

export default function Connections({ dark }) {
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
    // Direct OAuth — open in a centered popup window
    if (tool.custom && tool.directOAuth) {
      setConnecting(tool.slug);
      setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/api/connect/${tool.slug.replace(/_/g, '-')}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.url) {
          const w = 600, h = 700;
          const left = window.screenX + (window.outerWidth - w) / 2;
          const top = window.screenY + (window.outerHeight - h) / 2;
          const popup = window.open(data.url, 'dragonbot-connect', `width=${w},height=${h},left=${left},top=${top}`);
          // Listen for completion message from the popup
          const onMessage = (e) => {
            if (e.data?.type === 'dragonbot-connection-complete') {
              window.removeEventListener('message', onMessage);
              setConnecting(null);
              loadConnections();
            }
          };
          window.addEventListener('message', onMessage);
          // Also poll in case the popup was blocked or closed without completing
          const pollTimer = setInterval(() => {
            if (popup?.closed) {
              clearInterval(pollTimer);
              window.removeEventListener('message', onMessage);
              setConnecting(null);
              loadConnections();
            }
          }, 1000);
          return;
        }
        setError(data.error || 'Failed to start OAuth');
      } catch (err) {
        setError(err.message);
      }
      setConnecting(null);
      return;
    }

    // Custom connections with fields show a credential form
    if (tool.custom && tool.fields?.length > 0) {
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
      // Custom OAuth connections: POST credentials to start endpoint, then open OAuth URL
      if (customForm.tool.customOAuth) {
        const slug = customForm.tool.slug.replace(/_/g, '-');
        const startRes = await fetch(`${BACKEND_URL}/api/connect/${slug}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(customForm.values),
        });
        if (!startRes.ok) {
          const err = await startRes.json().catch(() => ({}));
          setError(err.error || 'Failed to start OAuth flow');
          setConnecting(null);
          return;
        }
        const { url } = await startRes.json();
        window.open(url, '_blank', 'width=600,height=700');
        // Poll for connection to appear
        const pollInterval = setInterval(async () => {
          await loadConnections();
          setConnecting(null);
          setCustomForm(null);
          setShowAddPanel(false);
          clearInterval(pollInterval);
        }, 5000);
        setTimeout(() => { clearInterval(pollInterval); setConnecting(null); }, 120000);
        return;
      }

      // Standard custom connections: save credentials directly
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

  // Reconnect a broken connection: delete the old one, then open the Pipedream
  // OAuth modal for the same provider so the user gets a fresh refresh token.
  async function handleReconnect(conn) {
    setError('');
    setConnecting(conn.provider);
    try {
      // Delete the broken connection first so we don't end up with duplicates
      await fetch(`${BACKEND_URL}/api/connections/${conn.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setConnections((prev) => prev.filter((c) => c.id !== conn.id));

      // Reuse the Pipedream OAuth flow with the connection's provider slug
      const tokenRes = await fetch(`${BACKEND_URL}/api/connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ app_slug: conn.provider }),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        setError(err.error || 'Failed to start reconnection');
        setConnecting(null);
        return;
      }
      const tokenData = await tokenRes.json();
      const pd = createFrontendClient({
        externalUserId: tokenData.externalUserId || 'user',
        tokenCallback: async () => tokenData,
      });
      await pd.connectAccount({
        app: conn.provider,
        token: tokenData.token,
        onSuccess: async (result) => {
          await fetch(`${BACKEND_URL}/api/connections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({
              provider: conn.provider,
              name: conn.name,
              pipedreamAccountId: result.id,
            }),
          });
          await loadConnections();
          setConnecting(null);
        },
        onError: (err) => { setError(err.message || 'Reconnection failed'); setConnecting(null); },
        onClose: () => { setConnecting(null); },
      });
    } catch (err) {
      setError(err.message || 'Reconnection failed');
      setConnecting(null);
    }
  }

  // On-demand "Test connection" — calls /api/connections/:id/check
  async function handleHealthCheck(id) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/${id}/check`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) await loadConnections();
    } catch (err) {
      console.error('Failed to check connection:', err);
    }
  }

  const c = (dv, lv) => dark ? dv : lv;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`font-semibold text-2xl ${c('text-white', 'text-[#1A1A1A]')}`}>Connections</h1>
            <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              Tools and services your DragonBot can access
            </p>
          </div>
          <button
            onClick={() => { setShowAddPanel(!showAddPanel); setError(''); setSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-medium transition-colors"
          >
            {showAddPanel ? <ChevronDown size={14} /> : <Plus size={14} />}
            {showAddPanel ? 'Close' : 'Add Connection'}
          </button>
        </div>

        {/* Add connection panel */}
        {showAddPanel && (
          <div className={`rounded-2xl border p-6 mb-8 ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-medium ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
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
                className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none border transition-colors ${
                  c(
                    'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#4ADE80]/50',
                    'bg-gray-50 border-gray-200 text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#2F7D4F]/50'
                  )
                }`}
              />
            </div>

            {error && (
              <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Custom credential form — modal popup */}
            {customForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60" onClick={() => setCustomForm(null)} />
                <div className={`relative w-full max-w-md p-5 rounded-2xl shadow-2xl border ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
                  <div className="flex items-center gap-3 mb-4">
                    {customForm.tool.imgSrc ? (
                      <img src={customForm.tool.imgSrc} alt={customForm.tool.name} className="w-8 h-8 rounded-lg object-contain" />
                    ) : (
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c('bg-white/10', 'bg-gray-200')}`}>
                        <Plug size={14} className={c('text-white/40', 'text-gray-400')} />
                      </div>
                    )}
                    <div className="text-left">
                      <h3 className={`text-sm font-medium ${c('text-white', 'text-[#1A1A1A]')}`}>{customForm.tool.name}</h3>
                      <p className={`text-xs ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>{customForm.tool.description}</p>
                    </div>
                  </div>
                  {customForm.tool.helpText && (
                    <div
                      className={`mb-4 px-3 py-2.5 rounded-lg text-xs leading-relaxed [&_a]:underline [&_a]:text-[#2F7D4F] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-black/10 [&_code]:text-[10px] [&_code]:break-all ${c('bg-white/5 text-white/50', 'bg-gray-100 text-[#1A1A1A]/50')}`}
                      dangerouslySetInnerHTML={{ __html: customForm.tool.helpText.replace('{{callbackUrl}}', `${BACKEND_URL}/api/connect/${customForm.tool.slug.replace(/_/g, '-')}/callback`).replace(/\n/g, '<br/>') }}
                    />
                  )}
                  <div className="space-y-3">
                    {customForm.tool.fields.map((field) => (
                      <div key={field.key}>
                        <label className={`block text-xs font-medium mb-1 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
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
                          className={`w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
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
                      className="flex-1 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {connecting === customForm.tool.slug ? 'Saving...' : 'Connect'}
                    </button>
                    <button
                      onClick={() => setCustomForm(null)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${c('bg-white/5 text-white/50 hover:bg-white/10', 'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {searchLoading ? (
              <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
            ) : availableTools.length === 0 ? (
              <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>No apps found.</p>
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
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${c('bg-white/10 text-white/50', 'bg-gray-100 text-gray-400')}`}>
                          {tool.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className={`text-xs font-medium leading-tight ${c('text-white/80', 'text-[#1A1A1A]/80')}`}>
                        {tool.name}
                      </span>
                      {isConnecting && (
                        <span className="text-[10px] text-[#2F7D4F]">Connecting...</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
        ) : (
          <>
            {/* Platform connections (global) */}
            {globalConnections.length > 0 && (
              <div className="mb-8">
                <h2 className={`flex items-center gap-2 text-sm font-medium mb-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
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
              <h2 className={`flex items-center gap-2 text-sm font-medium mb-4 ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>
                <User size={14} />
                Your Connected Tools
              </h2>
              {connections.length === 0 && !showAddPanel ? (
                <div className={`rounded-2xl border p-8 text-center ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
                  <Plug size={40} className={`mx-auto mb-4 ${c('text-white/20', 'text-[#1A1A1A]/20')}`} />
                  <h3 className={`font-semibold text-lg mb-2 ${c('text-white', 'text-[#1A1A1A]')}`}>
                    No tools connected yet
                  </h3>
                  <p className={`text-sm max-w-md mx-auto mb-4 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
                    Connect your business tools so DragonBot can pull data and take actions on your behalf.
                  </p>
                  <button
                    onClick={() => setShowAddPanel(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-medium transition-colors"
                  >
                    <Plus size={14} />
                    Connect Tools
                  </button>
                </div>
              ) : connections.length > 0 && (
                <div className="space-y-2">
                  {[...connections].sort((a, b) => (a.name || a.provider || '').localeCompare(b.name || b.provider || '')).map((conn) => (
                    <ConnectionRow
                      key={conn.id}
                      conn={conn}
                      dark={dark}
                      onDisconnect={() => handleDisconnect(conn.id)}
                      onReconnect={() => handleReconnect(conn)}
                      onCheck={() => handleHealthCheck(conn.id)}
                    />
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

function ConnectionRow({ conn, dark, isGlobal, onDisconnect, onReconnect, onCheck }) {
  const c = (dv, lv) => dark ? dv : lv;
  const isBroken = conn.status === 'broken';
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${
      isBroken
        ? c('bg-red-500/5 border-red-500/30', 'bg-red-50 border-red-200')
        : c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        {conn.appImgSrc ? (
          <img src={conn.appImgSrc} alt={conn.name} className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
        ) : (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${c('bg-white/10', 'bg-gray-100')}`}>
            <Plug size={14} className={c('text-white/40', 'text-gray-400')} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className={`text-sm font-medium truncate ${c('text-white', 'text-[#1A1A1A]')}`}>
            {conn.name}
          </h3>
          <div className={`flex items-center gap-1.5 text-sm ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
            <span>{conn.provider}</span>
            {isGlobal && <span>· shared</span>}
            {conn.uniqueDisplayId && (
              <>
                <span>·</span>
                <span className={c('text-white/50', 'text-[#1A1A1A]/50')}>{conn.uniqueDisplayId}</span>
              </>
            )}
          </div>
          {isBroken && conn.lastError && (
            <div className={`text-xs mt-1 ${c('text-red-400/70', 'text-red-600/80')} truncate max-w-md`} title={conn.lastError}>
              {conn.lastError}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {conn.readOnly && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${c('bg-yellow-500/10 text-yellow-500/70', 'bg-yellow-50 text-yellow-600')}`}>
            Read-only
          </span>
        )}
        {isBroken ? (
          <span className={`text-xs px-2.5 py-1 rounded-full ${c('bg-red-500/15 text-red-400', 'bg-red-100 text-red-700')}`}>
            Broken
          </span>
        ) : (
          <span className={`text-xs px-2.5 py-1 rounded-full ${
            conn.enabled !== false
              ? 'bg-[#2F7D4F]/10 text-[#2F7D4F]'
              : c('bg-white/5 text-white/30', 'bg-gray-100 text-gray-400')
          }`}>
            {conn.enabled !== false ? 'Active' : 'Disabled'}
          </span>
        )}
        {isBroken && onReconnect && (
          <button
            onClick={onReconnect}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium ${c('bg-[#2F7D4F] hover:bg-[#3a9863] text-white', 'bg-[#2F7D4F] hover:bg-[#3a9863] text-white')}`}
          >
            Reconnect
          </button>
        )}
        {!isBroken && onCheck && (
          <button
            onClick={onCheck}
            className={`text-xs px-2.5 py-1 rounded-lg ${c('hover:bg-white/10 text-white/40', 'hover:bg-gray-100 text-gray-500')}`}
            title="Test connection"
          >
            Test
          </button>
        )}
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