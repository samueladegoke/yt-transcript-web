import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const typeStyles = {
  success: {
    icon: CheckCircle,
    border: 'border-emerald-500/30',
    bg: 'from-emerald-500/10 to-transparent',
    glow: 'shadow-[0_0_30px_rgba(52,211,153,0.15)]',
    iconColor: 'text-emerald-400',
  },
  error: {
    icon: XCircle,
    border: 'border-red-500/30',
    bg: 'from-red-500/10 to-transparent',
    glow: 'shadow-[0_0_30px_rgba(250,85,56,0.15)]',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: AlertCircle,
    border: 'border-[#C8A941]/30',
    bg: 'from-[#C8A941]/10 to-transparent',
    glow: 'shadow-[0_0_30px_rgba(200,169,65,0.15)]',
    iconColor: 'text-[#E8C85A]',
  },
};

export default function Toast({ message, type = 'success', onClose }) {
  const style = typeStyles[type] || typeStyles.success;
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border ${style.border} bg-gradient-to-br ${style.bg} backdrop-blur-xl px-5 py-3.5 ${style.glow}`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${style.iconColor}`} />
      <p className="text-sm font-medium text-slate-200 max-w-xs">{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors">
          <X className="h-4 w-4 text-slate-400" />
        </button>
      )}
    </motion.div>
  );
}
