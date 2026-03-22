import { useState } from 'react';

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

export default function SignIn() {
  const [step, setStep] = useState(1);
  const [systemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = systemDark;

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

        {step === 1 && (
          <div>
            <h1 className={`font-clash font-semibold text-2xl mb-2 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              Your data stays yours
            </h1>
            <p className={`text-sm font-satoshi mb-2 leading-relaxed ${dark ? 'text-white/60' : 'text-[#1A1A1A]/60'}`}>
              DragonBot runs inside your own private environment. Your conversations and data are never shared with anyone else or used to train models.
            </p>
            <p className={`text-sm font-satoshi mb-8 leading-relaxed ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
              We use industry-standard encryption and your information never leaves your workspace.
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-satoshi font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className={`font-clash font-semibold text-2xl mb-2 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              Try DragonBot for free
            </h1>
            <p className={`text-sm font-satoshi mb-8 ${dark ? 'text-white/50' : 'text-[#1A1A1A]/50'}`}>
              Sign in with your Slack account to get started.
            </p>
            <a
              href="https://api.dragonsellerbot.com/api/slack/signin"
              className={`flex items-center justify-center gap-3 w-full py-2.5 rounded-xl text-sm font-satoshi font-medium transition-colors border ${
                dark
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  : 'bg-white border-gray-200 text-[#1A1A1A] hover:bg-gray-50 shadow-sm'
              }`}
            >
              <SlackLogo className="w-5 h-5" />
              Continue with Slack
            </a>
            <p className={`text-xs font-satoshi mt-4 text-center ${dark ? 'text-white/30' : 'text-[#1A1A1A]/40'}`}>
              We'll never post on your behalf
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
