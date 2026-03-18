import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ThemeDropdown({ dark, theme, onSetTheme, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const options = [
    { value: 'system', label: 'System', icon: <Monitor size={15} /> },
    { value: 'light', label: 'Light', icon: <Sun size={15} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={15} /> },
  ];

  return (
    <div
      ref={ref}
      className={`absolute right-0 top-full mt-2 w-36 rounded-xl shadow-lg border py-1 z-50 ${dark ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-gray-200'}`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => { onSetTheme(opt.value); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-satoshi transition-colors ${
            theme === opt.value
              ? dark ? 'text-[#4ADE80] bg-white/5' : 'text-[#2F7D4F] bg-[#2F7D4F]/5'
              : dark ? 'text-white/70 hover:bg-white/5' : 'text-[#1A1A1A]/70 hover:bg-gray-50'
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function extractMessageText(msg) {
  if (!msg) return '';
  if (typeof msg.content === 'string') return msg.content;
  if (Array.isArray(msg.content)) {
    return msg.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('');
  }
  return '';
}

export default function ChatViewer({
  messages,
  streamingText,
  isStreaming,
  dark,
  theme,
  onSetTheme,
  onSend,
  connected,
  sessionTitle,
}) {
  const [themeOpen, setThemeOpen] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  function handleSend() {
    const text = input.trim();
    if (!text || isStreaming || !connected) return;
    onSend(text);
    setInput('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!messages) {
    return (
      <div className={`flex-1 flex items-center justify-center font-satoshi text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>
        {connected ? 'Select a chat or start a new one' : 'Connecting…'}
      </div>
    );
  }

  const allMessages = [...messages];
  if (isStreaming || streamingText) {
    allMessages.push({ role: 'assistant', content: streamingText, _streaming: true });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`border-b px-5 py-2.5 flex items-center shrink-0 gap-3 ${dark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`}>
        <h1 className={`font-clash font-semibold text-base flex-1 truncate ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
          {sessionTitle ?? 'Chat'}
        </h1>
        <div className="flex items-center gap-1 shrink-0">
          <div
            className={`w-2 h-2 rounded-full ${connected ? 'bg-[#4ADE80]' : 'bg-yellow-400 animate-pulse'}`}
            title={connected ? 'Connected' : 'Connecting…'}
          />
          <div className="relative ml-1">
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-white/40 hover:text-white hover:bg-white/8' : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A] hover:bg-gray-100'}`}
            >
              {theme === 'system' ? <Monitor size={17} /> : theme === 'light' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {themeOpen && <ThemeDropdown dark={dark} theme={theme} onSetTheme={onSetTheme} onClose={() => setThemeOpen(false)} />}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#fafafa]'}`}>
        {allMessages.length === 0 && (
          <div className={`flex items-center justify-center h-full text-sm font-satoshi ${dark ? 'text-white/20' : 'text-gray-300'}`}>
            Send a message to get started
          </div>
        )}
        {allMessages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const text = typeof msg.content === 'string' ? msg.content : extractMessageText(msg);
          if (!text && !msg._streaming) return null;
          const showName = i === 0 || allMessages[i - 1]?.role !== msg.role;

          return (
            <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              {showName && (
                <div className={`flex items-center gap-1.5 mb-1 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                  {!isUser && (
                    <img src="/logos/dragonbot_fire.png" alt="" className="w-4 h-4" />
                  )}
                  <span className={`text-xs font-satoshi font-medium ${dark ? 'text-white/40' : 'text-[#1A1A1A]/50'}`}>
                    {isUser ? 'You' : 'DragonBot'}
                  </span>
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed font-satoshi break-words ${
                isUser
                  ? 'bg-[#2F7D4F] text-white rounded-2xl rounded-br-md whitespace-pre-line'
                  : dark
                    ? 'bg-[#1e1e1e] text-white/90 rounded-2xl rounded-bl-md'
                    : 'bg-[#f0f0f0] text-[#1A1A1A] rounded-2xl rounded-bl-md'
              }`}>
                {!text ? (
                  <span className={`inline-flex gap-1 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                  </span>
                ) : isUser ? text : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ inline, children }) => inline
                        ? <code className={`px-1 py-0.5 rounded text-xs font-mono ${dark ? 'bg-white/10' : 'bg-black/8'}`}>{children}</code>
                        : <pre className={`p-3 rounded-xl text-xs font-mono overflow-x-auto my-2 ${dark ? 'bg-black/40' : 'bg-black/6'}`}><code>{children}</code></pre>,
                      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className={`underline ${dark ? 'text-[#4ADE80] hover:text-[#86EFAC]' : 'text-[#2F7D4F] hover:text-[#256B42]'}`}>{children}</a>,
                      table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-xs border-collapse w-full">{children}</table></div>,
                      th: ({ children }) => <th className={`border px-2 py-1 text-left font-semibold ${dark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-100'}`}>{children}</th>,
                      td: ({ children }) => <td className={`border px-2 py-1 ${dark ? 'border-white/10' : 'border-gray-200'}`}>{children}</td>,
                      blockquote: ({ children }) => <blockquote className={`border-l-2 pl-3 my-2 italic ${dark ? 'border-white/30 text-white/60' : 'border-gray-400 text-gray-600'}`}>{children}</blockquote>,
                      hr: () => <hr className={`my-3 ${dark ? 'border-white/10' : 'border-gray-200'}`} />,
                    }}
                  >
                    {text}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`border-t px-3 py-2 shrink-0 ${dark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 ${dark ? 'bg-white/8' : 'bg-gray-100'}`}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? 'Ask DragonBot to do anything…' : 'Connecting…'}
            disabled={!connected || isStreaming}
            className={`text-sm font-satoshi flex-1 bg-transparent outline-none disabled:opacity-50 ${dark ? 'text-white placeholder:text-white/25' : 'text-[#1A1A1A] placeholder:text-gray-400'}`}
          />
          <button
            onClick={handleSend}
            disabled={!connected || isStreaming || !input.trim()}
            className="w-8 h-8 rounded-full bg-[#2F7D4F] flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}