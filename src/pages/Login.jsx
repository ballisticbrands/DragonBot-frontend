import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [systemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = systemDark;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Login failed');
        return;
      }
      localStorage.setItem('dragonbot_session', JSON.stringify(data));
      navigate('/chat', { replace: true });
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#fafafa]'}`}>
      <div className={`w-full max-w-sm rounded-2xl border p-8 shadow-xl ${dark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <img src="/DragonBot-frontend/logos/dragonbot_fire.png" alt="DragonBot" className="w-8 h-8" />
          <span className={`font-clash font-semibold text-xl ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
            DragonBot
          </span>
        </div>

        <h1 className={`font-clash font-semibold text-2xl mb-1 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
          Welcome back
        </h1>
        <p className={`text-sm font-satoshi mb-7 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/60'}`}>
          Sign in to your DragonBot account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-satoshi font-medium mb-1.5 ${dark ? 'text-white/60' : 'text-[#1A1A1A]/70'}`}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-satoshi outline-none border transition-colors ${
                dark
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#4ADE80]/50'
                  : 'bg-gray-50 border-gray-200 text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#2F7D4F]/50'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-satoshi font-medium mb-1.5 ${dark ? 'text-white/60' : 'text-[#1A1A1A]/70'}`}>
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-satoshi outline-none border transition-colors ${
                dark
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#4ADE80]/50'
                  : 'bg-gray-50 border-gray-200 text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#2F7D4F]/50'
              }`}
            />
          </div>

          {error && (
            <p className="text-sm font-satoshi text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-satoshi font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}