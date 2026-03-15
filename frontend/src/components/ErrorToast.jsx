import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, X } from 'lucide-react';

export default function ErrorToast({ error, onClose }) {
  return (
    <AnimatePresence>
      {error && <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        role="alert"
        className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/10 via-red-900/5 to-transparent backdrop-blur-xl px-5 py-4 shadow-[0_0_40px_rgba(250,85,56,0.15)] max-w-md"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 flex-shrink-0">
          <XCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-300">Error</p>
          <p className="mt-0.5 text-sm text-slate-400 leading-relaxed">{error}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          aria-label="Close error"
          className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4 text-slate-400" />
        </motion.button>
      </motion.div>
      }
    </AnimatePresence>
  );
}
