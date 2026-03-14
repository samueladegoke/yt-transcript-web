import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Clock } from 'lucide-react';

export default function TranscriptDisplay({ lines, onLineClick }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = useCallback(async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-HTTPS
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
    <div className="h-[56vh] overflow-y-auto rounded-xl border border-slate-800 bg-[#111111] p-3 custom-scrollbar">
      <AnimatePresence>
        <ul className="space-y-2">
          {lines.map((line, index) => (
            <motion.li
              key={`${line.seconds}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.35, ease: 'easeOut' }}
              onClick={() => handleCopy(line.text, index)}
              className="group relative grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg bg-[#171717] px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-[#1e1e1e] hover:border-l-2 hover:border-l-[#00E676] hover:shadow-md"
            >
              {/* Timestamp pill */}
              <div className="flex items-center">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#00E676]/10 px-2.5 py-1 text-xs font-semibold text-[#00E676] transition-colors duration-200 group-hover:bg-[#00E676]/20"
                >
                  <Clock className="h-3 w-3" />
                  {line.timestamp}
                </motion.span>
              </div>

              {/* Transcript text */}
              <span className="text-sm leading-relaxed text-slate-200 select-none">
                {line.text}
              </span>

              {/* Copy indicator (appears on hover) */}
              <div className="flex items-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#00E676]/10 transition-all duration-200"
                  title="Click to copy"
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-[#00E676]" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500 group-hover:text-[#00E676]" />
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
