import { motion } from 'framer-motion';
import { Sparkles, Zap, Play } from 'lucide-react';

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] glassmorphism p-8 sm:p-12 mb-8"
    >
      {/* Animated background orbs — gold + cyan */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-[#C8A941]/15 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[#00D4FF]/12 rounded-full blur-[80px]"
        />
        {/* Decorative grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(200,169,65,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(200,169,65,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Watermark Logo — subliminal depth */}
        <img
          src="/assets/brand/E.T.D_logo_f4_transparent.png"
          alt=""
          className="pointer-events-none select-none absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 w-[420px] h-auto opacity-[0.08] hidden md:block"
        />

        {/* Brand badge — enlarged logo, glassmorphism pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-4 rounded-2xl border border-[#C8A941]/20 bg-[#C8A941]/[0.04] backdrop-blur-md px-5 py-3 mb-8"
        >
          <img src="/assets/brand/E.T.D_logo_f4_transparent.png" alt="E.T.D" className="h-14 w-auto drop-shadow-[0_0_8px_rgba(200,169,65,0.15)]" />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-wide text-[#E8C85A]">E.T.D</span>
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#A08040]/80">Elohim Tech Dynamics</span>
          </div>
        </motion.div>

        {/* Headline — larger, with glow accent */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          YouTube Transcript
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#C8A941] via-[#E8C85A] to-[#00D4FF]">
            Interface
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-5 max-w-2xl text-lg text-slate-400 sm:text-xl leading-relaxed"
        >
          Extract structured transcripts from any YouTube video with AI-powered analysis and seamless MCP integration.
        </motion.p>

        {/* Feature pills — glassmorphism with brand accents */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-[#C8A941]/20 bg-[#C8A941]/[0.06] backdrop-blur-sm px-4 py-2 text-sm font-medium text-[#E8C85A]/90 shadow-[0_0_24px_rgba(200,169,65,0.15)] pill-glow-gold">
            <Zap className="h-4 w-4 text-[#C8A941]" />
            <span>Instant Extraction</span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-[#00D4FF]/20 bg-[#00D4FF]/[0.06] backdrop-blur-sm px-4 py-2 text-sm font-medium text-[#7AE8FF]/90 shadow-[0_0_24px_rgba(0,212,255,0.15)] pill-glow-cyan">
            <Play className="h-4 w-4 text-[#00D4FF]" />
            <span>Multi-language</span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-purple-400/20 bg-purple-400/[0.06] backdrop-blur-sm px-4 py-2 text-sm font-medium text-purple-300/90 shadow-[0_0_24px_rgba(168,85,247,0.15)] pill-glow-purple">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>AI-Ready</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
