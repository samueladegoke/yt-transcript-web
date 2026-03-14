import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

export default function ErrorToast({ error, onClose }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-lg p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-300 mb-1">
                  Extraction Failed
                </h4>
                <p className="text-sm text-red-400/90">{error}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <X className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
