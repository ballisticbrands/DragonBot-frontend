import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Search, Plug, Trash2, Lock, Eye, Plus, Gift, Shield } from 'lucide-react';
import { createFrontendClient } from '@pipedream/sdk/browser';
import { motion } from 'framer-motion';

function SlackLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.527 2.527 0 0 1 2.521 2.521 2.527 2.527 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.527 2.527 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.165 0a2.528 2.528 0 0 1 2.521 2.522v6.312z" fill="#2EB67D"/>
      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.522-2.522v-2.522h2.522zm0-1.27a2.527 2.527 0 0 1-2.522-2.522 2.527 2.527 0 0 1 2.522-2.521h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.521h-6.313z" fill="#ECB22E"/>
    </svg>
  );
}

// Logo URLs for popular tools (Pipedream asset CDN)
const TOOL_LOGOS = {
  amazon_selling_partner: 'https://assets.pipedream.net/s.v0/app_1lxhab/logo/orig', // Amazon
  amazon_ads: 'https://assets.pipedream.net/s.v0/app_1lxhab/logo/orig',
  google_drive: 'https://assets.pipedream.net/s.v0/app_1lxhk1/logo/orig',
  google_sheets: 'https://assets.pipedream.net/s.v0/app_168hvn/logo/orig',
  google_docs: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg',
  notion: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
  airtable: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Airtable_Logo.svg',
  shopify: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg',
};

const MOST_POPULAR_SLUGS = [
  'amazon_ads', 'google_drive', 'notion', 'airtable',
  'shopify', 'google_sheets', 'google_docs',
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

const STEPS = ['add-to-slack', 'connect-spapi', 'connect-tools', 'select-channels', 'complete'];

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
    <div className="text-center max-w-5xl mx-auto">
      <h1 className={`font-semibold text-3xl mb-2 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        Add <span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">DragonBot</span> to <span className="bg-gradient-to-r from-[#9B59B6] to-[#B794F4] bg-clip-text text-transparent">Slack</span>
      </h1>
      <p className={`text-sm mb-8 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
        Install DragonBot in your workspace to start collaborating
      </p>

      {/* Three info panes */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Pane 1: Authorize */}
        <div className={`rounded-xl border flex flex-col overflow-hidden ${dark ? 'border-white/10' : 'border-gray-200 bg-gray-50'}`}>
          <div className="relative flex items-center justify-center p-5 h-[130px]" style={{ background: 'radial-gradient(circle at center, rgba(47,125,79,0.15) 0%, transparent 70%)' }}>
            <span className={`absolute top-2.5 left-2.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${dark ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-500'}`}>1</span>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg">
                <img src="/DragonBot-avatar-social.png" alt="DragonBot" className="w-full h-full object-cover" />
              </div>
              <div className={`text-lg ${dark ? 'text-white/20' : 'text-[#1A1A1A]/20'}`}>⟷</div>
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <SlackLogo className="w-7 h-7" />
              </div>
            </div>
          </div>
          <div className="p-4 text-left">
            <h3 className={`text-sm font-semibold mb-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>Authorize in Slack</h3>
            <p className={`text-xs leading-relaxed ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
              You'll pop over to Slack for a quick approval. It takes 10 seconds.
            </p>
          </div>
        </div>

        {/* Pane 2: Connect tools */}
        <div className={`rounded-xl border flex flex-col overflow-hidden ${dark ? 'border-white/10' : 'border-gray-200 bg-gray-50'}`}>
          <div className="relative flex items-center justify-center p-5 h-[130px]" style={{ background: 'radial-gradient(circle at center, rgba(47,125,79,0.15) 0%, transparent 70%)' }}>
            <span className={`absolute top-2.5 left-2.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${dark ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-500'}`}>2</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { src: TOOL_LOGOS.amazon_selling_partner, alt: 'Amazon' },
                { src: TOOL_LOGOS.notion, alt: 'Notion' },
                { src: TOOL_LOGOS.google_drive, alt: 'Drive' },
                { src: TOOL_LOGOS.google_sheets, alt: 'Sheets' },
                { src: 'https://assets.pipedream.net/s.v0/app_OQYhq7/logo/orig', alt: 'Gmail' },
                { src: TOOL_LOGOS.airtable, alt: 'Airtable' },
                { src: TOOL_LOGOS.shopify, alt: 'Shopify' },
                { src: TOOL_LOGOS.google_docs, alt: 'Docs' },
              ].map((t) => (
                <div key={t.alt} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <img src={t.src} alt={t.alt} className="w-5 h-5 rounded object-contain" />
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 text-left">
            <h3 className={`text-sm font-semibold mb-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>Connect your tools</h3>
            <p className={`text-xs leading-relaxed ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
              Plug in Amazon SP-API, Google Drive, or whatever your team uses.
            </p>
          </div>
        </div>

        {/* Pane 3: Chat */}
        <div className={`rounded-xl border flex flex-col overflow-hidden ${dark ? 'border-white/10' : 'border-gray-200 bg-gray-50'}`}>
          <div className="relative flex items-center justify-center p-5 h-[130px]" style={{ background: 'radial-gradient(circle at center, rgba(47,125,79,0.15) 0%, transparent 70%)' }}>
            <span className={`absolute top-2.5 left-2.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${dark ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-500'}`}>3</span>
            <div className={`w-full rounded-lg p-2 text-left ${dark ? 'bg-white/[0.06]' : 'bg-gray-100'}`}>
              <div className="flex gap-1.5">
                <img src="/avatar-generic-male.jpg" alt="You" className="w-5 h-5 rounded flex-shrink-0 object-cover mt-px" />
                <div className="leading-none">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-[7px] font-semibold ${dark ? 'text-white/70' : 'text-[#1A1A1A]/70'}`}>You</span>
                    <span className={`text-[5px] ${dark ? 'text-white/25' : 'text-[#1A1A1A]/25'}`}>Just now</span>
                  </div>
                  <p className={`text-[7px] leading-tight ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
                    <span className="text-[#2F7D4F] font-semibold">@DragonBot</span> analyze our Amazon PPC performance from the last 2 weeks
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 text-left">
            <h3 className={`text-sm font-semibold mb-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>Chat like coworkers</h3>
            <p className={`text-xs leading-relaxed ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
              DM or @mention DragonBot. It already knows your tools and context.
            </p>
          </div>
        </div>
      </div>

      {/* CTA button */}
      <a
        href={`${BACKEND_URL}/api/slack/install?token=${encodeURIComponent(token)}`}
        className="inline-flex items-center justify-center gap-3 w-full max-w-md py-3 rounded-xl bg-white text-[#1A1A1A] text-sm font-medium transition-colors hover:bg-white/90"
      >
        <SlackLogo className="w-5 h-5" />
        Add DragonBot to Slack
      </a>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-5 mt-6">
        {['Amazon TOS Compliant', 'Read-Only', 'Encrypted'].map((badge) => (
          <div key={badge} className="flex items-center gap-1">
            <Shield size={10} className="text-white/50" />
            <span className="text-[10px] text-white/50">{badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Connect SP-API step ─────────────────────────────────────────────

function ConnectSpApi({ dark, onComplete }) {
  const [connections, setConnections] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadConnections() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const all = (await res.json()).connections ?? [];
        setConnections(all.filter((c) => c.provider === 'amazon_selling_partner'));
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
    }
  }

  useEffect(() => {
    loadConnections().finally(() => setLoading(false));
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError('');
    try {
      const tokenRes = await fetch(`${BACKEND_URL}/api/connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ app_slug: 'amazon_selling_partner' }),
      });
      if (!tokenRes.ok) {
        setError((await tokenRes.json().catch(() => ({}))).error || 'Failed');
        setConnecting(false);
        return;
      }
      const tokenData = await tokenRes.json();
      const pd = createFrontendClient({
        externalUserId: tokenData.externalUserId || 'user',
        tokenCallback: async () => tokenData,
      });
      await pd.connectAccount({
        app: 'amazon_selling_partner',
        token: tokenData.token,
        onSuccess: async (result) => {
          const saveRes = await fetch(`${BACKEND_URL}/api/connections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ provider: 'amazon_selling_partner', name: 'Selling Partner API (SP-API)', pipedreamAccountId: result.id }),
          });
          if (!saveRes.ok) {
            setError((await saveRes.json().catch(() => ({}))).error || 'Failed to save');
          } else {
            await loadConnections();
          }
          setConnecting(false);
        },
        onError: (err) => { setError(err.message || 'Failed'); setConnecting(false); },
        onClose: () => { setConnecting(false); },
      });
    } catch (err) {
      setError(err.message || 'Failed');
      setConnecting(false);
    }
  }

  const hasConnection = connections.length > 0;

  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${dark ? 'bg-[#FF9900]/10' : 'bg-[#FF9900]/5'}`}>
        <img src={TOOL_LOGOS.amazon_selling_partner} alt="Amazon" className="h-10 w-10 rounded-lg object-contain" />
      </div>
      <h1 className={`font-semibold text-2xl mb-3 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        Connect your Amazon Seller account
      </h1>
      <p className={`text-sm mb-4 leading-relaxed max-w-md mx-auto ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
        DragonBot connects to your Amazon Seller Central account in <strong className={dark ? 'text-white/70' : 'text-[#1A1A1A]/70'}>read-only mode</strong> — it can pull sales data, inventory levels, reports, and analytics, but <strong className={dark ? 'text-white/70' : 'text-[#1A1A1A]/70'}>cannot make any changes</strong> to your account.
      </p>

      <div className={`text-left mb-6 p-4 rounded-xl border ${dark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Lock size={14} className="text-[#2F7D4F] mt-0.5 flex-shrink-0" />
            <span className={`text-xs ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
              <strong className={dark ? 'text-white/70' : 'text-[#1A1A1A]/70'}>100% secure & compliant</strong> — fully compliant with Amazon's Terms of Service. Your credentials are encrypted and never shared.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Eye size={14} className="text-[#2F7D4F] mt-0.5 flex-shrink-0" />
            <span className={`text-xs ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
              <strong className={dark ? 'text-white/70' : 'text-[#1A1A1A]/70'}>Read-only by default</strong> — DragonBot can only view your data. You can enable write access later in Settings if you choose.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Plus size={14} className="text-[#2F7D4F] mt-0.5 flex-shrink-0" />
            <span className={`text-xs ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
              You can connect additional Amazon accounts later from the Connections page.
            </span>
          </div>
        </div>
      </div>

      {/* Connected accounts */}
      {connections.length > 0 && (
        <div className="mb-6 text-left space-y-2">
          {connections.map((conn) => (
            <div key={conn.id} className={`flex items-center gap-3 p-3 rounded-xl border ${dark ? 'border-[#2F7D4F]/50 bg-[#2F7D4F]/10' : 'border-[#2F7D4F]/30 bg-[#2F7D4F]/5'}`}>
              <Check size={16} className="text-[#2F7D4F] flex-shrink-0" />
              <span className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
                {conn.uniqueDisplayId || conn.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm">{error}</div>}

      {loading ? (
        <p className={`text-sm ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>Loading...</p>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors border disabled:opacity-50 ${
              dark
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                : 'bg-white border-gray-200 text-[#1A1A1A] hover:bg-gray-50'
            }`}
          >
            {connecting ? 'Connecting...' : hasConnection ? '+ Add another Amazon account' : 'Connect Amazon Account'}
          </button>

          <button
            onClick={onComplete}
            disabled={!hasConnection}
            className="w-full py-2.5 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

function ToolButton({ tool, dark, connecting, onClick }) {
  const isConnecting = connecting === tool.slug;
  const logo = TOOL_LOGOS[tool.slug] || tool.imgSrc;
  return (
    <button
      onClick={onClick}
      disabled={isConnecting}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-colors disabled:opacity-50 ${
        dark
          ? 'border-white/10 hover:border-white/20 hover:bg-white/5'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {logo ? (
        <img src={logo} alt={tool.name} className="w-7 h-7 rounded-lg object-contain" />
      ) : (
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${dark ? 'bg-white/10 text-white/50' : 'bg-gray-100 text-gray-400'}`}>
          {tool.name?.charAt(0) || '?'}
        </div>
      )}
      <span className={`text-[11px] font-medium leading-tight ${dark ? 'text-white/80' : 'text-[#1A1A1A]/80'}`}>
        {tool.name}
      </span>
      {isConnecting && <span className="text-[10px] text-[#2F7D4F]">Connecting...</span>}
    </button>
  );
}

// ─── Connect Tools step ──────────────────────────────────────────────

function ConnectTools({ dark, onComplete }) {
  const [tools, setTools] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  async function loadTools(q = '') {
    try {
      const res = await fetch(`${BACKEND_URL}/api/connect/available?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setTools((await res.json()).tools ?? []);
    } catch (err) {
      console.error('Failed to load tools:', err);
    }
  }

  async function loadConnections() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setConnections((await res.json()).connections ?? []);
    } catch (err) {
      console.error('Failed to load connections:', err);
    }
  }

  useEffect(() => {
    Promise.all([loadTools(), loadConnections()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadTools(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleConnect(tool) {
    // Custom connections with form fields
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ app_slug: tool.slug }),
      });
      if (!tokenRes.ok) {
        setError((await tokenRes.json().catch(() => ({}))).error || 'Failed');
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
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ provider: tool.slug, name: tool.name, pipedreamAccountId: result.id }),
          });
          if (!saveRes.ok) {
            setError((await saveRes.json().catch(() => ({}))).error || 'Failed to save');
          } else {
            await loadConnections();
          }
          setConnecting(null);
        },
        onError: (err) => { setError(err.message || 'Failed'); setConnecting(null); },
        onClose: () => { setConnecting(null); },
      });
    } catch (err) {
      setError(err.message || 'Failed');
      setConnecting(null);
    }
  }

  const [customForm, setCustomForm] = useState(null);

  async function handleCustomSubmit() {
    if (!customForm) return;
    setConnecting(customForm.tool.slug);
    setError('');
    try {
      // Custom OAuth: POST credentials, then open OAuth URL
      if (customForm.tool.customOAuth) {
        const slug = customForm.tool.slug.replace(/_/g, '-');
        const startRes = await fetch(`${BACKEND_URL}/api/connect/${slug}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(customForm.values),
        });
        if (!startRes.ok) {
          setError((await startRes.json().catch(() => ({}))).error || 'Failed to start OAuth');
          setConnecting(null);
          return;
        }
        const { url } = await startRes.json();
        window.open(url, '_blank', 'width=600,height=700');
        const pollInterval = setInterval(async () => {
          await loadConnections();
          setConnecting(null);
          setCustomForm(null);
          clearInterval(pollInterval);
        }, 5000);
        setTimeout(() => { clearInterval(pollInterval); setConnecting(null); }, 120000);
        return;
      }

      // Standard custom: save credentials directly
      const saveRes = await fetch(`${BACKEND_URL}/api/connections/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ provider: customForm.tool.slug, name: customForm.tool.name, credentials: customForm.values }),
      });
      if (saveRes.ok) {
        await loadConnections();
        setCustomForm(null);
      } else {
        setError((await saveRes.json().catch(() => ({}))).error || 'Failed to save');
      }
    } catch (err) {
      setError(err.message || 'Failed');
    } finally {
      setConnecting(null);
    }
  }

  async function handleDisconnect(connId) {
    try {
      await fetch(`${BACKEND_URL}/api/connections/${connId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setConnections((prev) => prev.filter((c) => c.id !== connId));
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  }

  // Separate SP-API connections (not deletable) from other connections
  const spApiConns = connections.filter((c) => c.provider === 'amazon_selling_partner');
  const otherConns = connections.filter((c) => c.provider !== 'amazon_selling_partner');

  // Split tools into "most popular" and "browse all"
  const popularTools = MOST_POPULAR_SLUGS
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean);
  const browseTools = tools.filter((t) => !MOST_POPULAR_SLUGS.includes(t.slug));

  return (
    <div>
      <h1 className={`font-semibold text-2xl mb-2 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        Give DragonBot <span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">tools to work with</span>
      </h1>
      <p className={`text-sm mb-5 leading-relaxed ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
        Just like any new hire, DragonBot works best when it can access your team's tools. Connect now or add them later from settings.
      </p>

      {/* Connected tools (SP-API shown but not deletable) */}
      {(spApiConns.length > 0 || otherConns.length > 0) && (
        <div className="mb-5 text-left space-y-2">
          {spApiConns.map((conn) => (
            <div key={conn.id} className={`flex items-center gap-3 p-3 rounded-xl border ${dark ? 'border-[#2F7D4F]/50 bg-[#2F7D4F]/10' : 'border-[#2F7D4F]/30 bg-[#2F7D4F]/5'}`}>
              <Check size={14} className="text-[#2F7D4F] flex-shrink-0" />
              <span className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>Amazon SP-API</span>
              {conn.uniqueDisplayId && <span className={`text-xs ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>({conn.uniqueDisplayId})</span>}
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${dark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400'}`}>read-only</span>
            </div>
          ))}
          {otherConns.map((conn) => (
            <div key={conn.id} className={`flex items-center justify-between p-3 rounded-xl border ${dark ? 'border-[#2F7D4F]/50 bg-[#2F7D4F]/10' : 'border-[#2F7D4F]/30 bg-[#2F7D4F]/5'}`}>
              <div className="flex items-center gap-3 min-w-0">
                {conn.appImgSrc ? (
                  <img src={conn.appImgSrc} alt={conn.name} className="w-6 h-6 rounded object-contain flex-shrink-0" />
                ) : (
                  <Plug size={14} className="text-[#2F7D4F] flex-shrink-0" />
                )}
                <span className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>{conn.name}</span>
                {conn.uniqueDisplayId && <span className={`text-xs ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>({conn.uniqueDisplayId})</span>}
              </div>
              <button onClick={() => handleDisconnect(conn.id)} className={`p-1 rounded-lg ${dark ? 'hover:bg-white/10 text-white/40' : 'hover:bg-gray-100 text-gray-400'}`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm">{error}</div>}

      {/* Custom credential form */}
      {customForm && (
        <div className={`mb-4 p-4 rounded-xl border text-left ${dark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3 mb-3">
            {customForm.tool.imgSrc ? (
              <img src={customForm.tool.imgSrc} alt={customForm.tool.name} className="w-7 h-7 rounded-lg object-contain" />
            ) : (
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <Plug size={14} className={dark ? 'text-white/40' : 'text-gray-400'} />
              </div>
            )}
            <div>
              <h3 className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>{customForm.tool.name}</h3>
              <p className={`text-xs ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>{customForm.tool.description}</p>
            </div>
          </div>
          {customForm.tool.helpText && (
            <div
              className={`mb-3 px-3 py-2 rounded-lg text-xs leading-relaxed [&_a]:underline [&_a]:text-[#2F7D4F] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-black/10 [&_code]:text-[10px] [&_code]:break-all ${dark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-[#1A1A1A]/50'}`}
              dangerouslySetInnerHTML={{ __html: customForm.tool.helpText.replace('{{callbackUrl}}', `${BACKEND_URL}/api/connect/${customForm.tool.slug.replace(/_/g, '-')}/callback`).replace(/\n/g, '<br/>') }}
            />
          )}
          <div className="space-y-3">
            {customForm.tool.fields.map((field) => (
              <div key={field.key}>
                <label className={`block text-xs font-medium mb-1 ${dark ? 'text-white/60' : 'text-[#1A1A1A]/60'}`}>{field.label}</label>
                <input
                  type={field.type || 'text'}
                  placeholder={field.placeholder || ''}
                  value={customForm.values[field.key] || ''}
                  onChange={(e) => setCustomForm((prev) => ({ ...prev, values: { ...prev.values, [field.key]: e.target.value } }))}
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
                    dark
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4ADE80]/50'
                      : 'bg-white border-gray-200 text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#2F7D4F]/50'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCustomSubmit}
              disabled={connecting === customForm.tool.slug}
              className="flex-1 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {connecting === customForm.tool.slug ? 'Connecting...' : 'Connect'}
            </button>
            <button
              onClick={() => setCustomForm(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${dark ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className={`relative mb-4 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/40'}`}>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search integrations..."
          className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none border transition-colors ${
            dark
              ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#4ADE80]/50'
              : 'bg-gray-50 border-gray-200 text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#2F7D4F]/50'
          }`}
        />
      </div>

      {loading ? (
        <p className={`text-sm ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>Loading...</p>
      ) : search ? (
        /* Search results — flat grid */
        <div className="grid grid-cols-3 gap-3 mb-5 text-left max-h-60 overflow-y-auto">
          {tools.map((tool) => (
            <ToolButton key={tool.slug} tool={tool} dark={dark} connecting={connecting} onClick={() => handleConnect(tool)} />
          ))}
        </div>
      ) : (
        /* Default view — Most popular + Browse all */
        <div className="mb-5">
          {popularTools.length > 0 && (
            <>
              <span className={`block text-xs font-medium mb-2 ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>Most popular</span>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {popularTools.map((tool) => (
                  <ToolButton key={tool.slug} tool={tool} dark={dark} connecting={connecting} onClick={() => handleConnect(tool)} />
                ))}
              </div>
            </>
          )}
          {browseTools.length > 0 && (
            <>
              <span className={`block text-xs font-medium mb-2 ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>Browse all tools</span>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {browseTools.map((tool) => (
                  <ToolButton key={tool.slug} tool={tool} dark={dark} connecting={connecting} onClick={() => handleConnect(tool)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Credits incentive + buttons */}
      <div className={`flex items-center justify-between pt-4 border-t ${dark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="flex items-center gap-1.5">
          <Gift size={14} className="text-[#2F7D4F]" />
          <span className={`text-xs font-medium ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
            Get 1,000 credits for every tool you connect
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onComplete}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              dark ? 'text-white/50 hover:text-white/70 hover:bg-white/5' : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 hover:bg-gray-100'
            }`}
          >
            Skip
          </button>
          <button
            onClick={onComplete}
            className="px-5 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Select Channels step ────────────────────────────────────────────

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
        const chList = Array.isArray(data) ? data : data.channels ?? [];
        setChannels(chList);
        // Select all channels by default
        setSelected(new Set(chList.map((c) => c.id)));
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

  function clearAll() {
    setSelected(new Set());
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
      <h1 className={`font-semibold text-2xl mb-3 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        Choose where DragonBot should listen
      </h1>
      <p className={`text-sm mb-6 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
        Select the Slack channels DragonBot should monitor and respond in.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={selectAll}
          className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-[#2F7D4F] hover:bg-[#256B42] text-white"
        >
          Invite DragonBot to all public channels
        </button>
        <button
          onClick={clearAll}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
            dark
              ? 'border-white/10 text-white/40 hover:text-white/60 hover:bg-white/5'
              : 'border-gray-200 text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60 hover:bg-gray-50'
          }`}
        >
          Clear all
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
          className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none border transition-colors ${
            dark
              ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#4ADE80]/50'
              : 'bg-gray-50 border-gray-200 text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#2F7D4F]/50'
          }`}
        />
      </div>

      {/* Channel list */}
      <div className={`max-h-60 overflow-y-auto rounded-xl border mb-4 text-left ${dark ? 'border-white/10' : 'border-gray-200'}`}>
        {loading && (
          <p className={`p-4 text-sm ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>Loading channels...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className={`p-4 text-sm ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>No channels found</p>
        )}
        {filtered.map((ch) => {
          const isSelected = selected.has(ch.id);
          return (
            <button
              key={ch.id}
              onClick={() => toggleChannel(ch.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
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

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <button
        onClick={handleContinue}
        disabled={saving || selected.size === 0}
        className="w-full py-2.5 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20"
      >
        {saving ? 'Saving...' : `Continue (${selected.size} selected)`}
      </button>
    </div>
  );
}

// ─── Complete step ───────────────────────────────────────────────────

function Complete({ dark }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2F7D4F]/10 mb-6">
        <Check size={32} className="text-[#2F7D4F]" />
      </div>
      <h1 className={`font-semibold text-2xl mb-3 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
        You're all set! Meet DragonBot in Slack!
      </h1>
      <p className={`text-sm mb-8 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
        DragonBot is now listening in your selected channels. Try mentioning @DragonBot to get started.
      </p>
      <div className="flex flex-col gap-3">
        <a
          href={`slack://open`}
          onClick={() => {
            setTimeout(() => { window.location.href = 'https://app.slack.com/client'; }, 500);
          }}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center py-2.5 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20"
        >
          Open Slack
        </a>
        <a
          href="#/"
          className={`text-sm font-medium transition-colors ${dark ? 'text-white/50 hover:text-white/70' : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70'}`}
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────

// Maps URL step params to DB setupStage values
const STEP_TO_STAGE = {
  'add-to-slack': 'SLACK_INSTALL',
  'connect-spapi': 'CONNECT_SPAPI',
  'connect-tools': 'CONNECT_TOOLS',
  'select-channels': 'SELECT_CHANNELS',
  'complete': 'COMPLETE',
};

// Maps DB setupStage to URL step param (for initial load from /api/me)
const STAGE_TO_STEP = {
  SLACK_INSTALL: 'add-to-slack',
  CONNECT_SPAPI: 'connect-spapi',
  CONNECT_TOOLS: 'connect-tools',
  SELECT_CHANNELS: 'select-channels',
  COMPLETE: 'complete',
};

async function advanceStage(nextStep) {
  const stage = STEP_TO_STAGE[nextStep];
  if (!stage) return;
  try {
    await fetch(`${BACKEND_URL}/api/setup/stage`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ stage }),
    });
  } catch (err) {
    console.error('Failed to advance setup stage:', err);
  }
}

export default function GettingStarted() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialStep, setInitialStep] = useState(null);

  // On mount, read the setup stage from /api/me to determine where the user left off
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('dragonbot_session') || 'null');
    if (session?.setupStage) {
      const step = STAGE_TO_STEP[session.setupStage] || 'add-to-slack';
      setInitialStep(step);
      if (!searchParams.get('step')) {
        setSearchParams({ step }, { replace: true });
      }
    } else {
      setInitialStep('add-to-slack');
    }
  }, []);

  const step = searchParams.get('step') ?? initialStep ?? 'add-to-slack';

  function goToStep(nextStep) {
    advanceStage(nextStep);
    setSearchParams({ step: nextStep });
  }

  const dark = true;

  if (!initialStep) return null; // loading

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#fafafa]'}`}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="flex items-center gap-2">
          <motion.img
            src="/DragonBot-logo.png"
            alt="DragonBot"
            className="h-6"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="font-bold text-base text-white" style={{ lineHeight: '1' }}>
            get<span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">DragonBot</span><span className="text-white">.com</span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-xl py-16" style={{ zoom: 1.25 }}>
        <StepIndicator currentStep={step} dark={dark} />

        {step === 'add-to-slack' && <AddToSlack dark={dark} />}
        {step === 'connect-spapi' && (
          <ConnectSpApi dark={dark} onComplete={() => goToStep('connect-tools')} />
        )}
        {step === 'connect-tools' && (
          <ConnectTools dark={dark} onComplete={() => goToStep('select-channels')} />
        )}
        {step === 'select-channels' && (
          <SelectChannels dark={dark} onComplete={() => goToStep('complete')} />
        )}
        {step === 'complete' && <Complete dark={dark} />}
      </div>
    </div>
  );
}