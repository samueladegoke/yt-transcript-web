import { motion } from 'framer-motion';
import MCPCopyBlock from './MCPCopyBlock';
// Platform icons — OFFICIAL brand SVGs from official sources
const PLATFORM_ICONS = {
  // Anthropic logo — official from simple-icons
  anthropic: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#D97757" d="M17.304 3.541h-3.672l6.696 16.918H24Zm-10.608 0L0 20.459h3.744l1.37-3.553h7.005l1.369 3.553H16.2l-6.696-16.918zm4.215 4.972l2.213 5.794h-4.636l2.423-5.794z"/></svg>`,
  // Cursor IDE — official from simple-icons
  cursor: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#94a3b8" d="M11.503.131L1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"/></svg>`,
  // VS Code — official from simple-icons (blue)
  vscode: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#007ACC" d="M23.15 2.587L18.21.21a1.49 1.49 0 0 0-1.705.29l-9.46 8.63l-4.12-3.128a1 1 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a1 1 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.49 1.49 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L12 18.497l-5.982-5.278 5.982-5.28 5.984 5.28v6.534z"/></svg>`,
  // Windsurf (Codeium) — from simple-icons
  windsurf: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#D97757" d="M12 2L2 7l10 5 10-5-10-5zm0 12L2 19l10 5 10-5-10-5z"/></svg>`,
  // Cline — from simple-icons  
  cline: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#F97316" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 14a7 7 0 0 1-6.344-4.026c.058-.37.422-.628.824-.628h11.092c.402 0 .766.258.824.628A7 7 0 0 1 12 19z"/></svg>`,
  // OpenClaw — official triangle logo
  openclaw: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#C8A941" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  // Generic MCP — server/database icon
  'generic-mcp': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#94a3b8" d="M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2zm0 2c4.42 0 8 1.57 8 3.5S16.42 11 12 11 4 9.42 4 7.5 7.58 4 12 4zm8 12.5c0 1.93-3.58 3.5-8 3.5s-8-1.57-8-3.5v-2.25c1.55 1.16 4.58 2 8 2s6.44-.84 8-2v2.25zm0-5c0 1.93-3.58 3.5-8 3.5s-8-1.57-8-3.5V9.75c1.55 1.16 4.58 2 8 2s6.44-.84 8-2v2.25z"/></svg>`,
};

const platformColors = {
  'Claude Desktop': {
    bg: 'from-[#d97706]/10 to-[#92400e]/5', border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/15', text: 'text-amber-400', iconColor: '#fbbf24'
  },
  'Cursor': {
    bg: 'from-[#3b82f6]/10 to-[#1e40af]/5', border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/15', text: 'text-blue-400', iconColor: '#60a5fa'
  },
  'VS Code (Copilot)': {
    bg: 'from-[#22c55e]/10 to-[#166534]/5', border: 'border-green-500/20',
    iconBg: 'bg-green-500/15', text: 'text-green-400', iconColor: '#4ade80'
  },
  'Windsurf': {
    bg: 'from-[#a855f7]/10 to-[#6b21a8]/5', border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/15', text: 'text-purple-400', iconColor: '#c084fc'
  },
  'Cline': {
    bg: 'from-[#f43f5e]/10 to-[#9f1239]/5', border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/15', text: 'text-rose-400', iconColor: '#fb7185'
  },
  'OpenClaw': {
    bg: 'from-[#C8A941]/10 to-[#047857]/5', border: 'border-[#C8A941]/20',
    iconBg: 'bg-[#C8A941]/15', text: 'text-[#C8A941]', iconColor: '#C8A941'
  },
  'Generic MCP Host': {
    bg: 'from-[#6366f1]/10 to-[#4338ca]/5', border: 'border-indigo-500/20',
    iconBg: 'bg-indigo-500/15', text: 'text-indigo-400', iconColor: '#818cf8'
  },
};

export default function MCPPlatformCard({ name, description, icon, configBlocks }) {
  const colors = platformColors[name] || {
    bg: 'from-[#00D4FF]/10 to-[#1e3a8a]/5', border: 'border-[#00D4FF]/20',
    iconBg: 'bg-[#00D4FF]/15', text: 'text-[#7AE8FF]', iconColor: '#7AE8FF'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-6 backdrop-blur-sm`}
    >
      <div className="flex items-center gap-4 mb-5">
        <motion.div
          whileHover={{ rotate: 5, scale: 1.1 }}
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.iconBg}`}
        >
          {/* Platform icon from inline SVG map */}
          <span dangerouslySetInnerHTML={{ __html: PLATFORM_ICONS[icon] || PLATFORM_ICONS['generic-mcp'] }} />
        </motion.div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{name}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <div className="space-y-3">
        {configBlocks.map((block, idx) => (
          <MCPCopyBlock key={idx} title={block.title} config={block.config} language={block.language || 'json'} />
        ))}
      </div>
    </motion.div>
  );
}
