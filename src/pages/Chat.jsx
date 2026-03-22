import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatSidebar from '../components/chats/ChatSidebar.jsx';
import ChatViewer, { extractMessageText } from '../components/chats/ChatViewer.jsx';
import { GatewayClient } from '../gateway/client.ts';

// Strip openclaw inbound envelope from stored user messages:
// - Leading "System: ..." event lines
// - "(untrusted ...)" metadata blocks (```json ... ```)
// - Leading "[DayOfWeek YYYY-MM-DD HH:MM UTC] " timestamp prefix
function stripInboundEnvelope(text) {
  if (!text) return text;
  let s = text;
  // Strip leading "System: ..." block (one or more lines, followed by blank line)
  s = s.replace(/^(?:System:[ \t][^\n]*\n)+\n?/, '');
  // Strip "(untrusted ...): \n```json\n...\n```\n\n" blocks (repeat until none left)
  let prev;
  do {
    prev = s;
    s = s.replace(/^[^\n]*\(untrusted[^)]*\)[^\n]*\n```(?:json)?\n[\s\S]*?\n```\n\n?/, '');
  } while (s !== prev);
  // Strip leading "[DayOfWeek YYYY-MM-DD HH:MM UTC] " timestamp prefix
  s = s.replace(/^\[\w{3} \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC\] /, '');
  return s.trim();
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('dragonbot_session') ?? 'null');
  } catch {
    return null;
  }
}

export default function Chat() {
  const { sessionKey: paramKey } = useParams();
  const navigate = useNavigate();
  const session = getSession();

  // Theme
  const [theme, setTheme] = useState('system');
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  const dark = theme === 'dark' || (theme === 'system' && systemDark);

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Gateway state
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [messagesByKey, setMessagesByKey] = useState({});
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const activeKeyRef = useRef(null);
  const clientRef = useRef(null);
  const streamBufferRef = useRef('');

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  // Load sessions from gateway
  const loadSessions = useCallback(async (client) => {
    try {
      const result = await client.request('sessions.list', {
        includeDerivedTitles: true,
        includeLastMessage: true,
      });
      const list = (result?.sessions ?? [])
        .filter((s) => !s.channel || s.channel === 'webchat')
        .map((s) => ({
          key: s.key,
          label: s.label,
          title: s.derivedTitle ?? s.title ?? s.label ?? s.key,
          lastMessage: s.lastMessage?.content
            ? (typeof s.lastMessage.content === 'string'
                ? s.lastMessage.content
                : extractMessageText(s.lastMessage))
              .slice(0, 60)
            : undefined,
        }));
      setSessions(list);
      return list;
    } catch (err) {
      console.error('[chat] sessions.list failed:', err);
      return [];
    }
  }, []);

  // Load history for a session
  const loadHistory = useCallback(async (client, key) => {
    try {
      const result = await client.request('chat.history', { sessionKey: key });
      const msgs = (result?.messages ?? []).map((m) => {
        const raw = typeof m.content === 'string' ? m.content : extractMessageText(m);
        const content = m.role === 'user' ? stripInboundEnvelope(raw) : raw;
        return { role: m.role, content };
      }).filter((m) => m.content);
      setMessagesByKey((prev) => ({ ...prev, [key]: msgs }));
    } catch (err) {
      console.error('[chat] chat.history failed:', err);
      setMessagesByKey((prev) => ({ ...prev, [key]: [] }));
    }
  }, []);

  // Handle agent streaming events
  const handleEvent = useCallback((evt) => {
    if (evt.event === 'chat') {
      const p = evt.payload;
      if (!p) return;

      // Gateway canonicalizes session keys to "agent:<id>:<key>"; match either form
      const eventKey = p.sessionKey;
      const keyMatches = (k) => eventKey === k || eventKey?.endsWith(':' + k);

      if (p.state === 'delta' && keyMatches(activeKeyRef.current)) {
        setIsStreaming(true);
        const delta = typeof p.message?.content === 'string'
          ? p.message.content
          : extractMessageText(p.message ?? {});
        streamBufferRef.current = delta;
        setStreamingText(delta);
      }

      if ((p.state === 'final' || p.state === 'aborted' || p.state === 'error') && keyMatches(activeKeyRef.current)) {
        // Prefer message content from the final event (complete) over stream buffer (may be truncated)
        const msgText = typeof p.message?.content === 'string' ? p.message.content : extractMessageText(p.message ?? {});
        const finalText = msgText || streamBufferRef.current;
        streamBufferRef.current = '';
        setStreamingText('');
        setIsStreaming(false);
        if (finalText && p.state === 'final') {
          setMessagesByKey((prev) => ({
            ...prev,
            [activeKeyRef.current]: [...(prev[activeKeyRef.current] ?? []), { role: 'assistant', content: finalText }],
          }));
        } else if (p.state === 'final') {
          // Reload history in case we missed deltas
          if (clientRef.current?.isConnected) {
            loadHistory(clientRef.current, activeKeyRef.current);
          }
        }
      }
    }

    // Also handle sessions.list reload triggers
    if (evt.event === 'sessions.changed' && clientRef.current?.isConnected) {
      loadSessions(clientRef.current);
    }
  }, [loadHistory, loadSessions]);

  // Bootstrap gateway on mount
  useEffect(() => {
    if (!session || !session.gatewayUrl) {
      navigate('/signin', { replace: true });
      return;
    }

    const client = new GatewayClient({
      gatewayUrl: session.gatewayUrl,
      token: session.gatewayToken,
      onConnected: async (hello) => {
        console.log('[gateway] connected, protocol', hello.protocol);
        setConnected(true);
        const list = await loadSessions(client);

        // Navigate to first session or param key
        const targetKey = paramKey ?? list[0]?.key ?? 'main';
        setActiveKey(targetKey);
        activeKeyRef.current = targetKey;
        await loadHistory(client, targetKey);
        if (!paramKey && targetKey !== 'main') {
          navigate(`/chat/${targetKey}`, { replace: true });
        }
      },
      onDisconnected: (_code, reason) => {
        console.log('[gateway] disconnected:', reason);
        setConnected(false);
        setIsStreaming(false);
        streamBufferRef.current = '';
        setStreamingText('');
      },
      onEvent: handleEvent,
    });

    clientRef.current = client;
    client.start();

    return () => {
      client.stop();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When paramKey changes (user clicked sidebar link), load that session
  useEffect(() => {
    if (!paramKey || paramKey === activeKey) return;
    setActiveKey(paramKey);
    activeKeyRef.current = paramKey;
    streamBufferRef.current = '';
    setStreamingText('');
    setIsStreaming(false);
    if (!messagesByKey[paramKey] && clientRef.current?.isConnected) {
      loadHistory(clientRef.current, paramKey);
    }
  }, [paramKey, activeKey, messagesByKey, loadHistory]);

  function handleSelectSession(key) {
    setDrawerOpen(false);
    if (key === activeKey) return;
    navigate(`/chat/${key}`);
  }

  async function handleNewChat() {
    if (!clientRef.current?.isConnected) return;
    const newKey = crypto.randomUUID();
    setSessions((prev) => [{ key: newKey, title: 'New Chat' }, ...prev]);
    setMessagesByKey((prev) => ({ ...prev, [newKey]: [] }));
    navigate(`/chat/${newKey}`);
    setDrawerOpen(false);
  }

  async function handleSend(text) {
    if (!activeKey || !clientRef.current?.isConnected) return;
    const key = activeKey;

    // Optimistically add user message
    setMessagesByKey((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { role: 'user', content: text }],
    }));
    setIsStreaming(true);
    streamBufferRef.current = '';
    setStreamingText('');

    try {
      await clientRef.current.request('chat.send', {
        sessionKey: key,
        message: text,
        idempotencyKey: crypto.randomUUID(),
      });
    } catch (err) {
      console.error('[chat] chat.send failed:', err);
      setIsStreaming(false);
    }
  }

  const activeSession = sessions.find((s) => s.key === activeKey);
  const activeMessages = activeKey ? (messagesByKey[activeKey] ?? null) : null;

  return (
    <div className={`h-screen flex ${dark ? 'bg-[#0f0f0f]' : 'bg-[#fafafa]'}`}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <ChatSidebar
          sessions={sessions}
          activeKey={activeKey}
          dark={dark}
          onSelect={handleSelectSession}
          onNewChat={handleNewChat}
          firstName={session?.firstName}
        />
      </div>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed bottom-6 left-6 z-30 w-12 h-12 rounded-full bg-[#2F7D4F] text-white shadow-lg flex items-center justify-center"
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        {drawerOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-20 md:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-30 md:hidden"
            >
              <ChatSidebar
                sessions={sessions}
                activeKey={activeKey}
                dark={dark}
                onSelect={handleSelectSession}
                onNewChat={handleNewChat}
                firstName={session?.firstName}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatViewer
          messages={activeMessages}
          streamingText={streamingText}
          isStreaming={isStreaming}
          dark={dark}
          theme={theme}
          onSetTheme={setTheme}
          onSend={handleSend}
          connected={connected}
          sessionTitle={activeSession?.title ?? activeSession?.label}
        />
      </div>
    </div>
  );
}