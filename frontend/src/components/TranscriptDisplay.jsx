import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Clock } from 'lucide-react';

export default function TranscriptDisplay({ lines, onLineClick }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = useCallback(async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    onLineClick?.(text);
  }, [onLineClick]);

  return (
    <div className="h-[56vh] overflow-y-auto rounded-xl border border-white/[0.04] bg-[#0A1832]/40 backdrop-blur-sm p-3 custom-scrollbar">
      <AnimatePresence>
        <ul role="list" aria-label="Transcript lines" className="space-y-1.5">
          {lines.map((line, index) => (
            <motion.li
              key={`${line.seconds}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.015, duration: 0.3, ease: 'easeOut' }}
              onClick={() => handleCopy(line.text, index)}
              className="group relative grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg bg-white/[0.02] px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-white/[0.04] hover:border-l-2 hover:border-l-[#C8A941] hover:shadow-[0_0_12px_rgba(200,169,65,0.04)]"
            >
              {/* Timestamp pill — gold accent */}
              <div className="flex items-center">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#C8A941]/[0.08] px-2.5 py-1 text-xs font-semibold text-[#E8C85A] transition-colors duration-200 group-hover:bg-[#C8A941]/[0.14]"
                >
                  <Clock className="h-3 w-3" />
                  {line.timestamp}
                </motion.span>
              </div>

              {/* Transcript text */}
              <span className="text-sm leading-relaxed text-slate-300 select-none group-hover:text-slate-200 transition-colors">
                {line.text}
              </span>

              {/* Copy indicator */}
              <div className="flex items-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#C8A941]/[0.1] transition-all duration-200"
                  title="Click to copy"
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-[#C8A941]" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500 group-hover:text-[#A08040]" />
                  )}
                </motion.button>
              </div>
            </motion.li>
          ))}
        </ul>
      </AnimatePresence>
    </div>
  );
}
