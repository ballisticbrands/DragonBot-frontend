import { useState, useEffect } from 'react';
import { Puzzle, Search, Sparkles, Box } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.dragonsellerbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [systemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = systemDark;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/skills`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSkills(data.skills || []);
        }
      } catch (err) {
        console.error('Failed to load skills:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const c = (dv, lv) => dark ? dv : lv;

  const filtered = search
    ? skills.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      )
    : skills;

  const coreSkills = filtered.filter(s => s.type === 'core');
  const extensionSkills = filtered.filter(s => s.type === 'extension');

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`font-clash font-semibold text-2xl ${c('text-white', 'text-[#1A1A1A]')}`}>Skills</h1>
            <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              Capabilities available to your DragonBot
            </p>
          </div>
          <div className={`flex items-center gap-2 text-xs font-satoshi ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
            <span className="tabular-nums">{skills.length}</span> skills
          </div>
        </div>

        {/* Search */}
        <div className={`relative mb-6`}>
          <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${c('text-white/25', 'text-[#1A1A1A]/25')}`} />
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-satoshi border outline-none transition-colors ${
              c(
                'bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/25 focus:border-white/20',
                'bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:border-gray-300'
              )
            }`}
          />
        </div>

        {loading ? (
          <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
        ) : skills.length === 0 ? (
          <div className={`rounded-2xl border p-8 text-center ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
            <Puzzle size={40} className={`mx-auto mb-4 ${c('text-white/20', 'text-[#1A1A1A]/20')}`} />
            <h2 className={`font-clash font-semibold text-lg mb-2 ${c('text-white', 'text-[#1A1A1A]')}`}>
              No skills found
            </h2>
            <p className={`text-sm font-satoshi max-w-md mx-auto ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
              Skills will appear here once your DragonBot is set up.
            </p>
          </div>
        ) : (
          <>
            {/* Core skills */}
            {coreSkills.length > 0 && (
              <SkillSection
                title="Core Skills"
                subtitle="Built-in platform capabilities"
                icon={<Sparkles size={16} />}
                skills={coreSkills}
                dark={dark}
              />
            )}

            {/* Extension skills */}
            {extensionSkills.length > 0 && (
              <SkillSection
                title="Extensions"
                subtitle="Custom skills for your workspace"
                icon={<Box size={16} />}
                skills={extensionSkills}
                dark={dark}
              />
            )}

            {filtered.length === 0 && search && (
              <p className={`text-sm font-satoshi text-center py-8 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                No skills matching "{search}"
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkillSection({ title, subtitle, icon, skills, dark }) {
  const c = (dv, lv) => dark ? dv : lv;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className={c('text-white/40', 'text-[#1A1A1A]/40')}>{icon}</span>
        <h2 className={`text-sm font-satoshi font-medium ${c('text-white/60', 'text-[#1A1A1A]/60')}`}>{title}</h2>
        <span className={`text-xs font-satoshi ${c('text-white/20', 'text-[#1A1A1A]/20')}`}>({skills.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {skills.map((skill) => (
          <SkillCard key={skill.name} skill={skill} dark={dark} />
        ))}
      </div>
    </div>
  );
}

function SkillCard({ skill, dark }) {
  const c = (dv, lv) => dark ? dv : lv;

  // Format the skill name: replace underscores/hyphens with spaces, title case
  const displayName = skill.name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Truncate description at the "Use when" part for cleaner display
  let desc = skill.description || '';
  const useWhenIdx = desc.toLowerCase().indexOf('use when');
  if (useWhenIdx > 0) desc = desc.slice(0, useWhenIdx).trim().replace(/\.\s*$/, '');
  // Remove trailing period for consistency
  desc = desc.replace(/\.$/, '');

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${c('bg-[#1a1a1a] border-white/10 hover:border-white/15', 'bg-white border-gray-200 hover:border-gray-300')}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
          c('bg-white/5', 'bg-gray-50')
        }`}>
          {skill.emoji || '🔧'}
        </div>
        <div className="min-w-0">
          <h3 className={`font-satoshi font-medium text-sm ${c('text-white', 'text-[#1A1A1A]')}`}>
            {displayName}
          </h3>
          <p className={`text-xs font-satoshi mt-1 leading-relaxed line-clamp-2 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}
