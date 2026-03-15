import { motion } from 'framer-motion';

export function ProgressBar({ completed, total, duration }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const perSec = duration > 0 ? (completed / duration).toFixed(1) : 0;

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">
          Checking proxies... {completed}/{total}
        </span>
        <span className="text-[#E8C85A] font-semibold font-display">{percentage}%</span>
      </div>

      {/* Track — glassmorphism bar */}
      <div className="relative h-2 rounded-full bg-white/[0.04] border border-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#C8A941] shadow-[0_0_12px_rgba(0,212,255,0.3)]"
        />
        {/* Shimmer overlay on the filled portion */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{ width: '33%' }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{perSec} proxies/sec</span>
        <span>{duration.toFixed(1)}s elapsed</span>
      </div>
    </div>
  );
}
