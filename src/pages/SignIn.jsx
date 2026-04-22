import { useState } from 'react';
import { Shield, Lock } from 'lucide-react';

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


function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="flex items-center gap-2">
        <img src="/DragonBot-logo.png" alt="DragonBot" className="h-6" />
        <span className="font-bold text-base text-white" style={{ lineHeight: '1' }}>
          get<span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">DragonBot</span><span className="text-white">.com</span>
        </span>
      </div>
    </div>
  );
}

export default function SignIn() {
  const [step, setStep] = useState(1);
  const dark = true;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#fafafa]'}`}>
      <TopBar />

      <div className="w-full max-w-md" style={{ zoom: 1.25 }}>
        {step === 1 && (
          <div>
            <p className={`text-[10px] uppercase tracking-widest mb-3 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>
              Before you connect
            </p>
            <h1 className={`font-semibold text-2xl mb-2 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              Your data <span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">stays yours</span>
            </h1>
            <p className={`text-sm mb-6 leading-relaxed ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
              Before you connect DragonBot to your workspace, here's how we protect your data.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                    <text x="20" y="16" fill={dark ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,26,0.6)'} fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle" letterSpacing="-0.4">amazon</text>
                    <path d="M6 22 Q 20 27, 34 22" stroke={dark ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,26,0.6)'} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <path d="M31 19.5 L 34 22 L 31.5 24.5" stroke={dark ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,26,0.6)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-sm font-semibold mb-0.5 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>Amazon SP-API connection</h3>
                  <p className={`text-xs leading-relaxed ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
                    DragonBot connects through the official Amazon Selling Partner API (SP-API). This is a read-only OAuth connection — we never see your Amazon password.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <Lock size={16} className={dark ? 'text-white/60' : 'text-[#1A1A1A]/60'} />
                </div>
                <div>
                  <h3 className={`text-sm font-semibold mb-0.5 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>Private by design</h3>
                  <p className={`text-xs leading-relaxed ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
                    DragonBot is just like your employee so it will see only what you decide to share with it. Your data is never used to train models.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20 flex items-center justify-center gap-2"
            >
              Continue <span className="text-white/50">&rarr;</span>
            </button>

            {/* Compliance badges */}
            <div className="flex items-center justify-center gap-4 mt-5">
              {['Amazon TOS Compliant', 'Read-Only', 'Encrypted'].map((badge) => (
                <div key={badge} className="flex items-center gap-1">
                  <Shield size={10} className={dark ? 'text-white/50' : 'text-[#1A1A1A]/50'} />
                  <span className={`text-[10px] ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <h1 className={`font-semibold text-2xl mb-2 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              Try DragonBot for free
            </h1>
            <p className={`text-sm mb-8 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
              Sign in with your Slack account to get started.
            </p>
            <a
              href="https://api.getdragonbot.com/api/slack/signin"
              className={`flex items-center justify-center gap-3 w-full py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                dark
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  : 'bg-white border-gray-200 text-[#1A1A1A] hover:bg-gray-50 shadow-sm'
              }`}
            >
              <SlackLogo className="w-5 h-5" />
              Continue with Slack
            </a>
            <p className={`text-xs mt-4 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/40'}`}>
              We'll never post on your behalf
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className={`text-[10px] mt-8 ${dark ? 'text-white/60' : 'text-[#1A1A1A]/60'}`}>
        By signing up, you agree to the DragonBot{' '}
        <a href="https://getdragonbot.com/privacy" className="underline hover:text-white/80">Privacy Policy</a>
        {' '}and{' '}
        <a href="https://getdragonbot.com/tos" className="underline hover:text-white/80">Terms of Service</a>
      </p>
    </div>
  );
}