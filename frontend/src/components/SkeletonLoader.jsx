import { motion, useReducedMotion } from 'framer-motion';

const widths = ['max-w-[72%]', 'max-w-[96%]', 'max-w-[80%]', 'max-w-[64%]', 'max-w-[88%]', 'max-w-[72%]'];

export default function SkeletonLoader({ lines = 6 }) {
  const reduce = useReducedMotion();

  return (
    <div className="space-y-4" role="status" aria-label="Loading content">
      {/* Title skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-64 rounded-lg bg-white/[0.04] overflow-hidden relative">
          <div className={`absolute inset-0 ${reduce ? '' : 'animate-shimmer'}`} />
        </div>
        <div className="h-9 w-24 rounded-lg bg-white/[0.04] overflow-hidden relative">
          <div className={`absolute inset-0 ${reduce ? '' : 'animate-shimmer'}`} />
        </div>
      </div>

      {/* Metadata skeleton */}
      <div className="h-4 w-80 rounded bg-white/[0.03]" />

      <div className="border-t border-white/[0.06] pt-5">
        {/* Line skeletons with staggered animation */}
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div
              key={i}
              initial={reduce ? undefined : { opacity: 0, x: -10 }}
              animate={reduce ? undefined : { opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-4"
            >
              {/* Timestamp skeleton — gold tint */}
              <div className="relative w-16 h-5 rounded bg-[#C8A941]/[0.06] overflow-hidden flex-shrink-0">
                <div className={`absolute inset-0 ${reduce ? '' : 'animate-shimmer'}`} />
              </div>
              {/* Text skeleton — varying widths using static Tailwind classes */}
              <div className={`relative h-5 rounded bg-white/[0.04] overflow-hidden flex-1 ${widths[i % 6]}`}>
                <div
                  className={`absolute inset-0 ${reduce ? '' : 'animate-shimmer'}`}
                  style={reduce ? undefined : { animationDelay: `${i * 0.1}s` }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom shimmer bar */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex items-center gap-3"
        >
          <div className="h-1 flex-1 rounded-full bg-white/[0.04] overflow-hidden">
            {!reduce && (
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#00D4FF]/30 to-transparent"
              />
            )}
          </div>
          <span className={`text-xs text-slate-500 ${reduce ? '' : 'animate-pulse'}`}>Extracting transcript...</span>
        </motion.div>
      </div>
    </div>
  );
}
