import { motion } from 'framer-motion';
import { Film, Languages, Sparkles } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] glassmorphism p-10 sm:p-16 text-center">
      {/* Background glow orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-[#C8A941]/[0.04] rounded-full blur-[60px]" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-[#00D4FF]/[0.03] rounded-full blur-[60px]" />
      </div>

      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#C8A941]/20 bg-[#C8A941]/[0.06]"
        >
          <Film className="h-10 w-10 text-[#C8A941]" />
        </motion.div>

        <h3 className="text-xl font-semibold text-slate-200 mb-2">
          Paste a YouTube URL to Get Started
        </h3>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          Extract transcripts from any YouTube video. Supports multiple languages, timestamps, and export to TXT or Markdown.
        </p>

        {/* Feature hints */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-[#00D4FF]/60" />
            <span>100+ languages</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400/60" />
            <span>AI-ready format</span>
          </div>
        </div>
      </div>
    </div>
  );
}
