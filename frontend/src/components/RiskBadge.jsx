import { motion } from 'framer-motion';

export function RiskBadge({ clean, failed }) {
  if (failed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(250,85,56,0.6)] animate-pulse" />
        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Failed</span>
      </motion.div>
    );
  }
  if (clean) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8A941]/10 border border-[#C8A941]/20"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#E8C85A] shadow-[0_0_8px_rgba(200,169,65,0.6)]" />
        <span className="text-[10px] font-bold text-[#E8C85A] uppercase tracking-widest">Clean</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#7AE8FF] shadow-[0_0_8px_rgba(0,212,255,0.6)] animate-pulse" />
      <span className="text-[10px] font-bold text-[#7AE8FF] uppercase tracking-widest">Risky</span>
    </motion.div>
  );
}
