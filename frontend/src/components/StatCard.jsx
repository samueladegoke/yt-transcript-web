import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';

const colorMap = {
  gold: {
    bg: 'bg-[#C8A941]/[0.06]',
    border: 'border-[#C8A941]/20',
    text: 'text-[#E8C85A]',
    glow: 'shadow-[0_0_24px_rgba(200,169,65,0.12)]',
    iconBg: 'bg-[#C8A941]/10',
  },
  cyan: {
    bg: 'bg-[#00D4FF]/[0.06]',
    border: 'border-[#00D4FF]/20',
    text: 'text-[#7AE8FF]',
    glow: 'shadow-[0_0_24px_rgba(0,212,255,0.12)]',
    iconBg: 'bg-[#00D4FF]/10',
  },
  purple: {
    bg: 'bg-purple-400/[0.06]',
    border: 'border-purple-400/20',
    text: 'text-purple-300',
    glow: 'shadow-[0_0_24px_rgba(168,85,247,0.12)]',
    iconBg: 'bg-purple-400/10',
  },
  green: {
    bg: 'bg-emerald-400/[0.06]',
    border: 'border-emerald-400/20',
    text: 'text-emerald-300',
    glow: 'shadow-[0_0_24px_rgba(52,211,153,0.12)]',
    iconBg: 'bg-emerald-400/10',
  },
};

export default function StatCard({ label, value, icon: Icon, color = 'gold', className }) {
  const colors = colorMap[color] || colorMap.gold;

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 10 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
      transition={reduce ? undefined : { duration: 0.3 }}
      className={cn(
        "relative rounded-xl border p-4 backdrop-blur-sm overflow-hidden",
        colors.border,
        colors.bg,
        colors.glow,
        className
      )}
    >
      {/* Top-edge light catch */}
      <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-center gap-3">
        {Icon && (
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg}`}
          >
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </motion.div>
        )}
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-2xl font-bold ${colors.text} font-display`}
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
