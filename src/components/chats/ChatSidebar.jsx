import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChatSidebar({ sessions, activeKey, dark, onSelect, onNewChat, firstName }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('dragonbot_session');
    navigate('/login', { replace: true });
  }

  function handleSelect(key) {
    onSelect?.(key);
  }

  return (
    <div className={`w-72 flex flex-col h-full border-r ${dark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${dark ? 'border-white/10' : 'border-gray-100'}`}>
        <img src="/logos/dragonbot_fire.png" alt="DragonBot" className="w-6 h-6" />
        <span className={`font-clash font-semibold text-base flex-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
          DragonBot
        </span>
      </div>

      {/* New Chat */}
      <div className="px-3 py-2">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-satoshi font-medium transition-colors ${
            dark
              ? 'text-white/70 hover:bg-white/5 hover:text-white'
              : 'text-[#1A1A1A]/70 hover:bg-gray-50 hover:text-[#1A1A1A]'
          }`}
        >
          <Plus size={16} className="text-[#2F7D4F]" />
          New Chat
        </button>
      </div>

      {/* Sessions list */}
      <div className={`px-3 pb-1 pt-1`}>
        <p className={`text-xs font-satoshi font-medium px-2 mb-1 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/40'}`}>
          Chats
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {sessions.length === 0 && (
          <p className={`text-xs font-satoshi px-2 py-2 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
            No chats yet
          </p>
        )}
        {sessions.map((s) => {
          const isActive = s.key === activeKey;
          const label = s.title ?? s.label ?? s.key;
          return (
            <button
              key={s.key}
              onClick={() => handleSelect(s.key)}
              className={`w-full text-left px-3 py-2.5 rounded-xl mb-0.5 transition-colors ${
                isActive
                  ? dark
                    ? 'bg-white/10 text-white'
                    : 'bg-[#2F7D4F]/8 text-[#1A1A1A]'
                  : dark
                    ? 'text-white/60 hover:bg-white/5 hover:text-white'
                    : 'text-[#1A1A1A]/70 hover:bg-gray-50 hover:text-[#1A1A1A]'
              }`}
            >
              <p className="text-sm font-satoshi font-medium truncate leading-snug">{label}</p>
              {s.lastMessage && (
                <p className={`text-xs font-satoshi truncate mt-0.5 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/40'}`}>
                  {s.lastMessage}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`px-3 py-3 border-t ${dark ? 'border-white/10' : 'border-gray-100'}`}>
        <div className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl ${dark ? '' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-[#2F7D4F] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-satoshi font-semibold">
              {firstName ? firstName[0].toUpperCase() : 'U'}
            </span>
          </div>
          <span className={`flex-1 text-sm font-satoshi font-medium truncate ${dark ? 'text-white/80' : 'text-[#1A1A1A]/80'}`}>
            {firstName ?? 'User'}
          </span>
          <button
            onClick={handleLogout}
            className={`text-xs font-satoshi transition-colors ${dark ? 'text-white/30 hover:text-white/60' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70'}`}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}