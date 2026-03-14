import { motion } from 'framer-motion';
import { Sparkles, Zap, Play } from 'lucide-react';

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#122240] via-[#0A1832] to-[#14192b] p-8 sm:p-12 mb-8"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-[#C8A941]/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[#00D4FF]/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-3 rounded-full border border-[#00D4FF]/50 bg-[#00D4FF]/10 px-4 py-2 mb-6"
        >
          <img src="/assets/brand/E.T.D_logo_f4_transparent.png" alt="E.T.D" className="h-8 w-auto" />
          <span className="text-xs font-medium text-[#7AE8FF]">Elohim Tech Dynamics</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl lg:text-6xl"
        >
          YouTube Transcript
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#C8A941] to-[#00D4FF]">
            Interface
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-4 max-w-2xl text-lg text-slate-300 sm:text-xl"
        >
          Extract structured transcripts from any YouTube video with AI-powered analysis and seamless MCP integration.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 flex flex-wrap gap-3"
        >
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#122240] border border-slate-800 px-3 py-1.5 text-sm text-slate-400">
            <Zap className="h-4 w-4 text-[#C8A941]" />
            <span>Instant Extraction</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#122240] border border-slate-800 px-3 py-1.5 text-sm text-slate-400">
            <Play className="h-4 w-4 text-[#00D4FF]" />
            <span>Multi-language</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#122240] border border-slate-800 px-3 py-1.5 text-sm text-slate-400">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>AI-Ready</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
