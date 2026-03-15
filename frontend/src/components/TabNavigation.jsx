import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function TabNavigation({ activeTab, onTabChange, children }) {
  const tabs = [
    { id: 'transcript', label: 'Transcript', accent: '#C8A941' },
    { id: 'mcp', label: 'MCP Integration', accent: '#00D4FF' },
  ];

  const active = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="space-y-6">
      {/* Tab Bar — glassmorphism with brand active indicator */}
      <nav aria-label="Main navigation" className="relative rounded-2xl border border-white/[0.06] glassmorphism p-1.5 flex gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "relative flex-1 rounded-xl py-3 px-5 text-sm font-semibold transition-colors duration-200",
                isActive ? "text-[#0A1832]" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {/* Active background with brand color gradient */}
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${tab.accent}, ${tab.accent}cc)`,
                    boxShadow: `0 4px 20px ${tab.accent}40`,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
