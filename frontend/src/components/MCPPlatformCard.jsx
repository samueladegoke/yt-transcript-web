import { motion } from 'framer-motion';
import MCPCopyBlock from './MCPCopyBlock';
import BrandIcon from './BrandIcon';

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
          {/* icon is a simple-icons slug string like "anthropic", "cursor", "openclaw", "generic-mcp" */}
          <BrandIcon name={icon} size={24} color={colors.iconColor} />
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
