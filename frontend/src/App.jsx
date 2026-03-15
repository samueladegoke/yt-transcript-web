import { useMemo, useState, useCallback } from 'react';
import {
  Download,
  FileText,
  Link2,
  Loader2,
  Copy,
  Check,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCode,
  Link as LinkIcon,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TabNavigation from './components/TabNavigation';
import MCPIntegration from './components/MCPIntegration';
import Hero from './components/Hero';
import TranscriptDisplay from './components/TranscriptDisplay';
import SkeletonLoader from './components/SkeletonLoader';
import EmptyState from './components/EmptyState';
import ErrorToast from './components/ErrorToast';
import Footer from './components/Footer';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:8000');

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function downloadBlob(content, filename, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getSafeFilename(title, suffix = '') {
  const base = title || 'transcript';
  const date = new Date().toISOString().split('T')[0];
  const clean = base.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
  return `${clean}_${date}${suffix}`;
}

// ─── VideoInfo Component (premium design) ────────────────────────────────────

function VideoInfo({ data }) {
  const [descExpanded, setDescExpanded] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${data.video_id}/maxresdefault.jpg`;
  const fallbackThumbnail = `https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`;
  const [imgSrc, setImgSrc] = useState(thumbnailUrl);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-white/[0.06] glassmorphism p-6 shadow-[0_0_30px_rgba(200,169,65,0.04)]"
    >
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden rounded-xl md:w-80">
          <img
            src={imgSrc}
            alt={data.title}
            onError={() => setImgSrc(fallbackThumbnail)}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <a
            href={`https://www.youtube.com/watch?v=${data.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
          >
            <PlayCircle className="h-16 w-16 text-white" />
          </a>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-white md:text-3xl font-display">
              {data.title}
            </h2>
            <p className="mt-2 text-lg font-medium text-[#00D4FF]">{data.channel}</p>

            {/* Meta pills */}
            <div className="mt-3 flex flex-wrap gap-2">
              {data.duration && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C8A941]/[0.08] px-3 py-1 text-xs font-semibold text-[#E8C85A]">
                  ⏱ {data.duration}
                </span>
              )}
              {data.view_count && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00D4FF]/[0.08] px-3 py-1 text-xs font-semibold text-[#7AE8FF]">
                  👁 {data.view_count}
                </span>
              )}
              {data.upload_date && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400">
                  📅 {data.upload_date}
                </span>
              )}
            </div>
          </div>

          {/* Description with expand/collapse */}
          {data.description && (
            <div className="mt-4">
              <div
                className={`overflow-hidden text-sm leading-relaxed text-slate-400 transition-all duration-300 ${
                  descExpanded ? 'max-h-96' : 'max-h-16'
                }`}
              >
                {data.description.split('\n').map((line, i) => (
                  <p key={i} className={line.trim() === '' ? 'h-2' : ''}>
                    {line}
                  </p>
                ))}
              </div>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-[#00D4FF] hover:text-[#7AE8FF] transition-colors"
              >
                {descExpanded ? (
                  <>
                    Show less <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

// ─── SearchBar Component (premium design) ────────────────────────────────────

function SearchBar({ value, onChange, resultCount }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        placeholder="Search in transcript..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/[0.08] bg-[#0A1832]/60 backdrop-blur-sm py-3 pl-10 pr-24 text-sm text-slate-100 outline-none transition placeholder:text-slate-500/60 focus:border-[#C8A941]/60 focus:ring-2 focus:ring-[#C8A941]/10"
      />
      {value && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#C8A941]/80 font-medium">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

// ─── Filtered Transcript Display (wraps existing TranscriptDisplay) ──────────

function FilteredTranscriptDisplay({ lines, searchQuery }) {
  const filtered = useMemo(() => {
    if (!searchQuery) return lines;
    const q = searchQuery.toLowerCase();
    return lines.filter((line) => line.text.toLowerCase().includes(q));
  }, [lines, searchQuery]);

  if (filtered.length === 0 && searchQuery) {
    return (
      <div className="flex h-[40vh] items-center justify-center rounded-xl border border-white/[0.04] bg-[#0A1832]/40">
        <p className="text-slate-500">No matches found for "{searchQuery}"</p>
      </div>
    );
  }

  return <TranscriptDisplay lines={filtered} />;
}

// ─── DownloadOptions + AI Analysis Component (premium design) ────────────────

function DownloadOptions({ data, url }) {
  const [copied, setCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  // Build download content from available data
  const transcriptLines = data.transcript_lines || data.transcript || [];
  const plainText = data.plain_text || transcriptLines.map((l) => l.text).join('\n');
  const plainTextWithTimestamps =
    data.plain_text_with_timestamps ||
    transcriptLines.map((l) => `[${l.timestamp || formatTime(l.start)}] ${l.text}`).join('\n');
  const markdown =
    data.markdown ||
    `# ${data.title}\n\n${transcriptLines.map((l) => `- **[${l.timestamp || formatTime(l.start)}]** ${l.text}`).join('\n')}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = plainText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAIAnalysis = async (analysisType) => {
    setAiLoading(analysisType);
    setAiResult(null);
    setAiError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, type: analysisType, transcript: plainTextWithTimestamps }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Analysis failed');
      setAiResult(result);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(null);
    }
  };

  const aiButtons = [
    { type: 'summary', label: 'Summary', icon: '📝' },
    { type: 'action_points', label: 'Action Points', icon: '🎯' },
    { type: 'next_steps', label: 'Next Steps', icon: '🚀' },
    { type: 'structured_edit', label: 'Professional Edit', icon: '✨' },
  ];

  return (
    <div className="space-y-5">
      {/* Download buttons */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#A08040]/70">
          Download
        </h3>
        <div className="flex flex-wrap gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => downloadBlob(plainTextWithTimestamps, `${getSafeFilename(data.title)}.txt`)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 hover:border-[#C8A941]/40 hover:bg-[#C8A941]/[0.06] hover:text-[#E8C85A] transition-all"
          >
            <FileText className="h-4 w-4" />
            TXT (timestamps)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => downloadBlob(plainText, `${getSafeFilename(data.title, '_clean')}.txt`)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 hover:border-[#C8A941]/40 hover:bg-[#C8A941]/[0.06] hover:text-[#E8C85A] transition-all"
          >
            <FileText className="h-4 w-4" />
            TXT (clean)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => downloadBlob(markdown, `${getSafeFilename(data.title)}.md`, 'text/markdown;charset=utf-8')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#00D4FF]/20 bg-[#00D4FF]/[0.04] px-4 py-2.5 text-sm text-[#7AE8FF] hover:bg-[#00D4FF]/[0.08] transition-all"
          >
            <FileCode className="h-4 w-4" />
            Markdown
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const srt = transcriptLines
                .map((l, i) => {
                  const start = l.start || l.seconds || 0;
                  const end = start + 3;
                  return `${i + 1}\n${formatTime(start).replace('.', ',')} --> ${formatTime(end).replace('.', ',')}\n${l.text}\n`;
                })
                .join('\n');
              downloadBlob(srt, `${getSafeFilename(data.title)}.srt`, 'text/plain;charset=utf-8');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 hover:border-purple-400/40 hover:bg-purple-400/[0.06] hover:text-purple-300 transition-all"
          >
            <FileText className="h-4 w-4" />
            SRT
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              downloadBlob(JSON.stringify(data, null, 2), `${getSafeFilename(data.title)}.json`, 'application/json')
            }
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 hover:border-purple-400/40 hover:bg-purple-400/[0.06] hover:text-purple-300 transition-all"
          >
            <FileCode className="h-4 w-4" />
            JSON
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg bg-[#C8A941] px-5 py-2.5 text-sm font-bold text-[#0A1832] hover:bg-[#E8C85A] transition-all shadow-[0_0_20px_rgba(200,169,65,0.2)]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy All
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* AI Analysis buttons */}
      <div className="border-t border-white/[0.06] pt-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-purple-300/70">
          <Sparkles className="h-4 w-4 text-purple-400" />
          AI Analysis
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {aiButtons.map(({ type, label, icon }) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAIAnalysis(type)}
              disabled={!!aiLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-purple-400/20 bg-purple-400/[0.06] px-4 py-2.5 text-sm text-purple-300 hover:bg-purple-400/[0.12] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(168,85,247,0.06)]"
            >
              {aiLoading === type ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>{icon}</span>
              )}
              {aiLoading === type ? 'Analyzing...' : label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* AI Results display */}
      <AnimatePresence>
        {(aiResult || aiError) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-purple-400/15 bg-purple-400/[0.04] p-5"
          >
            {aiError ? (
              <p className="text-sm text-red-400">Error: {aiError}</p>
            ) : (
              <div className="space-y-4">
                {/* Render result based on what's returned */}
                {aiResult?.result && typeof aiResult.result === 'object' ? (
                  Object.entries(aiResult.result).map(([key, value]) => (
                    <div key={key}>
                      <h4 className="mb-2 text-sm font-semibold text-purple-300 capitalize">
                        {key.replace(/_/g, ' ')}
                      </h4>
                      <div className="rounded-lg bg-[#0A1832]/60 p-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </div>
                    </div>
                  ))
                ) : aiResult?.summary ? (
                  <div className="rounded-lg bg-[#0A1832]/60 p-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {aiResult.summary}
                  </div>
                ) : (
                  <pre className="rounded-lg bg-[#0A1832]/60 p-4 text-xs text-slate-400 overflow-auto max-h-96">
                    {JSON.stringify(aiResult, null, 2)}
                  </pre>
                )}

                {/* Copy + Download for AI results */}
                <div className="flex gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const text =
                        aiResult?.result && typeof aiResult.result === 'object'
                          ? Object.entries(aiResult.result)
                              .map(([k, v]) => `## ${k.replace(/_/g, ' ')}\n\n${typeof v === 'string' ? v : JSON.stringify(v, null, 2)}`)
                              .join('\n\n')
                          : JSON.stringify(aiResult, null, 2);
                      downloadBlob(text, `${getSafeFilename(data.title, '_analysis')}.md`, 'text/markdown;charset=utf-8');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-400/20 bg-purple-400/[0.06] px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-400/[0.12] transition-all"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Links Component (premium design) ────────────────────────────────────────

function LinkList({ links }) {
  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const groupedLinks = useMemo(() => {
    if (!links || !links.length) return {};
    const groups = {};
    links.forEach((link) => {
      const domain = getDomain(link);
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(link);
    });
    return groups;
  }, [links]);

  if (!links || links.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0A1832]/40 p-8 text-center">
        <LinkIcon className="mx-auto h-12 w-12 text-slate-600" />
        <p className="mt-4 text-slate-400">No links found in the video description</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Found {links.length} link{links.length !== 1 ? 's' : ''} in the description
      </p>
      {Object.entries(groupedLinks).map(([domain, domainLinks]) => (
        <div key={domain} className="rounded-xl border border-white/[0.06] bg-[#0A1832]/40 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#00D4FF]" />
            {domain}
          </h4>
          <ul className="space-y-2">
            {domainLinks.map((link, idx) => (
              <li key={idx}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg bg-white/[0.02] p-3 transition hover:bg-white/[0.04]"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    alt=""
                    className="h-5 w-5 flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="flex-1 truncate text-sm text-[#00D4FF] group-hover:text-[#7AE8FF]">
                    {link}
                  </span>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-slate-500 opacity-0 transition group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState('transcript');
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const lineCount = useMemo(() => {
    if (result?.transcript_lines) return result.transcript_lines.length;
    if (result?.transcript) return result.transcript.length;
    return 0;
  }, [result]);

  // Normalize result: ensure transcript_lines is always available
  const normalizedResult = useMemo(() => {
    if (!result) return null;
    return {
      ...result,
      transcript_lines: result.transcript_lines || result.transcript || [],
    };
  }, [result]);

  const filteredCount = useMemo(() => {
    if (!searchQuery || !normalizedResult?.transcript_lines) return 0;
    const q = searchQuery.toLowerCase();
    return normalizedResult.transcript_lines.filter((l) => l.text.toLowerCase().includes(q)).length;
  }, [searchQuery, normalizedResult]);

  const handleExtract = useCallback(
    async (event) => {
      event.preventDefault();
      setError('');
      setResult(null);
      setSearchQuery('');
      const trimmed = url.trim();
      if (!trimmed) {
        setError('Paste a YouTube URL first.');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/video-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || data.detail || 'Failed to extract transcript');
        }
        const data = await response.json();
        setResult(data);
      } catch (extractError) {
        setError(extractError.message || 'Extraction failed.');
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#0A1832] bg-[radial-gradient(ellipse_at_top_right,rgba(18,34,64,0.8),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(0,30,60,0.4),transparent_60%)] text-slate-100"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Hero />

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === 'transcript' ? (
            <>
              {/* Input Section — glassmorphism card */}
              <motion.section
                role="region"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="card-highlight rounded-2xl border border-white/[0.06] glassmorphism p-6 sm:p-10 shadow-[0_0_40px_rgba(200,169,65,0.06),0_8px_32px_rgba(0,0,0,0.2)]"
              >
                <form className="space-y-6" onSubmit={handleExtract}>
                  {/* URL Input */}
                  <div>
                    <label className="mb-2.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[#A08040]/80">
                      YouTube URL
                    </label>
                    <div className="group relative">
                      <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0A1832]/60 backdrop-blur-sm px-4 py-3.5 transition-all focus-within:border-[#C8A941]/60 focus-within:ring-2 focus-within:ring-[#C8A941]/10 focus-within:shadow-[0_0_20px_rgba(200,169,65,0.06)]">
                        <Link2 className="h-5 w-5 text-[#A08040]/60 group-focus-within:text-[#C8A941] transition-colors" />
                        <input
                          className="w-full bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500/60"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={url}
                          onChange={(event) => setUrl(event.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Language & Submit */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <label className="flex items-center gap-3 text-sm text-slate-400">
                      <span className="text-slate-500 font-medium">Language</span>
                      <input
                        className="w-20 rounded-lg border border-white/[0.08] bg-[#0A1832]/60 px-3 py-2 text-sm lowercase text-slate-100 outline-none focus:border-[#00D4FF]/60 transition-colors"
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                        maxLength={10}
                      />
                    </label>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center justify-center gap-2.5 rounded-xl btn-gold px-7 py-3.5 text-sm font-bold text-[#0A1832] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-none"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                      {loading ? 'Extracting...' : 'Extract Transcript'}
                    </motion.button>
                  </div>
                </form>
              </motion.section>

              {/* Results Section */}
              {normalizedResult ? (
                <div className="mt-8 space-y-6">
                  {/* Video Info */}
                  <VideoInfo data={normalizedResult} />

                  {/* Download Options + AI Analysis */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="rounded-2xl border border-white/[0.06] glassmorphism p-6 shadow-[0_0_30px_rgba(168,85,247,0.03)]"
                  >
                    <DownloadOptions data={normalizedResult} url={url} />
                  </motion.section>

                  {/* Transcript with Search */}
                  <motion.section
                    role="region"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="rounded-2xl border border-white/[0.06] glassmorphism p-6 shadow-[0_0_30px_rgba(0,212,255,0.02)]"
                  >
                    {/* Header with search */}
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">{normalizedResult.title}</h2>
                        <p className="mt-1.5 text-sm text-slate-400">
                          {lineCount} lines • {language.toUpperCase()} • ID: {normalizedResult.video_id}
                        </p>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-4">
                      <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        resultCount={filteredCount}
                      />
                    </div>

                    {/* Transcript Display (filtered or full) */}
                    <FilteredTranscriptDisplay
                      lines={normalizedResult.transcript_lines}
                      searchQuery={searchQuery}
                    />

                    {/* Links section (if available) */}
                    {normalizedResult.links && normalizedResult.links.length > 0 && (
                      <div className="mt-6 border-t border-white/[0.06] pt-5">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#A08040]/70">
                          <LinkIcon className="h-4 w-4" />
                          Extracted Links ({normalizedResult.links.length})
                        </h3>
                        <LinkList links={normalizedResult.links} />
                      </div>
                    )}
                  </motion.section>
                </div>
              ) : loading ? (
                <motion.section
                  role="region"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8"
                >
                  <SkeletonLoader lines={6} />
                </motion.section>
              ) : (
                <motion.section
                  role="region"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8"
                >
                  <EmptyState />
                </motion.section>
              )}
            </>
          ) : (
            <MCPIntegration />
          )}
        </TabNavigation>

        <Footer />
      </div>

      <ErrorToast error={error} onClose={() => setError('')} />
    </motion.main>
  );
}

export default App;
