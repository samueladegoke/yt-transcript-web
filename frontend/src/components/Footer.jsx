import { motion } from 'framer-motion';
import { Github, BookOpen, FileCode, Heart } from 'lucide-react';

const REPO_URL = 'https://github.com/samueladegoke/yt-transcript-web';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mt-16 relative"
    >
      {/* Subtle photo strip — premium footer treatment */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C8A941]/20 to-transparent" />

      <div className="border-t border-white/[0.04] pt-8 pb-12">
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Links */}
          <div className="flex items-center gap-5">
            <motion.a
              whileHover={{ scale: 1.05, y: -1 }}
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#C8A941] transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </motion.a>

            <span className="text-white/[0.06]">•</span>

            <motion.a
              whileHover={{ scale: 1.05, y: -1 }}
              href="https://github.com/samueladegoke/yt-transcript-web/tree/main/backend/app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#00D4FF] transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <span>Docs</span>
            </motion.a>

            <span className="text-white/[0.06]">•</span>

            <motion.a
              whileHover={{ scale: 1.05, y: -1 }}
              href={`${REPO_URL}/tree/main/backend`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-colors"
            >
              <FileCode className="h-4 w-4" />
              <span>API</span>
            </motion.a>
          </div>

          {/* Brand copyright */}
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <img src="/assets/brand/E.T.D_logo_f4_transparent.png" alt="E.T.D" className="h-7 w-auto opacity-50" />
            <span>© {currentYear} E.T.D — Elohim Tech Dynamics</span>
            <span className="text-white/[0.06]">|</span>
            <span className="text-[#A08040] font-medium">YouTube Transcript Engine</span>
          </div>

          {/* Photo attribution strip */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600/40">
            <Heart className="h-3 w-3" />
            <span>Photos by Unsplash contributors</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
