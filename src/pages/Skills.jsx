import { useState, useEffect } from 'react';
import { Puzzle, Search, Sparkles, Box, X, FileText, Layers, ChevronRight } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.dragonsellerbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

export default function Skills({ dark }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // { name, coreContent, extensionContent }
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/skills`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) setSkills((await res.json()).skills || []);
      } catch (err) {
        console.error('Failed to load skills:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSelectSkill(skill) {
    setContentLoading(true);
    setSelected({ name: skill.dirName, displayName: formatName(skill.name), coreContent: null, extensionContent: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/skills/${encodeURIComponent(skill.dirName)}/content`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelected((prev) => prev && { ...prev, coreContent: data.coreContent, extensionContent: data.extensionContent });
      }
    } catch (err) {
      console.error('Failed to load skill content:', err);
    } finally {
      setContentLoading(false);
    }
  }

  const c = (dv, lv) => dark ? dv : lv;

  const filtered = search
    ? skills.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      )
    : skills;

  const extendedCoreSkills = filtered.filter(s => s.type === 'core' && s.hasExtension);
  const plainCoreSkills = filtered.filter(s => s.type === 'core' && !s.hasExtension);
  const customSkills = filtered.filter(s => s.type === 'extension');

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
        <div className="relative mb-6">
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
            <h2 className={`font-clash font-semibold text-lg mb-2 ${c('text-white', 'text-[#1A1A1A]')}`}>No skills found</h2>
          </div>
        ) : (
          <>
            {extendedCoreSkills.length > 0 && (
              <SkillSection title="Extended Core Skills" icon={<Layers size={16} />}
                skills={extendedCoreSkills} dark={dark} onSelect={handleSelectSkill} />
            )}
            {customSkills.length > 0 && (
              <SkillSection title="Custom Skills" icon={<Box size={16} />}
                skills={customSkills} dark={dark} onSelect={handleSelectSkill} />
            )}
            {plainCoreSkills.length > 0 && (
              <SkillSection title="Core Skills" icon={<Sparkles size={16} />}
                skills={plainCoreSkills} dark={dark} onSelect={handleSelectSkill} defaultCollapsed />
            )}
            {filtered.length === 0 && search && (
              <p className={`text-sm font-satoshi text-center py-8 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                No skills matching "{search}"
              </p>
            )}
          </>
        )}
      </div>

      {/* Detail panel (overlay) */}
      {selected && (
        <SkillDetail
          selected={selected}
          loading={contentLoading}
          dark={dark}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function SkillSection({ title, icon, skills, dark, onSelect, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const c = (dv, lv) => dark ? dv : lv;
  return (
    <div className="mb-8">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 mb-4 group"
      >
        <ChevronRight size={14} className={`transition-transform ${collapsed ? '' : 'rotate-90'} ${c('text-white/30', 'text-[#1A1A1A]/30')}`} />
        <span className={c('text-white/40', 'text-[#1A1A1A]/40')}>{icon}</span>
        <h2 className={`text-sm font-satoshi font-medium ${c('text-white/60 group-hover:text-white/80', 'text-[#1A1A1A]/60 group-hover:text-[#1A1A1A]/80')} transition-colors`}>{title}</h2>
        <span className={`text-xs font-satoshi ${c('text-white/20', 'text-[#1A1A1A]/20')}`}>({skills.length})</span>
      </button>
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {skills.map((skill) => (
            <SkillCard key={skill.dirName || skill.name} skill={skill} dark={dark} onClick={() => onSelect(skill)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkillCard({ skill, dark, onClick }) {
  const c = (dv, lv) => dark ? dv : lv;
  const displayName = formatName(skill.name);

  let desc = skill.description || '';
  const useWhenIdx = desc.toLowerCase().indexOf('use when');
  if (useWhenIdx > 0) desc = desc.slice(0, useWhenIdx).trim().replace(/\.\s*$/, '');
  desc = desc.replace(/\.$/, '');

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 transition-colors text-left w-full ${c('bg-[#1a1a1a] border-white/10 hover:border-white/20', 'bg-white border-gray-200 hover:border-gray-300')}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${c('bg-white/5', 'bg-gray-50')}`}>
          {skill.emoji || '🔧'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-satoshi font-medium text-sm ${c('text-white', 'text-[#1A1A1A]')}`}>
              {displayName}
            </h3>
            {skill.hasExtension && (
              <span className="flex items-center gap-0.5 text-[10px] font-satoshi px-1.5 py-0.5 rounded bg-[#2F7D4F]/10 text-[#2F7D4F]">
                <Layers size={10} />
                custom extension
              </span>
            )}
          </div>
          <p className={`text-xs font-satoshi mt-1 leading-relaxed line-clamp-2 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
            {desc}
          </p>
        </div>
      </div>
    </button>
  );
}

function SkillDetail({ selected, loading, dark, onClose }) {
  const [tab, setTab] = useState('core');
  const c = (dv, lv) => dark ? dv : lv;

  const hasCore = !!selected.coreContent;
  const hasExt = !!selected.extensionContent;

  // Auto-select tab based on what's available
  useEffect(() => {
    if (!hasCore && hasExt) setTab('extension');
    else setTab('core');
  }, [hasCore, hasExt]);

  const content = tab === 'core' ? selected.coreContent : selected.extensionContent;

  // Strip YAML frontmatter for display
  const displayContent = content?.replace(/^---\n[\s\S]*?\n---\n*/, '') || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full max-w-2xl max-h-[80vh] rounded-2xl border shadow-2xl flex flex-col ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${c('border-white/10', 'border-gray-200')}`}>
          <h2 className={`font-clash font-semibold text-lg ${c('text-white', 'text-[#1A1A1A]')}`}>
            {selected.displayName}
          </h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${c('hover:bg-white/10', 'hover:bg-gray-100')}`}>
            <X size={18} className={c('text-white/50', 'text-gray-400')} />
          </button>
        </div>

        {/* Tabs (only show if both core and extension exist) */}
        {hasCore && hasExt && (
          <div className={`flex gap-1 px-6 pt-3 flex-shrink-0`}>
            <button
              onClick={() => setTab('core')}
              className={`px-3 py-1.5 rounded-lg text-xs font-satoshi font-medium transition-colors ${
                tab === 'core'
                  ? 'bg-[#2F7D4F]/10 text-[#2F7D4F]'
                  : c('text-white/40 hover:text-white/60', 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60')
              }`}
            >
              <FileText size={12} className="inline mr-1" />
              Core Skill
            </button>
            <button
              onClick={() => setTab('extension')}
              className={`px-3 py-1.5 rounded-lg text-xs font-satoshi font-medium transition-colors ${
                tab === 'extension'
                  ? 'bg-[#2F7D4F]/10 text-[#2F7D4F]'
                  : c('text-white/40 hover:text-white/60', 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60')
              }`}
            >
              <Layers size={12} className="inline mr-1" />
              Custom Extension
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
          ) : !content ? (
            <p className={`text-sm font-satoshi ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>No content available.</p>
          ) : (
            <div className={`prose prose-sm max-w-none font-satoshi ${dark ? 'prose-invert' : ''}`}>
              <Markdown remarkPlugins={[remarkGfm]}>{displayContent}</Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}