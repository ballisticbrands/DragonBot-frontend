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

function AmazonLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.171 13.078c-1.399.996-3.429 1.527-5.175 1.527-2.449 0-4.652-.876-6.321-2.333-.131-.114-.014-.271.143-.182 1.8 1.012 4.026 1.622 6.324 1.622 1.55 0 3.254-.311 4.823-.955.237-.097.435.151.206.321z"/>
      <path d="M14.761 12.407c-.178-.221-1.18-.105-1.63-.053-.137.016-.158-.099-.035-.182.798-.543 2.107-.386 2.26-.204.153.184-.04 1.455-.789 2.063-.115.093-.225.044-.174-.08.169-.41.547-1.323.368-1.544z"/>
      <path d="M13.156 7.543v-.629c0-.096.073-.159.16-.159h2.832c.091 0 .164.066.164.159v.539c-.002.091-.078.209-.214.394l-1.467 2.028c.545-.013 1.12.066 1.613.337.111.061.141.151.15.24v.671c0 .09-.1.196-.206.141-.858-.436-1.998-.483-2.947.005-.097.05-.198-.052-.198-.142v-.638c0-.101.001-.274.105-.427l1.699-2.358h-1.478c-.091 0-.164-.064-.164-.158l-.049-.003z"/>
      <path d="M4.727 11.297h-.861c-.082-.006-.148-.067-.154-.145V6.768c0-.087.073-.157.163-.157h.803c.084.003.151.068.157.148v.559h.016c.21-.544.604-.797 1.134-.797.538 0 .874.253 1.115.797.209-.544.685-.797 1.198-.797.363 0 .761.145.903.472.16.366.128.895.128 1.362l-.001 2.556c0 .087-.073.157-.163.157h-.859c-.085-.006-.153-.073-.153-.157V8.916c0-.183.016-.639-.024-.812-.064-.29-.254-.372-.501-.372-.206 0-.422.134-.51.348-.088.214-.08.572-.08.836v2.196c0 .087-.073.157-.163.157h-.859c-.085-.006-.153-.073-.153-.157l-.001-2.196c0-.484.08-1.196-.525-1.196-.612 0-.588.695-.588 1.196v2.196c0 .087-.073.157-.163.157l.031-.012z"/>
      <path d="M18.301 6.565c1.277 0 1.969 1.062 1.969 2.495 0 1.348-.752 2.456-1.969 2.456-1.268 0-1.957-1.062-1.957-2.417 0-1.362.697-2.534 1.957-2.534zm.008.927c-.642 0-.682.847-.682 1.374 0 .528-.008 1.656.674 1.656.674 0 .706-.91.706-1.464 0-.366-.016-.802-.128-1.152-.097-.305-.29-.414-.57-.414z"/>
    </svg>
  );
}

function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="flex items-center gap-1.5">
        <img src="/DragonBot-logo.png" alt="DragonBot" className="h-5" />
        <span className="font-bold text-sm text-white" style={{ lineHeight: '1' }}>
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
                  <AmazonLogo className={`w-5 h-5 ${dark ? 'text-white/60' : 'text-[#1A1A1A]/60'}`} />
                </div>
                <div>
                  <h3 className={`text-sm font-semibold mb-0.5 ${dark ? 'text-white' : 'text-[#1A1A1A]'}`}>Amazon SP-API Connection</h3>
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
                  <Shield size={10} className={dark ? 'text-white/20' : 'text-[#1A1A1A]/20'} />
                  <span className={`text-[10px] ${dark ? 'text-white/20' : 'text-[#1A1A1A]/20'}`}>{badge}</span>
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
      <p className={`text-[10px] mt-8 ${dark ? 'text-white/20' : 'text-[#1A1A1A]/20'}`}>
        By signing up, you agree to the DragonBot{' '}
        <a href="https://getdragonbot.com/privacy" className="underline hover:text-white/40">Privacy Policy</a>
        {' '}and{' '}
        <a href="https://getdragonbot.com/tos" className="underline hover:text-white/40">Terms of Service</a>
      </p>
    </div>
  );
}