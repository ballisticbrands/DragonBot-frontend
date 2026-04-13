import { useState, useEffect } from 'react';
import { Sparkles, Zap } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

const PRESETS = [
  {
    id: 'smartest',
    model: 'anthropic/claude-opus-4-6',
    name: 'Smartest',
    badge: 'Recommended',
    badgeColor: 'bg-[#CCFFE5] text-[#006633]',
    description: 'Currently uses Claude Opus 4.6. Most capable model. Ideal for complex, high-stakes workflows.',
    icon: Sparkles,
  },
  {
    id: 'balanced',
    model: 'anthropic/claude-sonnet-4-6',
    name: 'Balanced',
    badge: '~50% cheaper',
    badgeColor: '',
    description: 'Currently uses Claude Sonnet 4.6. Good balance of quality and cost for everyday tasks.',
    icon: Zap,
  },
];


export default function Settings({ dark }) {
  const [currentModel, setCurrentModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings/model`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentModel(data.model);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function selectModel(model) {
    if (model === currentModel || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/model`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model }),
      });
      if (res.ok) {
        setCurrentModel(model);
      }
    } catch (err) {
      console.error('Failed to update model:', err);
    } finally {
      setSaving(false);
    }
  }

  const c = (dv, lv) => dark ? dv : lv;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-clash font-bold ${c('text-white', 'text-[#1A1A1A]')}`}>Settings</h1>
        </div>

        {loading ? (
          <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
        ) : (
          <div className={`rounded-xl ${c('bg-[#1a1a1a]', 'bg-white border border-gray-200')}`}>
            <div className="p-5 flex flex-col gap-2">
              <h2 className={`text-base font-semibold ${c('text-white', 'text-[#1A1A1A]')}`}>Default AI model</h2>
              <p className={`text-sm max-w-xl ${c('text-white/50', 'text-[#1A1A1A]/50')}`}>
                Sets the default model for your DragonBot's conversations and scheduled tasks.
              </p>
            </div>

            <div className="px-5 pb-5 flex max-w-xl flex-col gap-4">
              {/* Presets */}
              <div className="flex flex-col gap-2">
                <span className={`text-sm font-medium ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Presets</span>
                {PRESETS.map((preset) => (
                  <ModelCard
                    key={preset.id}
                    dark={dark}
                    name={preset.name}
                    description={preset.description}
                    badge={preset.badge}
                    badgeColor={preset.badgeColor}
                    selected={currentModel === preset.model}
                    saving={saving}
                    onClick={() => selectModel(preset.model)}
                  />
                ))}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelCard({ dark, name, description, badge, badgeColor, selected, saving, onClick }) {
  const c = (dv, lv) => dark ? dv : lv;
  return (
    <label
      onClick={onClick}
      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
        selected
          ? c('border-[#2F7D4F] bg-[#2F7D4F]/5', 'border-[#2F7D4F] bg-[#2F7D4F]/5')
          : c('border-white/10 bg-[#1a1a1a] hover:bg-white/[0.03]', 'border-gray-200 bg-white hover:bg-gray-50')
      } ${saving ? 'opacity-50 cursor-wait' : ''}`}
    >
      {/* Radio */}
      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
        selected
          ? 'border-[#2F7D4F]'
          : c('border-white/20', 'border-gray-300')
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-[#2F7D4F]" />}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${c('text-white', 'text-[#1A1A1A]')}`}>{name}</span>
          {badge && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              badgeColor || c('bg-white/5 text-white/50', 'bg-gray-100 text-gray-500')
            }`}>
              {badge}
            </span>
          )}
        </span>
        <span className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>{description}</span>
      </div>
    </label>
  );
}