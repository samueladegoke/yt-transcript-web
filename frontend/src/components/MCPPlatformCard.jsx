import { motion } from 'framer-motion';
import MCPCopyBlock from './MCPCopyBlock';
// Platform icons — inline SVGs from Iconify
const PLATFORM_ICONS = {
  anthropic: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#d4a373" d="M19.753 1.993a.5.5 0 0 0-.932.076l-3.38 8.893a.5.5 0 0 1-.31.295l-6.805 2.66a.5.5 0 0 0-.068.02l-.023.01a.5.5 0 0 0-.232.298l-2.16 6.472a.5.5 0 0 0 .848.498l5.168-5.64a.5.5 0 0 1 .303-.16l6.936-1.444a.5.5 0 0 0 .29-.175l5.474-6.993a.5.5 0 0 0-.073-.666z"/></svg>`,
  cursor: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#94a3b8" d="M12 2.584l7.086 18.093a.5.5 0 0 1-.92.373L12 15.07l-6.086 5.977a.5.5 0 0 1-.92-.373L12 2.584z"/></svg>`,
  vscode: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#007ACC" d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L12 18.497l-5.982-5.278 5.982-5.28 5.984 5.28v6.534z"/></svg>`,
  windsurf: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#94a3b8" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14z"/></svg>`,
  cline: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#94a3b8" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/><circle cx="12" cy="12" r="4" fill="#94a3b8"/></svg>`,
  openclaw: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#C8A941" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  'generic-mcp': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#94a3b8" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>`,
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
