import { useMemo, useState } from 'react';
import { Download, FileText, Link2, Loader2, Sparkles } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getSummary(lines) {
  if (!lines.length) {
    return 'No transcript content available for summary.';
  }

  const joined = lines.slice(0, 6).map((line) => line.text).join(' ');
  if (!joined.trim()) {
    return 'Transcript extracted successfully.';
  }
  return `${joined.slice(0, 380)}${joined.length > 380 ? '...' : ''}`;
}

function getTakeaways(lines) {
  if (!lines.length) {
    return ['Transcript extraction completed.'];
  }

  return lines
    .slice(0, 5)
    .map((line) => `[${line.timestamp}] ${line.text}`)
    .filter(Boolean);
}

function buildMarkdown(result) {
  const summary = getSummary(result.transcript_lines);
  const takeaways = getTakeaways(result.transcript_lines);

  const transcriptSection = result.transcript_lines
    .map((line) => `- **[${line.timestamp}]** ${line.text}`)
    .join('\n');

  return `# ${result.title}\n\n` +
    `- **Video ID:** ${result.video_id}\n` +
    `- **Language:** ${result.language}\n` +
    `- **Source URL:** https://www.youtube.com/watch?v=${result.video_id}\n\n` +
    `## Summary\n\n${summary}\n\n` +
    `## Takeaways\n\n${takeaways.map((item) => `- ${item}`).join('\n')}\n\n` +
    `## Transcript\n\n${transcriptSection}`;
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
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lineCount = useMemo(() => result?.transcript_lines?.length ?? 0, [result]);

  const handleExtract = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Paste a YouTube URL first.');
      return;
    }

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

      const data = await response.json();
      setResult(data);
    } catch (extractError) {
      setError(extractError.message || 'Extraction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    downloadBlob(`${result.video_id}.txt`, result.transcript_text, 'text/plain;charset=utf-8');
  };

  const handleDownloadMd = () => {
    if (!result) return;
    const markdown = buildMarkdown(result);
    downloadBlob(`${result.video_id}.md`, markdown, 'text/markdown;charset=utf-8');
  };

  return (
    <main className="min-h-screen bg-[#121212] text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#161616] via-[#121212] to-[#14192b] p-6 shadow-[0_0_0_1px_rgba(0,230,118,0.06)] sm:p-10">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2962FF]/50 bg-[#2962FF]/10 px-3 py-1 text-xs font-medium text-[#8fb3ff]">
            <Sparkles className="h-3.5 w-3.5" />
            E.T.D Transcript Engine
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">YouTube Transcript Interface</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
            Paste a YouTube link to extract a structured transcript and export as plain text or markdown.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleExtract}>
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-400">YouTube URL</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#111820] px-3 py-2 focus-within:border-[#00E676]">
                <Link2 className="h-4 w-4 text-[#2962FF]" />
                <input
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </div>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-slate-400">Language</span>
                <input
                  className="w-20 rounded-md border border-slate-700 bg-[#111820] px-2 py-1 text-sm lowercase text-slate-100 outline-none focus:border-[#2962FF]"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  maxLength={10}
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00E676] px-4 py-2 text-sm font-semibold text-[#04160c] transition hover:bg-[#00d36b] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {loading ? 'Extracting...' : 'Extract Transcript'}
              </button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          ) : null}
        </section>

        {result ? (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-[#141414] p-6 shadow-[0_0_0_1px_rgba(41,98,255,0.12)]">
            <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">{result.title}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {lineCount} lines • {result.language.toUpperCase()} • ID: {result.video_id} • {result.extraction_ms}ms
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#181818] px-3 py-2 text-sm text-slate-200 hover:border-[#00E676]/70"
                >
                  <Download className="h-4 w-4 text-[#00E676]" />
                  TXT
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMd}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#2962FF]/60 bg-[#1a2140] px-3 py-2 text-sm text-[#d6e3ff] hover:bg-[#202a50]"
                >
                  <Download className="h-4 w-4" />
                  MD
                </button>
              </div>
            </div>

            <div className="mt-4 h-[56vh] overflow-y-auto rounded-xl border border-slate-800 bg-[#111111] p-3">
              <ul className="space-y-2">
                {result.transcript_lines.map((line, index) => (
                  <li key={`${line.seconds}-${index}`} className="grid grid-cols-[64px_1fr] gap-3 rounded-md bg-[#171717] px-3 py-2">
                    <span className="text-xs font-semibold text-[#00E676]">{line.timestamp}</span>
                    <span className="text-sm leading-6 text-slate-200">{line.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default App;
