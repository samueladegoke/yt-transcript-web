import { useMemo, useState, useCallback } from "react";
import { Tab } from "@headlessui/react";
import { 
  Download, 
  Copy, 
  Check, 
  Search, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  FileText,
  FileCode,
  Link as LinkIcon,
  PlayCircle
} from "lucide-react";

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

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-64 rounded-2xl bg-slate-800/50" />
      <div className="h-8 w-3/4 rounded-lg bg-slate-800/50" />
      <div className="h-4 w-1/2 rounded-lg bg-slate-800/50" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-800/30" />
        ))}
      </div>
    </div>
  );
}

// Video Info Component
function VideoInfo({ data }) {
  const [descExpanded, setDescExpanded] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${data.video_id}/maxresdefault.jpg`;
  const fallbackThumbnail = `https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`;
  const [imgSrc, setImgSrc] = useState(thumbnailUrl);

  const handleImageError = () => {
    setImgSrc(fallbackThumbnail);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-panel backdrop-blur-sm">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden rounded-xl md:w-80">
          <img
            src={imgSrc}
            alt={data.title}
            onError={handleImageError}
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
            <h2 className="font-display text-2xl font-bold leading-tight text-white md:text-3xl">
              {data.title}
            </h2>
            <p className="mt-2 text-lg font-medium text-neon">
              {data.channel}
            </p>
          </div>

          {/* Description */}
          {data.description && (
            <div className="mt-4">
              <div
                className={classNames(
                  "overflow-hidden text-sm leading-relaxed text-slate-400 transition-all duration-300",
                  descExpanded ? "max-h-96" : "max-h-16"
                )}
              >
                {data.description.split("\n").map((line, i) => (
                  <p key={i} className={line.trim() === "" ? "h-2" : ""}>
                    {line}
                  </p>
                ))}
              </div>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-electric hover:text-blue-400"
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
    </div>
  );
}

// Search Bar Component
function SearchBar({ value, onChange, resultCount }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        placeholder="Search in transcript..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-10 pr-24 text-sm text-slate-100 outline-none ring-electric transition placeholder:text-slate-500 focus:border-electric focus:ring-2"
      />
      {value && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          {resultCount} results
        </span>
      )}
    </div>
  );
}

// Transcript Viewer Component
function TranscriptViewer({ transcript, searchQuery, onSegmentClick }) {
  const filteredTranscript = useMemo(() => {
    if (!searchQuery) return transcript;
    const query = searchQuery.toLowerCase();
    return transcript.filter((segment) =>
      segment.text.toLowerCase().includes(query)
    );
  }, [transcript, searchQuery]);

  const highlightText = (text, query) => {
    if (!query) return text;
    // Escape regex special characters to prevent ReDoS
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === escapedQuery.toLowerCase() ? (
        <mark key={i}ounded bg-neon className="r/30 px-1 text-white">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="max-h-[600px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      {filteredTranscript.length === 0 ? (
        <p className="py-8 text-center text-slate-500">
          {searchQuery ? "No matches found" : "No transcript available"}
        </p>
      ) : (
        <ul className="space-y-3">
          {filteredTranscript.map((segment, idx) => (
            <li
              key={`${segment.start}-${idx}`}
              className="group flex gap-3 rounded-lg bg-slate-950/70 p-3 transition hover:bg-slate-900"
            >
              <button
                onClick={() => onSegmentClick(segment.start)}
                className="flex-shrink-0 rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-neon transition group-hover:bg-slate-700"
              >
                {formatTime(segment.start)}
              </button>
              <p className="text-sm leading-6 text-slate-200">
                {highlightText(segment.text, searchQuery)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Links Component
function LinkList({ links }) {
  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  const groupedLinks = useMemo(() => {
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
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <LinkIcon className="mx-auto h-12 w-12 text-slate-600" />
        <p className="mt-4 text-slate-400">No links found in the video description</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Found {links.length} link{links.length !== 1 ? "s" : ""} in the description
      </p>
      {Object.entries(groupedLinks).map(([domain, domainLinks]) => (
        <div key={domain} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            <span className="h-2 w-2 rounded-full bg-neon" />
            {domain}
          </h4>
          <ul className="space-y-2">
            {domainLinks.map((link, idx) => (
              <li key={idx}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg bg-slate-950/70 p-3 transition hover:bg-slate-800"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    alt=""
                    className="h-5 w-5 flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <span className="flex-1 truncate text-sm text-electric group-hover:text-blue-400">
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

// Download Options Component
function DownloadOptions({ data }) {
  const [copied, setCopied] = useState(false);

  // Use API-provided versions when available, fallback to computed
  const transcriptWithTimestamps = data.plain_text_with_timestamps || data.transcript
    .map((seg) => `[${formatTime(seg.start)}] ${seg.text}`)
    .join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.plain_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => downloadBlob(transcriptWithTimestamps, `transcript-${data.video_id}.txt`)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-300 transition hover:border-electric hover:text-white"
        title="Download with timestamps"
      >
        <FileText className="h-4 w-4" />
        TXT (with timestamps)
      </button>
      
      <button
        onClick={() => downloadBlob(data.plain_text, `transcript-${data.video_id}-clean.txt`)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-300 transition hover:border-electric hover:text-white"
        title="Download clean text"
      >
        <FileText className="h-4 w-4" />
        TXT (clean)
      </button>
      
      <button
        onClick={() => downloadBlob(data.markdown, `transcript-${data.video_id}.md`, "text/markdown;charset=utf-8")}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-300 transition hover:border-electric hover:text-white"
        title="Download as Markdown"
      >
        <FileCode className="h-4 w-4" />
        Markdown
      </button>
      
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-blue-400"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </>
        )}
      </button>
    </div>
  );
}

// Main App Component
export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const onExtract = async (event) => {
    event.preventDefault();
    setError("");
    setData(null);
    setSearchQuery("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/video-info`, {
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

  const handleSegmentClick = useCallback((startTime) => {
    window.open(`https://www.youtube.com/watch?v=${data?.video_id}&t=${Math.floor(startTime)}s`, "_blank");
  }, [data?.video_id]);

  const filteredCount = useMemo(() => {
    if (!searchQuery || !data?.transcript) return 0;
    const query = searchQuery.toLowerCase();
    return data.transcript.filter((seg) =>
      seg.text.toLowerCase().includes(query)
    ).length;
  }, [searchQuery, data?.transcript]);

  return (
    <div className="min-h-screen bg-charcoal bg-grid-fade text-slate-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-12 md:px-6">
        {/* Header */}
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950/90 to-slate-900/80 p-6 shadow-panel backdrop-blur-sm md:p-10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-electric/20 p-2">
              <PlayCircle className="h-8 w-8 text-electric" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon">E.T.D. Transcript Engine</p>
              <h1 className="font-display text-2xl font-bold text-white md:text-4xl">YouTube Transcript</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-slate-400">
            Extract transcripts, video metadata, and links from any YouTube video. 
            Download in multiple formats or copy to clipboard.
          </p>

          <form className="mt-8 flex flex-col gap-3 md:flex-row" onSubmit={onExtract}>
            <input
              id="video-url"
              aria-label="YouTube video URL"
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none ring-electric transition placeholder:text-slate-500 focus:border-electric focus:ring-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-electric px-6 py-3 font-medium text-slate-900 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                  Extracting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Extract
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 p-4">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={onExtract}
                className="mt-2 text-sm font-medium text-red-300 hover:text-red-200"
              >
                Try again
              </button>
            </div>
          )}
        </section>

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Results */}
        {data && !loading && (
          <>
            {/* Video Info */}
            <VideoInfo data={data} />

            {/* Download Options */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-panel backdrop-blur-sm">
              <h3 className="mb-4 text-lg font-semibold text-white">Download Options</h3>
              <DownloadOptions data={data} />
            </div>

            {/* Tabbed Content */}
            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-xl bg-slate-900/50 p-1">
                {["Transcript", "Description", "Links"].map((tab) => (
                  <Tab
                    key={tab}
                    className={({ selected }) =>
                      classNames(
                        "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition",
                        selected
                          ? "bg-electric text-slate-900 shadow"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                      )
                    }
                  >
                    {tab}
                  </Tab>
                ))}
              </Tab.List>
              
              <Tab.Panels className="mt-4">
                {/* Transcript Panel */}
                <Tab.Panel className="space-y-4">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    resultCount={filteredCount}
                  />
                  <TranscriptViewer
                    transcript={data.transcript}
                    searchQuery={searchQuery}
                    onSegmentClick={handleSegmentClick}
                  />
                </Tab.Panel>

                {/* Description Panel */}
                <Tab.Panel>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    {data.description ? (
                      <div className="prose prose-invert max-w-none">
                        {data.description.split("\n").map((line, i) => (
                          <p key={i} className={line.trim() === "" ? "h-4" : "text-slate-300"}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-500">No description available</p>
                    )}
                  </div>
                </Tab.Panel>

                {/* Links Panel */}
                <Tab.Panel>
                  <LinkList links={data.links} />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </>
        )}
      </main>
    </div>
  );
}
