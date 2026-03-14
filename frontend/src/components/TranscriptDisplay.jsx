import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Clock } from 'lucide-react';

export default function TranscriptDisplay({ lines, onLineClick }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = useCallback(async (text, index) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    onLineClick?.(text);
  }, [onLineClick]);

  return (
    <div className="h-[56vh] overflow-y-auto rounded-xl border border-slate-800 bg-[#111111] p-3">
      <AnimatePresence>
        <ul className="space-y-2">
          {lines.map((line, index) => (
            <motion.li
              key={`${line.seconds}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
              className="group relative grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg bg-[#171717] px-4 py-3 transition-all hover:bg-[#1a1a1a] hover:border-l-2 hover:border-l-[#00E676] hover:shadow-md"
            >
              {/* Timestamp pill */}
              <div className="flex items-center">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#00E676]/10 px-2.5 py-1 text-xs font-semibold text-[#00E676] transition-colors group-hover:bg-[#00E676]/20"
                >
                  <Clock className="h-3 w-3" />
                  {line.timestamp}
                </motion.span>
              </div>

              {/* Transcript text */}
              <span className="text-sm leading-relaxed text-slate-200">
                {line.text}
              </span>

              {/* Copy button (appears on hover) */}
              <motion.button
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                onClick={() => handleCopy(line.text, index)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#00E676]/10 transition-all"
                title="Copy line"
              >
                {copiedIndex === index ? (
                  <Check className="h-4 w-4 text-[#00E676]" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-500 group-hover:text-[#00E676]" />
                )}
              </motion.button>
            </motion.li>
          ))}
        </ul>
      </AnimatePresence>
    </div>
  );
}
