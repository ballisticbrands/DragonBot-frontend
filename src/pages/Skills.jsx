import { useState, useEffect, useMemo } from 'react';
import { Puzzle, Search, Sparkles, Box, X, FileText, Layers, ChevronRight, ChevronDown, Folder, FolderOpen, File, Download } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://api.getdragonbot.com';

function getToken() {
  return localStorage.getItem('dragonbot_token') ?? '';
}

export default function Skills({ dark }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem('dragonbot_skills_view') || 'simple');

  useEffect(() => {
    localStorage.setItem('dragonbot_skills_view', view);
  }, [view]);

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

  const c = (dv, lv) => dark ? dv : lv;

  return (
    <div className={`min-h-screen ${c('bg-[#0f0f0f]', 'bg-[#fafafa]')}`}>
      <div className={`px-4 md:px-8 pt-6 pb-3 flex items-center justify-between gap-4 ${view === 'explorer' ? '' : 'max-w-4xl mx-auto'}`}>
        <div>
          <h1 className={`font-semibold text-2xl ${c('text-white', 'text-[#1A1A1A]')}`}>Skills</h1>
          <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
            Capabilities available to your DragonBot
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} dark={dark} />
      </div>

      {view === 'simple' ? (
        <SkillsSimpleView skills={skills} loading={loading} dark={dark} />
      ) : (
        <SkillsFileExplorerView skills={skills} loading={loading} dark={dark} />
      )}
    </div>
  );
}

function ViewToggle({ view, onChange, dark }) {
  const c = (dv, lv) => dark ? dv : lv;
  const Btn = ({ value, label }) => {
    const active = view === value;
    return (
      <button
        onClick={() => onChange(value)}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          active
            ? c('bg-white/10 text-white', 'bg-white text-[#1A1A1A] shadow-sm')
            : c('text-white/50 hover:text-white/80', 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]/80')
        }`}
      >
        {label}
      </button>
    );
  };
  return (
    <div className={`inline-flex p-1 rounded-lg border ${c('bg-[#1a1a1a] border-white/10', 'bg-gray-100 border-gray-200')}`}>
      <Btn value="simple" label="Simple" />
      <Btn value="explorer" label="File explorer" />
    </div>
  );
}

// ─── Simple view (original UI) ──────────────────────────────────────

function SkillsSimpleView({ skills, loading, dark }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const c = (dv, lv) => dark ? dv : lv;

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

  const filtered = search
    ? skills.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      )
    : skills;

  const customSectionSkills = [
    ...filtered.filter(s => s.type === 'core' && s.hasExtension),
    ...filtered.filter(s => s.type === 'extension'),
  ];
  const coreSectionSkills = filtered.filter(s => s.type === 'core');

  return (
    <div className="px-4 md:px-8 pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-6">
          <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${c('text-white/25', 'text-[#1A1A1A]/25')}`} />
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
              c(
                'bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/25 focus:border-white/20',
                'bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:border-gray-300'
              )
            }`}
          />
        </div>

        {loading ? (
          <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
        ) : skills.length === 0 ? (
          <div className={`rounded-2xl border p-8 text-center ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
            <Puzzle size={40} className={`mx-auto mb-4 ${c('text-white/20', 'text-[#1A1A1A]/20')}`} />
            <h2 className={`font-semibold text-lg mb-2 ${c('text-white', 'text-[#1A1A1A]')}`}>No skills found</h2>
          </div>
        ) : (
          <>
            {customSectionSkills.length > 0 && (
              <SkillSection title="Custom Skills" icon={<Box size={16} />}
                skills={customSectionSkills} dark={dark} onSelect={handleSelectSkill} />
            )}
            {coreSectionSkills.length > 0 && (
              <SkillSection title="Core Skills" icon={<Sparkles size={16} />}
                skills={coreSectionSkills} dark={dark} onSelect={handleSelectSkill} defaultCollapsed />
            )}
            {filtered.length === 0 && search && (
              <p className={`text-sm text-center py-8 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
                No skills matching "{search}"
              </p>
            )}
          </>
        )}
      </div>

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
        <h2 className={`text-sm font-medium ${c('text-white/60 group-hover:text-white/80', 'text-[#1A1A1A]/60 group-hover:text-[#1A1A1A]/80')} transition-colors`}>{title}</h2>
        <span className={`text-xs ${c('text-white/20', 'text-[#1A1A1A]/20')}`}>({skills.length})</span>
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
            <h3 className={`font-medium text-sm ${c('text-white', 'text-[#1A1A1A]')}`}>
              {displayName}
            </h3>
            {skill.hasExtension && (
              <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[#2F7D4F]/10 text-[#2F7D4F]">
                <Layers size={10} />
                Extended core skill
              </span>
            )}
          </div>
          <p className={`text-sm mt-1 leading-relaxed line-clamp-2 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>
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

  useEffect(() => {
    if (!hasCore && hasExt) setTab('extension');
    else setTab('core');
  }, [hasCore, hasExt]);

  const content = tab === 'core' ? selected.coreContent : selected.extensionContent;
  const displayContent = content?.replace(/^---\n[\s\S]*?\n---\n*/, '') || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full max-w-2xl max-h-[80vh] rounded-2xl border shadow-2xl flex flex-col ${c('bg-[#1a1a1a] border-white/10', 'bg-white border-gray-200')}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${c('border-white/10', 'border-gray-200')}`}>
          <h2 className={`font-semibold text-lg ${c('text-white', 'text-[#1A1A1A]')}`}>
            {selected.displayName}
          </h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${c('hover:bg-white/10', 'hover:bg-gray-100')}`}>
            <X size={18} className={c('text-white/50', 'text-gray-400')} />
          </button>
        </div>

        {hasCore && hasExt && (
          <div className={`flex gap-1 px-6 pt-3 flex-shrink-0`}>
            <button
              onClick={() => setTab('core')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
          ) : !content ? (
            <p className={`text-sm ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>No content available.</p>
          ) : (
            <div className={`prose prose-sm max-w-none ${dark ? 'prose-invert' : ''}`}>
              <Markdown remarkPlugins={[remarkGfm]}>{displayContent}</Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── File explorer view ────────────────────────────────────────────

function SkillsFileExplorerView({ skills, loading, dark }) {
  // selected = { dirName, source: 'core'|'extension', filePath: string|null }
  const [selected, setSelected] = useState(null);
  const c = (dv, lv) => dark ? dv : lv;

  // Build entries for the explorer:
  //   Core skills section: each core skill, source='core'
  //   Custom skills section: extension-only + core-with-extension (source='extension')
  const { coreEntries, customEntries } = useMemo(() => {
    const core = skills
      .filter((s) => s.type === 'core')
      .map((s) => ({ dirName: s.dirName, name: s.name, emoji: s.emoji, source: 'core' }));
    const custom = [
      ...skills.filter((s) => s.type === 'core' && s.hasExtension),
      ...skills.filter((s) => s.type === 'extension'),
    ].map((s) => ({ dirName: s.dirName, name: s.name, emoji: s.emoji, source: 'extension' }));
    return { coreEntries: core, customEntries: custom };
  }, [skills]);

  function handleSelectFile(skill, filePath) {
    setSelected({ dirName: skill.dirName, name: skill.name, source: skill.source, filePath });
  }

  return (
    <div className="px-4 md:px-8 pb-8">
      <div
        className={`flex rounded-xl border overflow-hidden ${c('bg-[#0f0f0f] border-white/10', 'bg-white border-gray-200')}`}
        style={{ height: 'calc(100vh - 140px)' }}
      >
        {/* Skill file explorer */}
        <div className={`w-72 flex-shrink-0 border-r overflow-y-auto ${c('border-white/10 bg-[#141414]', 'border-gray-200 bg-gray-50')}`}>
          {loading ? (
            <p className={`text-sm p-4 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading...</p>
          ) : (
            <>
              <ExplorerSection title="Custom skills" icon={<Box size={13} />} entries={customEntries} dark={dark} selected={selected} onSelectFile={handleSelectFile} defaultCollapsed={false} />
              <ExplorerSection title="Core skills" icon={<Sparkles size={13} />} entries={coreEntries} dark={dark} selected={selected} onSelectFile={handleSelectFile} defaultCollapsed={false} />
              {coreEntries.length === 0 && customEntries.length === 0 && (
                <p className={`text-sm p-4 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>No skills found.</p>
              )}
            </>
          )}
        </div>

        {/* File viewer */}
        <div className="flex-1 min-w-0 flex flex-col">
          {selected && selected.filePath ? (
            <FileViewer key={`${selected.source}/${selected.dirName}/${selected.filePath}`} selected={selected} dark={dark} />
          ) : (
            <div className={`flex-1 flex items-center justify-center text-sm ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>
              Select a file to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExplorerSection({ title, icon, entries, dark, selected, onSelectFile, defaultCollapsed }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const c = (dv, lv) => dark ? dv : lv;

  return (
    <div className="py-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold ${c('text-white/50 hover:text-white/70', 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70')}`}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        <span className="opacity-60">{icon}</span>
        <span>{title}</span>
        <span className={`ml-auto text-[10px] font-normal ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>{entries.length}</span>
      </button>
      {!collapsed && (
        <div>
          {entries.map((entry) => (
            <SkillExplorerNode
              key={`${entry.source}-${entry.dirName}`}
              entry={entry}
              dark={dark}
              selected={selected}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SkillExplorerNode({ entry, dark, selected, onSelectFile }) {
  const [expanded, setExpanded] = useState(false);
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const c = (dv, lv) => dark ? dv : lv;

  async function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && tree === null && !loading) {
      setLoading(true);
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/skills/${encodeURIComponent(entry.dirName)}/tree?source=${entry.source}`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setTree(data.tree || []);
        } else {
          setTree([]);
        }
      } catch {
        setTree([]);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleDownloadZip(e) {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      const url = `${BACKEND_URL}/api/skills/${encodeURIComponent(entry.dirName)}/download?source=${entry.source}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${entry.dirName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Skill zip download failed:', err);
    } finally {
      setDownloading(false);
    }
  }

  const isThisSkill = selected && selected.dirName === entry.dirName && selected.source === entry.source;

  return (
    <div>
      <div className={`group flex items-center gap-1 pl-5 pr-2 py-1 text-sm ${c('text-white/80 hover:bg-white/5', 'text-[#1A1A1A]/80 hover:bg-gray-100')}`}>
        <button onClick={toggle} className="flex items-center gap-1 min-w-0 flex-1 text-left">
          {expanded ? <ChevronDown size={12} className="opacity-50 flex-shrink-0" /> : <ChevronRight size={12} className="opacity-50 flex-shrink-0" />}
          {expanded ? <FolderOpen size={13} className="flex-shrink-0 text-[#2F7D4F]" /> : <Folder size={13} className="flex-shrink-0 text-[#2F7D4F]" />}
          <span className="truncate">{entry.dirName}</span>
        </button>
        <button
          onClick={handleDownloadZip}
          disabled={downloading}
          title="Download skill as zip"
          className={`flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 ${c('hover:bg-white/10 text-white/60', 'hover:bg-gray-200 text-[#1A1A1A]/60')}`}
        >
          <Download size={11} />
        </button>
      </div>
      {expanded && (
        <div className="pl-5">
          {loading ? (
            <p className={`text-xs px-3 py-1 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>Loading…</p>
          ) : tree && tree.length > 0 ? (
            tree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                dark={dark}
                onSelectFile={(path) => onSelectFile(entry, path)}
                selectedPath={isThisSkill ? selected.filePath : null}
              />
            ))
          ) : (
            <p className={`text-xs px-3 py-1 ${c('text-white/30', 'text-[#1A1A1A]/30')}`}>Empty</p>
          )}
        </div>
      )}
    </div>
  );
}

function TreeNode({ node, depth, dark, onSelectFile, selectedPath }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const c = (dv, lv) => dark ? dv : lv;
  const indent = { paddingLeft: `${depth * 12 + 12}px` };

  if (node.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={indent}
          className={`w-full flex items-center gap-1 pr-3 py-1 text-sm ${c('text-white/70 hover:bg-white/5', 'text-[#1A1A1A]/70 hover:bg-gray-100')}`}
        >
          {expanded ? <ChevronDown size={11} className="opacity-50 flex-shrink-0" /> : <ChevronRight size={11} className="opacity-50 flex-shrink-0" />}
          {expanded ? <FolderOpen size={12} className="flex-shrink-0 opacity-70" /> : <Folder size={12} className="flex-shrink-0 opacity-70" />}
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children?.map((child) => (
          <TreeNode key={child.path} node={child} depth={depth + 1} dark={dark} onSelectFile={onSelectFile} selectedPath={selectedPath} />
        ))}
      </div>
    );
  }

  const isSelected = selectedPath === node.path;
  return (
    <button
      onClick={() => onSelectFile(node.path)}
      style={indent}
      className={`w-full flex items-center gap-1 pr-3 py-1 text-sm ${
        isSelected
          ? c('bg-[#2F7D4F]/15 text-white', 'bg-[#2F7D4F]/10 text-[#1A1A1A]')
          : c('text-white/70 hover:bg-white/5', 'text-[#1A1A1A]/70 hover:bg-gray-100')
      }`}
    >
      <span className="w-[11px] flex-shrink-0" />
      <File size={12} className="flex-shrink-0 opacity-60" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function FileViewer({ selected, dark }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const c = (dv, lv) => dark ? dv : lv;

  const isMarkdown = selected.filePath.toLowerCase().endsWith('.md');
  const fileName = selected.filePath.split('/').pop();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent(null);
    (async () => {
      try {
        const url = `${BACKEND_URL}/api/skills/${encodeURIComponent(selected.dirName)}/file?source=${selected.source}&path=${encodeURIComponent(selected.filePath)}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (!res.ok) {
          if (!cancelled) setError(`Failed to load (${res.status})`);
          return;
        }
        const text = await res.text();
        if (!cancelled) setContent(text);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selected.dirName, selected.source, selected.filePath]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const url = `${BACKEND_URL}/api/skills/${encodeURIComponent(selected.dirName)}/file?source=${selected.source}&path=${encodeURIComponent(selected.filePath)}&download=1`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }

  // Strip YAML frontmatter only for markdown rendering
  const mdContent = isMarkdown ? (content?.replace(/^---\n[\s\S]*?\n---\n*/, '') || '') : '';

  return (
    <>
      <div className={`flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0 ${c('border-white/10 bg-[#141414]', 'border-gray-200 bg-gray-50')}`}>
        <div className="flex items-center gap-2 min-w-0">
          <File size={14} className={c('text-white/40', 'text-[#1A1A1A]/40')} />
          <span className={`text-xs font-mono truncate ${c('text-white/70', 'text-[#1A1A1A]/70')}`}>
            {selected.dirName}/{selected.filePath}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
            selected.source === 'core'
              ? 'bg-[#2F7D4F]/10 text-[#2F7D4F]'
              : 'bg-amber-500/10 text-amber-500'
          }`}>
            {selected.source}
          </span>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${c('bg-white/5 hover:bg-white/10 text-white/80', 'bg-white border border-gray-200 hover:bg-gray-50 text-[#1A1A1A]/80')}`}
        >
          <Download size={12} />
          {downloading ? 'Downloading…' : 'Download'}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <p className={`text-sm p-4 ${c('text-white/40', 'text-[#1A1A1A]/40')}`}>Loading…</p>
        ) : error ? (
          <p className={`text-sm p-4 text-red-400`}>{error}</p>
        ) : isMarkdown ? (
          <div className={`prose prose-sm max-w-none p-6 ${dark ? 'prose-invert' : ''}`}>
            <Markdown remarkPlugins={[remarkGfm]}>{mdContent}</Markdown>
          </div>
        ) : (
          <pre className={`text-xs font-mono p-4 whitespace-pre-wrap break-words ${c('text-white/80', 'text-[#1A1A1A]/80')}`}>
            {content}
          </pre>
        )}
      </div>
    </>
  );
}

function formatName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
