import { useMemo, useState, useCallback } from 'react';
import { Download, FileText, Link2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import TabNavigation from './components/TabNavigation';
import MCPIntegration from './components/MCPIntegration';
import Hero from './components/Hero';
import TranscriptDisplay from './components/TranscriptDisplay';
import SkeletonLoader from './components/SkeletonLoader';
import EmptyState from './components/EmptyState';
import ErrorToast from './components/ErrorToast';
import Footer from './components/Footer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getSummary(lines) {
  if (!lines.length) return 'No transcript content available for summary.';
  const joined = lines.slice(0, 6).map((line) => line.text).join(' ');
  if (!joined.trim()) return 'Transcript extracted successfully.';
  return `${joined.slice(0, 380)}${joined.length > 380 ? '...' : ''}`;
}

function getTakeaways(lines) {
  if (!lines.length) return ['Transcript extraction completed.'];
  return lines.slice(0, 5).map((line) => `[${line.timestamp}] ${line.text}`).filter(Boolean);
}

function buildMarkdown(result) {
  const summary = getSummary(result.transcript_lines);
  const takeaways = getTakeaways(result.transcript_lines);
  const transcriptSection = result.transcript_lines
    .map((line) => `- **[${line.timestamp}]** ${line.text}`)
    .join('\n');
  return (
    `# ${result.title}\n\n` +
    `- **Video ID:** ${result.video_id}\n` +
    `- **Language:** ${result.language}\n` +
    `- **Source URL:** https://www.youtube.com/watch?v=${result.video_id}\n\n` +
    `## Summary\n\n${summary}\n\n` +
    `## Takeaways\n\n${takeaways.map((item) => `- ${item}`).join('\n')}\n\n` +
    `## Transcript\n\n${transcriptSection}`
  );
}

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [activeTab, setActiveTab] = useState('transcript');
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lineCount = useMemo(() => result?.transcript_lines?.length ?? 0, [result]);

  const handleExtract = useCallback(async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    const trimmed = url.trim();
    if (!trimmed) { setError('Paste a YouTube URL first.'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, language: language.trim() || 'en' }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.detail || 'Failed to extract transcript');
      }
      setResult(await response.json());
    } catch (extractError) {
      setError(extractError.message || 'Extraction failed.');
    } finally {
      setLoading(false);
    }
  }, [url, language]);

  const handleDownloadTxt = useCallback(() => {
    if (!result) return;
    downloadBlob(`${result.video_id}.txt`, result.transcript_text, 'text/plain;charset=utf-8');
  }, [result]);

  const handleDownloadMd = useCallback(() => {
    if (!result) return;
    downloadBlob(`${result.video_id}.md`, buildMarkdown(result), 'text/markdown;charset=utf-8');
  }, [result]);

  return (
    <motion.main role="main"
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
              {/* Input Section — glassmorphism card with neon glow */}
              <motion.section role="region"
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
                      className="inline-flex items-center justify-center gap-2.5 rounded-xl btn-gold px-7 py-3.5 text-sm font-bold text-[#0A1832] rounded-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-none"
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
              {result ? (
                <motion.section role="region"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8 rounded-2xl border border-white/[0.06] glassmorphism p-6 shadow-[0_0_30px_rgba(0,212,255,0.02)]"
                >
                  <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{result.title}</h2>
                      <p className="mt-1.5 text-sm text-slate-400">
                        {lineCount} lines • {result.language.toUpperCase()} • ID: {result.video_id} •{' '}
                        <span className="text-[#C8A941]/80">{result.extraction_ms}ms</span>
                      </p>
                    </div>
                    <div className="flex gap-2.5">
                      <motion.button
                        type="button"
                        onClick={handleDownloadTxt}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-slate-300 hover:border-[#C8A941]/40 hover:bg-[#C8A941]/[0.06] hover:text-[#E8C85A] transition-all"
                      >
                        <Download className="h-4 w-4" />
                        TXT
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={handleDownloadMd}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#00D4FF]/30 bg-[#00D4FF]/[0.06] px-4 py-2 text-sm text-[#7AE8FF] hover:bg-[#00D4FF]/[0.1] transition-all"
                      >
                        <Download className="h-4 w-4" />
                        MD
                      </motion.button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <TranscriptDisplay lines={result.transcript_lines} />
                  </div>
                </motion.section>
              ) : loading ? (
                <motion.section role="region"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8"
                >
                  <SkeletonLoader lines={6} />
                </motion.section>
              ) : (
                <motion.section role="region"
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
