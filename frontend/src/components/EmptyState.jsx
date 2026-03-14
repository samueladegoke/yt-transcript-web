import { motion } from 'framer-motion';
import { Sparkles, Clapperboard } from 'lucide-react';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col items-center justify-center py-16 text-center overflow-hidden"
    >
      {/* Subtle gradient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-[#00E676]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-[#2962FF]/5 rounded-full blur-3xl" />
      </div>

      {/* Animated icon container */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#2962FF]/20 to-[#00E676]/20 border border-[#2962FF]/30"
      >
        <Clapperboard className="h-10 w-10 text-[#2962FF]" />
      </motion.div>

      <h3 className="relative z-10 text-xl font-semibold text-slate-100 mb-2">
        Paste a YouTube URL to Get Started
      </h3>

      <p className="relative z-10 max-w-md text-slate-400 mb-6">
        Extract structured transcripts with timestamps, export to multiple formats,
        and integrate with your favorite tools.
      </p>

      <div className="relative z-10 flex items-center gap-2 text-sm text-slate-500">
        <Sparkles className="h-4 w-4 text-[#00E676]" />
        <span>Supports multiple languages</span>
      </div>
    </motion.div>
  );
}
