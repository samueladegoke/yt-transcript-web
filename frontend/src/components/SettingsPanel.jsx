import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Bell, Globe, Palette } from 'lucide-react';
import { cn } from '../lib/utils';

export function SettingsPanel({ settings, onSettingsChange, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md mx-4 rounded-2xl border border-white/[0.06] glassmorphism overflow-hidden"
      >
        {/* Top-edge light catch */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#C8A941]/30 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white font-display">Settings</h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sound Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A08040]/80">Sound</h3>
            <SettingToggle
              icon={settings.soundEnabled ? Volume2 : VolumeX}
              label="Sound Alerts"
              description="Play notification sounds when transcripts are ready"
              enabled={settings.soundEnabled}
              onToggle={() => onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled })}
            />
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A08040]/80">Notifications</h3>
            <SettingToggle
              icon={Bell}
              label="Browser Notifications"
              description="Show desktop notifications when extraction completes"
              enabled={settings.notificationsEnabled}
              onToggle={() => onSettingsChange({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
            />
          </div>

          {/* Language Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A08040]/80">Language</h3>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0A1832]/40 px-4 py-3">
              <Globe className="h-4 w-4 text-[#00D4FF]/60" />
              <select
                value={settings.language}
                onChange={(e) => onSettingsChange({ ...settings, language: e.target.value })}
                className="flex-1 bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
              >
                <option value="en" className="bg-[#0A1832]">English</option>
                <option value="es" className="bg-[#0A1832]">Spanish</option>
                <option value="fr" className="bg-[#0A1832]">French</option>
                <option value="de" className="bg-[#0A1832]">German</option>
                <option value="pt" className="bg-[#0A1832]">Portuguese</option>
                <option value="ja" className="bg-[#0A1832]">Japanese</option>
                <option value="ko" className="bg-[#0A1832]">Korean</option>
                <option value="zh" className="bg-[#0A1832]">Chinese</option>
              </select>
            </div>
          </div>

          {/* Theme Hint */}
          <div className="rounded-xl border border-[#C8A941]/15 bg-[#C8A941]/[0.04] p-4">
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-[#C8A941]/60" />
              <p className="text-sm text-slate-300">
                <span className="font-medium text-[#E8C85A]">E.T.D Dark Theme</span> — optimized for readability with brand accents
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SettingToggle({ icon: Icon, label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#0A1832]/30 px-4 py-3 transition-colors hover:bg-[#0A1832]/50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${enabled ? 'text-[#00D4FF]' : 'text-slate-500'}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <p className="text-xs text-slate-500 truncate">{description}</p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
          enabled ? "bg-gradient-to-r from-[#00D4FF] to-[#0088cc]" : "bg-slate-700"
        )}
      >
        <motion.div
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
        />
      </motion.button>
    </div.div>
  );
}
