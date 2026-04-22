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

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Amazon Seller', avatar: '/avatar-sarah.jpg', text: 'DragonBot audited our PPC in 10 minutes. Took our agency a week to do the same thing — and they missed half the wasted spend.' },
  { name: 'James L.', role: 'eCommerce Founder', avatar: '/avatar-james.jpg', text: 'I asked DragonBot to research a new product niche. It came back with keyword data, competitor analysis, and a margin estimate. Insane.' },
  { name: 'Priya K.', role: 'Operations Lead', avatar: '/avatar-priya.jpg', text: 'Our weekly ops report used to take 4 hours. Now DragonBot sends it to Slack every Monday morning. Zero effort.' },
  { name: 'Mike R.', role: 'Brand Manager', avatar: '/avatar-mike.jpg', text: 'Customer support triage was drowning us. DragonBot drafts first responses and routes tickets instantly. Game changer.' },
];

const BUILT_BY_COMPANIES = ['Amazon', 'Shopify', 'Meta', 'Google'];

function TopBar() {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-2">
        <img src="/DragonBot-logo.png" alt="DragonBot" className="h-6" />
        <span className="font-bold text-base text-white" style={{ lineHeight: '1' }}>
          get<span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">DragonBot</span><span className="text-white">.com</span>
        </span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="pb-4 text-center">
      <p className="text-[10px] text-white/40">
        By signing up, you agree to the DragonBot{' '}
        <a href="https://getdragonbot.com/privacy" className="underline hover:text-white/60">Privacy Policy</a>
        {' '}and{' '}
        <a href="https://getdragonbot.com/tos" className="underline hover:text-white/60">Terms of Service</a>
      </p>
    </div>
  );
}

// ─── Step 1: Your data stays yours ──────────────────────────────────

function DataStaysYours({ onContinue }) {
  return (
    <div className="w-full max-w-sm" style={{ zoom: 1.25 }}>
      <p className="text-[10px] uppercase tracking-widest mb-3 text-white/30">
        Before you connect
      </p>
      <h1 className="font-semibold text-2xl mb-2 text-white">
        Your data <span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">stays yours</span>
      </h1>
      <p className="text-sm mb-6 leading-relaxed text-white/50">
        Before you connect DragonBot to your workspace, here's how we protect your data.
      </p>

      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5">
            <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <text x="20" y="16" fill="rgba(255,255,255,0.6)" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle" letterSpacing="-0.4">amazon</text>
              <path d="M6 22 Q 20 27, 34 22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M31 19.5 L 34 22 L 31.5 24.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-0.5 text-white">Amazon SP-API connection</h3>
            <p className="text-xs leading-relaxed text-white/50">
              DragonBot connects through the official Amazon Selling Partner API (SP-API). This is a read-only OAuth connection — we never see your Amazon password.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5">
            <Lock size={16} className="text-white/60" />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-0.5 text-white">Private by design</h3>
            <p className="text-xs leading-relaxed text-white/50">
              DragonBot is just like your employee so it will see only what you decide to share with it. Your data is never used to train models.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-2.5 rounded-xl bg-[#2F7D4F] hover:bg-[#256B42] text-white text-sm font-medium transition-colors shadow-lg shadow-[#2F7D4F]/20 flex items-center justify-center gap-2"
      >
        Continue <span className="text-white/50">&rarr;</span>
      </button>

      <div className="flex items-center justify-center gap-4 mt-5">
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

// ─── Step 2: Try DragonBot for free ─────────────────────────────────

function TryForFree() {
  return (
    <div className="w-full max-w-5xl flex gap-16 items-start" style={{ zoom: 1.1 }}>
      {/* Left column — CTA */}
      <div className="flex-1 max-w-md pt-8">
        <h1 className="font-bold text-4xl leading-tight mb-2 text-white">
          Try DragonBot for free.
        </h1>
        <h2 className="font-bold text-4xl leading-tight mb-8">
          <span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">$100 credits included.</span>
        </h2>

        <a
          href="https://api.getdragonbot.com/api/slack/signin"
          className="flex items-center justify-center gap-3 w-full py-3 rounded-xl text-sm font-medium transition-colors bg-white text-[#1A1A1A] border border-white hover:bg-white/90"
        >
          <SlackLogo className="w-5 h-5" />
          Continue with Slack
        </a>

        <div className="flex items-center justify-center gap-4 mt-4">
          {['No credit card required', 'Amazon TOS compliant'].map((text) => (
            <div key={text} className="flex items-center gap-1.5">
              <Shield size={11} className="text-white/40" />
              <span className="text-xs text-white/40">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right column — Testimonials with fade edges */}
      <div className="flex-1 max-w-md pt-8">
        <div className="relative">
          {/* Top fade */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#0f0f0f] to-transparent z-10 pointer-events-none" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0f0f0f] to-transparent z-10 pointer-events-none" />

          <div className="space-y-3 py-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-4 rounded-xl bg-white/[0.03]">
                <div className="flex items-center gap-2.5 mb-2">
                  <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <span className="text-xs font-semibold text-white/80">{t.name}</span>
                    <span className="text-xs ml-1.5 text-white/30">{t.role}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/60">
                  {t.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Built by */}
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.15em] mb-3 text-white/50">
            Built by eCommerce operators & engineers from
          </p>
          <div className="flex items-center gap-6">
            {BUILT_BY_COMPANIES.map((name) => (
              <span key={name} className="font-semibold text-sm text-white/70">{name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────

export default function SignIn() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
      <TopBar />

      <div className="flex-1 flex items-center justify-center px-6 pb-8">
        {step === 1 && <DataStaysYours onContinue={() => setStep(2)} />}
        {step === 2 && <TryForFree />}
      </div>

      <Footer />
    </div>
  );
}