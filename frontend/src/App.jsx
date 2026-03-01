import { useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function downloadBlob(content, filename, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const transcriptFilePrefix = useMemo(() => {
    if (!data?.video_id) return "transcript";
    return `transcript-${data.video_id}`;
  }, [data]);

  const onExtract = async (event) => {
    event.preventDefault();
    setError("");
    setData(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.detail || "Extraction failed.");
      }

      setData(payload);
    } catch (err) {
      setError(err.message || "Unable to process this URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal bg-grid-fade text-slate-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-10 pt-16 md:px-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-panel backdrop-blur-sm md:p-10">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-neon">E.T.D. Transcript Engine</p>
          <h1 className="font-display text-3xl font-bold text-white md:text-5xl">YouTube Transcript Web Interface</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Paste a YouTube URL to extract a time-stamped transcript and download it as plain text or markdown with summary and takeaways.</p>

          <form className="mt-8 flex flex-col gap-3 md:flex-row" onSubmit={onExtract}>
            <input id="video-url" aria-label="YouTube video URL"
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none ring-electric transition focus:border-electric focus:ring-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-electric px-5 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Extracting..." : "Extract Transcript"}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </section>

        {data ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-panel backdrop-blur-sm md:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-white">Transcript</h2>
                <p className="text-sm text-slate-300">Video ID: {data.video_id}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadBlob(data.plain_text, `${transcriptFilePrefix}.txt`)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:border-neon"
                >
                  Download TXT
                </button>
                <button
                  type="button"
                  onClick={() => downloadBlob(data.markdown, `${transcriptFilePrefix}.md`, "text/markdown;charset=utf-8")}
                  className="rounded-lg bg-neon px-4 py-2 text-sm font-medium text-slate-900 hover:bg-emerald-400"
                >
                  Download MD
                </button>
              </div>
            </div>

            <div className="max-h-[460px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <ul className="space-y-3">
                {data.transcript.map((segment, idx) => (
                  <li key={`${segment.start}-${idx}`} className="rounded-lg bg-slate-950/70 p-3">
                    <span className="mr-2 inline-block rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-neon">{formatTime(segment.start)}</span>
                    <span className="text-sm leading-6 text-slate-200">{segment.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
