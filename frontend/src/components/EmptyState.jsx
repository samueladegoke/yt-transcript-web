import { motion } from 'framer-motion';
import { Film, Languages, Sparkles } from 'lucide-react';

// Real Unsplash photo — YouTube video player concept
const EMPTY_PHOTO = 'https://images.unsplash.com/photo-1632931612792-fbaacfd952f6?w=800&q=80&fit=max';

export default function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] glassmorphism p-10 sm:p-16 text-center">
      {/* Real photo background — play button concept */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={EMPTY_PHOTO}
          alt="Red play button on dark background — YouTube concept by Shubham Dhage on Unsplash"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1832]/60 to-[#0A1832]/90" />
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

        {/* Photo attribution */}
        <div className="mt-8 text-[10px] text-slate-400/60">
          Photo by <a href="https://unsplash.com/@shaahshah" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-700/30">Shubham Dhage</a> on <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-700/30">Unsplash</a>
        </div>
      </div>
    </div>
  );
}
