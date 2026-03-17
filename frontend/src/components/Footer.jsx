import { motion } from 'framer-motion';
import { Github, BookOpen, FileCode, Heart, ExternalLink } from 'lucide-react';

const REPO_URL = 'https://github.com/samueladegoke/yt-transcript-web';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mt-20 relative"
    >
      {/* Premium separator — layered gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D4FF]/10 to-transparent translate-x-[30%]" />
      </div>

      <div className="border-t border-white/[0.04] pt-10 pb-12">
        <div className="flex flex-col items-center justify-center gap-8">
          {/* Links — with enhanced hover effects */}
          <div className="flex items-center gap-6">
            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#F0D060] transition-all duration-200 group"
            >
              <Github className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              <span>GitHub</span>
            </motion.a>

            <span className="text-white/[0.06]">•</span>

            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              href="https://github.com/samueladegoke/yt-transcript-web/tree/main/backend/app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#00D4FF] transition-all duration-200 group"
            >
              <BookOpen className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              <span>Docs</span>
            </motion.a>

            <span className="text-white/[0.06]">•</span>

            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              href={`${REPO_URL}/tree/main/backend`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-all duration-200 group"
            >
              <FileCode className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              <span>API</span>
            </motion.a>
          </div>

          {/* Brand copyright — with logo */}
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <img src="/assets/brand/E.T.D_logo_f4_transparent.png" alt="E.T.D" className="h-7 w-auto opacity-40 hover:opacity-70 transition-opacity" />
            <span>© {currentYear} E.T.D — Elohim Tech Dynamics</span>
            <span className="text-white/[0.06]">|</span>
            <span className="text-[#A08040] font-medium">YouTube Transcript Engine</span>
          </div>

          {/* Bottom accent — subtle glow */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600/30">
            <Heart className="h-3 w-3 text-purple-500/30" />
            <span>Photos by Unsplash contributors</span>
          </div>

          {/* Final glow accent */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent blur-sm" />
        </div>
      </div>
    </motion.footer>
  );
}
