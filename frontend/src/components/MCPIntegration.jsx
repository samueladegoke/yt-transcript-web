import { motion } from 'framer-motion';
import { Terminal, Zap, BookOpen, Plug, Sparkles } from 'lucide-react';
import MCPPlatformCard from './MCPPlatformCard';

const REPO_URL = 'https://github.com/samueladegoke/yt-transcript-web';

const mcpConfig = JSON.stringify({
  mcpServers: {
    "youtube-transcript": {
      command: "uvx",
      args: ["--from", `git+${REPO_URL}.git#subdirectory=backend`, "yt-transcript-proxy"]
    }
  }
}, null, 2);

const platforms = [
  { name: 'Claude Desktop', description: "Anthropic's desktop AI assistant", icon: 'anthropic', configBlocks: [{ title: 'Add to claude_desktop_config.json', config: mcpConfig }] },
  { name: 'Cursor', description: 'AI-powered code editor', icon: 'cursor', configBlocks: [{ title: 'Add to .cursor/mcp.json or ~/.cursor/mcp.json', config: mcpConfig }] },
  { name: 'VS Code (Copilot)', description: 'GitHub Copilot with MCP support', icon: 'vscode', configBlocks: [{ title: 'Add to .vscode/mcp.json or settings.json', config: mcpConfig }] },
  { name: 'Windsurf', description: "Codeium's AI IDE", icon: 'windsurf', configBlocks: [{ title: 'Add to Windsurf MCP config', config: mcpConfig }] },
  { name: 'Cline', description: 'Autonomous AI coding agent', icon: 'cline', configBlocks: [{ title: 'Add to Cline MCP settings', config: mcpConfig }] },
  { name: 'OpenClaw', description: 'Personal AI agent platform', icon: 'openclaw', configBlocks: [{ title: 'Add to openclaw.json (mcpServers)', config: mcpConfig }] },
  { name: 'Generic MCP Host', description: 'Any MCP-compatible client', icon: 'generic-mcp', configBlocks: [
    { title: 'uvx (no install)', config: `uvx --from git+${REPO_URL}.git#subdirectory=backend yt-transcript-proxy`, language: 'bash' },
    { title: 'After pip install', config: 'yt-transcript-proxy', language: 'bash' }
  ]},
];

const features = [
  { icon: Terminal, text: 'Get full transcripts from any YouTube video', color: 'text-[#C8A941]' },
  { icon: Zap, text: 'Fetch video metadata (title, channel, views)', color: 'text-[#ffb86c]' },
  { icon: BookOpen, text: 'Analyze: summaries, outlines, key points', color: 'text-[#7AE8FF]' },
  { icon: Plug, text: 'Zero-config proxy mode — no API keys needed', color: 'text-purple-400' },
];

export default function MCPIntegration() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#122240] via-[#0A1832] to-[#14192b] p-6 sm:p-8"
      >
        {/* Real photo background — developer workspace */}
        <img
          src="https://images.unsplash.com/photo-1753715613382-dc3e8456dbc9?w=1200&q=80&fit=max"
          alt="Developer working on dual monitors with code — MCP integration concept"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1832]/90 via-[#0A1832]/70 to-transparent" />

        {/* Animated background glow */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 right-0 w-1/2 h-full bg-[#00D4FF]/10 rounded-full blur-3xl"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20"
            >
              <Plug className="h-7 w-7 text-[#7AE8FF]" />
            </motion.div>
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-slate-100"
              >
                MCP Integration
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-slate-400"
              >
                Connect YouTube Transcript to your AI tools
              </motion.p>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-300 max-w-3xl leading-relaxed"
          >
            The <strong className="text-slate-100">Model Context Protocol (MCP)</strong> lets AI assistants like Claude, Cursor, and VS Code Copilot access YouTube transcripts directly. 
            Ask your AI to "get the transcript for this video" — and it just works.
          </motion.p>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map(({ icon: FIcon, text, color }, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                whileHover={{ y: -2, scale: 1.02 }}
                className="flex items-start gap-2.5 rounded-lg bg-[#122240]/80 border border-slate-800 p-3 transition-all hover:border-slate-700"
              >
                <FIcon className={`h-4 w-4 mt-0.5 ${color} shrink-0`} />
                <span className="text-sm text-slate-300 leading-relaxed">{text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="https://github.com/samueladegoke/yt-transcript-web/tree/main/backend/app#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#00D4FF]/50 bg-[#00D4FF]/10 px-4 py-2.5 text-sm font-medium text-[#7AE8FF] hover:bg-[#00D4FF]/20 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              MCP Server (GitHub)
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#122240] px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-600 transition-all"
            >
              GitHub Repository
            </motion.a>
          </motion.div>
        </div>
      </motion.section>

      {/* Platform Cards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Setup by Platform</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          {platforms.map((p, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.08 }}
            >
              <MCPPlatformCard {...p} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Available Tools Table */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="rounded-2xl border border-slate-800 bg-[#122240] p-6"
      >
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Available Tools</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Tool</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                { name: 'get_transcript(url, lang)', desc: 'Fetch full transcript from a YouTube video' },
                { name: 'get_video_info(url)', desc: 'Get video metadata (title, channel, duration)' },
                { name: 'analyze(url, type)', desc: 'Analyze transcript: summary, outline, or key_points' },
                { name: 'check_health()', desc: 'Verify backend connectivity' },
              ].map((tool, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-[#C8A941] text-sm">{tool.name}</td>
                  <td className="py-3 px-4">{tool.desc}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}
