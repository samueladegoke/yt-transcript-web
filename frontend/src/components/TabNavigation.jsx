import { motion } from 'framer-motion';
import { FileText, Plug } from 'lucide-react';

const tabs = [
  { id: 'transcript', label: 'Transcript', icon: FileText },
  { id: 'mcp', label: 'MCP Integration', icon: Plug },
];

export default function TabNavigation({ activeTab, onTabChange, children }) {
  return (
    <div>
      <nav className="mb-6 flex gap-1 rounded-xl border border-slate-800 bg-[#0A1820] p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === id
                ? 'text-[#C8A941]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {activeTab === id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg bg-[#C8A941]/10 border border-[#C8A941]/30"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          </button>
        ))}
      </nav>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
