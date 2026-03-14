import { motion } from 'framer-motion';

export default function SkeletonLoader({ lines = 5 }) {
  return (
    <div className="h-[56vh] overflow-y-auto rounded-xl border border-slate-800 bg-[#111111] p-3">
      <ul className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="grid grid-cols-[auto_1fr] gap-3 rounded-lg bg-[#171717] px-4 py-3"
          >
            {/* Timestamp skeleton */}
            <div className="w-20 h-6 rounded-full bg-slate-800 animate-pulse" />
            
            {/* Text skeleton */}
            <div className="space-y-2">
              <div
                className="h-4 rounded bg-slate-800 animate-pulse"
                style={{ width: `${Math.random() * 40 + 30}%` }}
              />
              <div
                className="h-4 rounded bg-slate-800 animate-pulse"
                style={{ width: `${Math.random() * 50 + 20}%` }}
              />
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
