import { Terminal, Zap, BookOpen, Plug } from 'lucide-react';
import MCPPlatformCard from './MCPPlatformCard';

const REPO_URL = 'https://github.com/samueladegoke/yt-transcript';

const mcpConfig = JSON.stringify({
  mcpServers: {
    "youtube-transcript": {
      command: "uvx",
      args: ["--from", `git+${REPO_URL}.git#subdirectory=backend`, "yt-transcript-proxy"]
    }
  }
}, null, 2);

const platforms = [
  { name: 'Claude Desktop', description: "Anthropic's desktop AI assistant", icon: '🤖', configBlocks: [{ title: 'Add to claude_desktop_config.json', config: mcpConfig }] },
  { name: 'Cursor', description: 'AI-powered code editor', icon: '✏️', configBlocks: [{ title: 'Add to .cursor/mcp.json or ~/.cursor/mcp.json', config: mcpConfig }] },
  { name: 'VS Code (Copilot)', description: 'GitHub Copilot with MCP support', icon: '💻', configBlocks: [{ title: 'Add to .vscode/mcp.json or settings.json', config: mcpConfig }] },
  { name: 'Windsurf', description: "Codeium's AI IDE", icon: '🏄', configBlocks: [{ title: 'Add to Windsurf MCP config', config: mcpConfig }] },
  { name: 'Cline', description: 'Autonomous AI coding agent', icon: '🦾', configBlocks: [{ title: 'Add to Cline MCP settings', config: mcpConfig }] },
  { name: 'OpenClaw', description: 'Personal AI agent platform', icon: '🐱', configBlocks: [{ title: 'Add to openclaw.json (mcpServers)', config: mcpConfig }] },
  { name: 'Generic MCP Host', description: 'Any MCP-compatible client', icon: '🔌', configBlocks: [
    { title: 'uvx (no install)', config: `uvx --from git+${REPO_URL}.git#subdirectory=backend yt-transcript-proxy`, language: 'bash' },
    { title: 'After pip install', config: 'yt-transcript-proxy', language: 'bash' }
  ]},
];

const features = [
  { icon: Terminal, text: 'Get full transcripts from any YouTube video' },
  { icon: Zap, text: 'Fetch video metadata (title, channel, views)' },
  { icon: BookOpen, text: 'Analyze: summaries, outlines, key points' },
  { icon: Plug, text: 'Zero-config proxy mode — no API keys needed' },
];

export default function MCPIntegration() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#161616] via-[#121212] to-[#14192b] p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2962FF]/10 text-[#8fb3ff]">
            <Plug className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">MCP Integration</h2>
            <p className="text-sm text-slate-400">Connect YouTube Transcript to your AI tools</p>
          </div>
        </div>
        <p className="text-slate-300 max-w-3xl">
          The <strong>Model Context Protocol (MCP)</strong> lets AI assistants like Claude, Cursor, and VS Code Copilot access YouTube transcripts directly. Ask your AI to "get the transcript for this video" — and it just works.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: FIcon, text }, idx) => (
            <div key={idx} className="flex items-start gap-2 rounded-lg bg-[#111820] border border-slate-800 p-3">
              <FIcon className="h-4 w-4 mt-0.5 text-[#00E676] shrink-0" />
              <span className="text-sm text-slate-300">{text}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="https://pypi.org/project/yt-transcript-mcp/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#2962FF]/50 bg-[#2962FF]/10 px-4 py-2 text-sm font-medium text-[#8fb3ff] hover:bg-[#2962FF]/20 transition">
            PyPI Package
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#181818] px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-600 transition">
            GitHub Repository
          </a>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Setup by Platform</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          {platforms.map((p, idx) => (<MCPPlatformCard key={idx} {...p} />))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#141414] p-6">
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Available Tools</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 text-slate-400 font-medium">Tool</th>
                <th className="text-left py-2 text-slate-400 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-slate-800/50"><td className="py-2 font-mono text-[#00E676]">get_transcript(url, lang)</td><td className="py-2">Fetch full transcript from a YouTube video</td></tr>
              <tr className="border-b border-slate-800/50"><td className="py-2 font-mono text-[#00E676]">get_video_info(url)</td><td className="py-2">Get video metadata (title, channel, duration)</td></tr>
              <tr className="border-b border-slate-800/50"><td className="py-2 font-mono text-[#00E676]">analyze(url, type)</td><td className="py-2">Analyze transcript (summary, outline, key_points)</td></tr>
              <tr><td className="py-2 font-mono text-[#00E676]">check_health()</td><td className="py-2">Verify backend connectivity</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
