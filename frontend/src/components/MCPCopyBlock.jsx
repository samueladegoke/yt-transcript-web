import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Terminal } from 'lucide-react';

export default function MCPCopyBlock({ title, config, language = 'json' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting for JSON
  const highlightJson = (text) => {
    if (language !== 'json') return text;
    
    return text
      .replace(/"([^"]+)":/g, '<span class="text-[#8fb3ff]">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-[#00E676]">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-[#ffb86c]">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="text-[#ff79c6]">$1</span>');
  };

  const configLines = config.split('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-700 bg-[#111820] overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 hover:text-[#00E676] hover:bg-[#00E676]/10 transition-all"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      <div className="relative">
        <pre className="p-4 text-sm text-slate-200 overflow-x-auto">
          <code className="font-mono">
            {configLines.map((line, idx) => (
              <div key={idx} className="flex">
                <span className="select-none w-8 shrink-0 text-right mr-4 text-slate-600 text-xs">
                  {idx + 1}
                </span>
                <span 
                  className="flex-1"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightJson(line) 
                  }} 
                />
              </div>
            ))}
          </code>
        </pre>
      </div>
    </motion.div>
  );
}
