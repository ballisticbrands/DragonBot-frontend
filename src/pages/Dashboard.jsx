import { useNavigate } from 'react-router-dom';

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('dragonbot_session') ?? 'null');
  } catch {
    return null;
  }
}

export default function Dashboard({ dark }) {
  const navigate = useNavigate();
  const session = getSession();

  function handleLogout() {
    localStorage.removeItem('dragonbot_token');
    localStorage.removeItem('dragonbot_session');
    navigate('/signin', { replace: true });
  }

  const displayName = session?.firstName
    ? `${session.firstName}${session.lastName ? ' ' + session.lastName : ''}`
    : 'User';
  const avatarUrl = session?.avatarUrl ?? session?.avatar;
  const hasBot = !!session?.hasBot;

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#fafafa]'}`}>
      <div className={`w-full max-w-sm rounded-2xl border p-8 shadow-xl ${dark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <img src="/logos/dragonbot_fire.png" alt="DragonBot" className="w-8 h-8" />
          <span className={`font-clash font-semibold text-xl ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
            DragonBot
          </span>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 mb-8">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-satoshi font-medium ${
              dark ? 'bg-white/10 text-white' : 'bg-gray-200 text-[#1A1A1A]'
            }`}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className={`font-satoshi font-medium text-sm ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              {displayName}
            </p>
            {session?.email && (
              <p className={`font-satoshi text-xs ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
                {session.email}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        {hasBot ? (
          <div>
            <div className={`rounded-xl p-4 mb-4 ${dark ? 'bg-[#2F7D4F]/10 border border-[#2F7D4F]/20' : 'bg-[#2F7D4F]/5 border border-[#2F7D4F]/10'}`}>
              <p className={`font-satoshi text-sm font-medium mb-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
                Your DragonBot is ready
              </p>
              <p className={`font-satoshi text-xs ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
                Start chatting with your AI assistant.
              </p>
            </div>
            <a
              href="#/chat"
              className="block w-full py-2.5 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-satoshi font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20 text-center"
            >
              Open Chat
            </a>
          </div>
        ) : (
          <div className={`rounded-xl p-4 ${dark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`font-satoshi text-sm font-medium mb-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              Setting up your DragonBot
            </p>
            <p className={`font-satoshi text-xs ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
              We're setting up your DragonBot. You'll be notified when it's ready.
            </p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`mt-6 w-full py-2 rounded-xl text-sm font-satoshi font-medium transition-colors border ${
            dark
              ? 'border-white/10 text-white/50 hover:text-white/70 hover:border-white/20'
              : 'border-gray-200 text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 hover:border-gray-300'
          }`}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}