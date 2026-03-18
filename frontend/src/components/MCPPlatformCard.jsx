import { motion } from 'framer-motion';
import MCPCopyBlock from './MCPCopyBlock';
// Platform icons — OFFICIAL brand logos only
// Source: @iconify-json/logos package (npm) for available brands
// For brands without logos package entries: official favicon from brand website via <img>
const PLATFORM_ICONS = {
  // Claude Desktop — official Claude logo from @iconify-json/logos (claude-icon)
  anthropic: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 256 257"><path fill="#D97757" d="m50.228 170.321l50.357-28.257l.843-2.463l-.843-1.361h-2.462l-8.426-.518l-28.775-.778l-24.952-1.037l-24.175-1.296l-6.092-1.297L0 125.796l.583-3.759l5.12-3.434l7.324.648l16.202 1.101l24.304 1.685l17.629 1.037l26.118 2.722h4.148l.583-1.685l-1.426-1.037l-1.101-1.037l-25.147-17.045l-27.22-18.017l-14.258-10.37l-7.713-5.25l-3.888-4.925l-1.685-10.758l7-7.713l9.397.649l2.398.648l9.527 7.323l20.35 15.75L94.817 91.9l3.889 3.24l1.555-1.102l.195-.777l-1.75-2.917l-14.453-26.118l-15.425-26.572l-6.87-11.018l-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0l10.63 1.426l4.472 3.888l6.61 15.101l10.694 23.786l16.591 32.34l4.861 9.592l2.592 8.879l.973 2.722h1.685v-1.556l1.36-18.211l2.528-22.36l2.463-28.776l.843-8.1l4.018-9.722l7.971-5.25l6.222 2.981l5.12 7.324l-.713 4.73l-3.046 19.768l-5.962 30.98l-3.889 20.739h2.268l2.593-2.593l10.499-13.934l17.628-22.036l7.778-8.749l9.073-9.657l5.833-4.601h11.018l8.1 12.055l-3.628 12.443l-11.342 14.388l-9.398 12.184l-13.48 18.147l-8.426 14.518l.778 1.166l2.01-.194l30.46-6.481l16.462-2.982l19.637-3.37l8.88 4.148l.971 4.213l-3.5 8.62l-20.998 5.184l-24.628 4.926l-36.682 8.685l-.454.324.519.648l16.526 1.555l7.065.389h17.304l32.21 2.398l8.426 5.574l5.055 6.805l-.843 5.184l-12.962 6.611l-17.498-4.148l-40.83-9.721l-14-3.5h-1.944v1.167l11.666 11.406l21.387 19.314l26.767 24.887l1.36 6.157l-3.434 4.86l-3.63-.518l-23.526-17.693l-9.073-7.972l-20.545-17.304h-1.36v1.814l4.73 6.935l25.017 37.59l1.296 11.536l-1.814 3.76l-6.481 2.268l-7.13-1.297l-14.647-20.544l-15.1-23.138l-12.185-20.739l-1.49.843l-7.194 77.448l-3.37 3.953l-7.778 2.981l-6.48-4.925l-3.436-7.972l3.435-15.749l4.148-20.544l3.37-16.333l3.046-20.285l1.815-6.74l-.13-.454l-1.49.194l-15.295 20.999l-23.267 31.433l-18.406 19.702l-4.407 1.75l-7.648-3.954l.713-7.064l4.277-6.286l25.47-32.405l15.36-20.092l9.917-11.6l-.065-1.686h-.583L44.07 198.125l-12.055 1.555l-5.185-4.86l.648-7.972l2.463-2.593l20.35-13.999z"/></svg>`,
  // Cursor — official favicon from cursor.com
  cursor: `<img src="https://cursor.com/favicon.ico" width="22" height="22" alt="Cursor" onerror="this.outerHTML='<span style=\\'font-size:18px\\'>⬤</span>'" />`,
  // VS Code — official from @iconify-json/logos (visual-studio-code)
  vscode: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 256 254"><defs><linearGradient id="VSC1" x1="50%" x2="50%" y1="0%" y2="100%"><stop offset="0%" stop-color="#FFF"/><stop offset="100%" stop-color="#FFF" stop-opacity="0"/></linearGradient><path id="VSC2" d="M180.828 252.605a15.87 15.87 0 0 0 12.65-.486l52.501-25.262a15.94 15.94 0 0 0 9.025-14.364V41.197a15.94 15.94 0 0 0-9.025-14.363l-52.5-25.263a15.88 15.88 0 0 0-18.115 3.084L74.857 96.35l-43.78-33.232a10.614 10.614 0 0 0-13.56.603L3.476 76.494c-4.63 4.211-4.635 11.495-.012 15.713l37.967 34.638l-37.967 34.637c-4.623 4.219-4.618 11.502.012 15.714l14.041 12.772a10.614 10.614 0 0 0 13.56.604l43.78-33.233l100.507 91.695a15.85 15.85 0 0 0 5.464 3.571m10.464-183.649l-76.262 57.889l76.262 57.888z"/></defs><mask id="VSC3" fill="#fff"><use href="#VSC2"/></mask><path fill="#0065A9" d="M246.135 26.873L193.593 1.575a15.885 15.885 0 0 0-18.123 3.08L3.466 161.482c-4.626 4.219-4.62 11.502.012 15.714l14.05 12.772a10.625 10.625 0 0 0 13.569.604L238.229 33.436c6.949-5.271 16.93-.315 16.93 8.407v-.61a15.94 15.94 0 0 0-9.024-14.36" mask="url(#VSC3)"/><path fill="#007ACC" d="m246.135 226.816l-52.542 25.298a15.89 15.89 0 0 1-18.123-3.08L3.466 92.207c-4.626-4.218-4.62-11.502.012-15.713l14.05-12.773a10.625 10.625 0 0 1 13.569-.603l207.132 157.135c6.949 5.271 16.93.315 16.93-8.408v.611a15.94 15.94 0 0 1-9.024 14.36" mask="url(#VSC3)"/><path fill="#1F9CF0" d="M193.428 252.134a15.89 15.89 0 0 1-18.125-3.083c5.881 5.88 15.938 1.715 15.938-6.603V11.273c0-8.318-10.057-12.483-15.938-6.602a15.89 15.89 0 0 1 18.125-3.084l52.533 25.263a15.94 15.94 0 0 1 9.03 14.363V212.51c0 6.125-3.51 11.709-9.03 14.363z" mask="url(#VSC3)"/><path fill="url(#VSC1)" fill-opacity=".25" d="M180.828 252.605a15.87 15.87 0 0 0 12.65-.486l52.5-25.263a15.94 15.94 0 0 0 9.026-14.363V41.197a15.94 15.94 0 0 0-9.025-14.363L193.477 1.57a15.88 15.88 0 0 0-18.114 3.084L74.857 96.35l-43.78-33.232a10.614 10.614 0 0 0-13.56.603L3.476 76.494c-4.63 4.211-4.635 11.495-.012 15.713l37.967 34.638l-37.967 34.637c-4.623 4.219-4.618 11.502.012 15.714l14.041 12.772a10.614 10.614 0 0 0 13.56.604l43.78-33.233l100.506 91.695a15.9 15.9 0 0 0 5.465 3.571m10.464-183.65l-76.262 57.89l76.262 57.888z" mask="url(#VSC3)"/></svg>`,
  // Windsurf — official favicon from windsurf.com
  windsurf: `<img src="https://windsurf.com/favicon.ico" width="22" height="22" alt="Windsurf" onerror="this.outerHTML='<span style=\\'font-size:18px\\'>🌊</span>'" />`,
  // Cline — official favicon from cline.bot
  cline: `<img src="https://cline.bot/assets/branding/favicons/favicon-16x16.png" width="16" height="16" alt="Cline" onerror="this.outerHTML='<span style=\\'font-size:18px\\'>🤖</span>'" />`,
  // OpenClaw — triangle mark (custom logo)
  openclaw: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#C8A941" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  // Generic MCP — horizontal lines (no official logo for MCP protocol)
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
