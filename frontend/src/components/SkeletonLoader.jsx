import { motion } from 'framer-motion';

export default function SkeletonLoader({ lines = 5 }) {
  return (
    <div className="h-[56vh] overflow-y-auto rounded-xl border border-white/[0.04] bg-[#0A1832]/40 backdrop-blur-sm p-3 custom-scrollbar">
      <ul className="space-y-1.5">
        {Array.from({ length: lines }).map((_, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            className="grid grid-cols-[auto_1fr] gap-3 rounded-lg bg-[#0A1832] px-4 py-3"
          >
            {/* Timestamp skeleton - pill shape */}
            <div className="flex items-center">
              <div className="h-6 w-20 rounded-full skeleton-shimmer" />
            </div>

            {/* Text skeleton lines */}
            <div className="space-y-2.5 py-0.5">
              <div
                className="h-4 rounded skeleton-shimmer"
                style={{ width: `${60 + (index * 7) % 30}%` }}
              />
              <div
                className="h-4 rounded skeleton-shimmer"
                style={{ width: `${30 + (index * 11) % 40}%`, animationDelay: '0.2s' }}
              />
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
