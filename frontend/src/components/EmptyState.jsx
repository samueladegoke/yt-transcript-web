import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#2962FF]/10"
      >
        <Play className="h-10 w-10 text-[#2962FF]" />
      </motion.div>
      
      <h3 className="text-xl font-semibold text-slate-100 mb-2">
        No Transcript Yet
      </h3>
      
      <p className="max-w-md text-slate-400 mb-6">
        Paste a YouTube URL above to extract a structured transcript with timestamps and export options.
      </p>
      
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Sparkles className="h-4 w-4" />
        <span>Supports multiple languages</span>
      </div>
    </motion.div>
  );
}
