import { motion } from 'framer-motion';
import { Github, BookOpen, FileCode, Heart } from 'lucide-react';

const REPO_URL = 'https://github.com/samueladegoke/yt-transcript';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mt-16 border-t border-slate-800 py-8"
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Links */}
        <div className="flex items-center gap-4">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#C8A941] transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          
          <span className="text-slate-700">•</span>
          
          <a
            href="https://pypi.org/project/yt-transcript-mcp/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#00D4FF] transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>PyPI</span>
          </a>
          
          <span className="text-slate-700">•</span>
          
          <a
            href={`${REPO_URL}/tree/main/backend`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-colors"
          >
            <FileCode className="h-4 w-4" />
            <span>API Docs</span>
          </a>
        </div>

        {/* Copyright */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <img src="/assets/brand/E.T.D_logo_f4_transparent.png" alt="E.T.D" className="h-6 w-auto opacity-70" />
          <span>© {currentYear} E.T.D — Elohim Tech Dynamics</span>
          <span className="text-slate-700">|</span>
          <span className="text-[#C8A941]">YouTube Transcript Engine</span>
        </div>
      </div>
    </motion.footer>
  );
}
