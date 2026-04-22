import {} from 'react';
import { Shield } from 'lucide-react';

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
  { name: 'Sarah M.', role: 'Amazon Seller', text: 'DragonBot audited our PPC in 10 minutes. Took our agency a week to do the same thing — and they missed half the wasted spend.' },
  { name: 'James L.', role: 'eCommerce Founder', text: 'I asked DragonBot to research a new product niche. It came back with keyword data, competitor analysis, and a margin estimate. Insane.' },
  { name: 'Priya K.', role: 'Operations Lead', text: 'Our weekly ops report used to take 4 hours. Now DragonBot sends it to Slack every Monday morning. Zero effort.' },
];

const BUILT_BY_COMPANIES = ['Amazon', 'Shopify', 'Meta', 'Google'];

export default function SignIn() {
  const dark = true;

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0f0f0f]' : 'bg-[#fafafa]'}`}>
      {/* Top bar */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2">
          <img src="/DragonBot-logo.png" alt="DragonBot" className="h-6" />
          <span className="font-bold text-base text-white" style={{ lineHeight: '1' }}>
            get<span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">DragonBot</span><span className="text-white">.com</span>
          </span>
        </div>
      </div>

      {/* Main content — two columns */}
      <div className="flex-1 flex items-center justify-center px-6 pb-8">
        <div className="w-full max-w-5xl flex gap-16 items-start" style={{ zoom: 1.1 }}>

          {/* Left column — CTA */}
          <div className="flex-1 max-w-md pt-8">
            <h1 className={`font-bold text-4xl leading-tight mb-2 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              Try DragonBot for free.
            </h1>
            <h2 className="font-bold text-4xl leading-tight mb-8">
              <span className="bg-gradient-to-r from-[#2F7D4F] to-[#98CC65] bg-clip-text text-transparent">$100 credits included.</span>
            </h2>

            <a
              href="https://api.getdragonbot.com/api/slack/signin"
              className={`flex items-center justify-center gap-3 w-full py-3 rounded-xl text-sm font-medium transition-colors border ${
                dark
                  ? 'bg-white text-[#1A1A1A] border-white hover:bg-white/90'
                  : 'bg-[#1A1A1A] text-white border-[#1A1A1A] hover:bg-[#1A1A1A]/90'
              }`}
            >
              <SlackLogo className="w-5 h-5" />
              Continue with Slack
            </a>

            <div className="flex items-center justify-center gap-4 mt-4">
              {['No credit card required', 'Amazon TOS compliant'].map((text) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Shield size={11} className={dark ? 'text-white/40' : 'text-[#1A1A1A]/40'} />
                  <span className={`text-xs ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — Testimonials */}
          <div className="flex-1 max-w-md pt-8">
            <div className="space-y-4">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className={`p-4 rounded-xl ${dark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${dark ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-500'}`}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <span className={`text-xs font-semibold ${dark ? 'text-white/80' : 'text-[#1A1A1A]/80'}`}>{t.name}</span>
                      <span className={`text-xs ml-1.5 ${dark ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>{t.role}</span>
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed ${dark ? 'text-white/60' : 'text-[#1A1A1A]/60'}`}>
                    {t.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Built by */}
            <div className="mt-8">
              <p className={`text-[10px] uppercase tracking-[0.15em] mb-3 ${dark ? 'text-white/20' : 'text-[#1A1A1A]/20'}`}>
                Built by eCommerce operators & engineers from
              </p>
              <div className="flex items-center gap-6">
                {BUILT_BY_COMPANIES.map((name) => (
                  <span key={name} className={`font-semibold text-sm ${dark ? 'text-white/20' : 'text-[#1A1A1A]/20'}`}>{name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-4 text-center">
        <p className={`text-[10px] ${dark ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
          By signing up, you agree to the DragonBot{' '}
          <a href="https://getdragonbot.com/privacy" className="underline hover:text-white/60">Privacy Policy</a>
          {' '}and{' '}
          <a href="https://getdragonbot.com/tos" className="underline hover:text-white/60">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}