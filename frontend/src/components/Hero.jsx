import { motion } from 'framer-motion';
import { Sparkles, Zap, Play, Brain, FileText } from 'lucide-react';
// Brand SVG logos — proper icons, never emojis
const BRAND_SVGS = {
  google: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#94a3b8" d="M12.24 10.28v3.64h5.66a4.86 4.86 0 0 1-2.14 3.22l3.47 2.7c2.04-1.88 3.22-4.65 3.22-7.96 0-.78-.07-1.53-.2-2.26H12.24v2.86h6.54a5.56 5.56 0 0 0-.95 2.78c0 1.46.53 2.76 1.42 3.75l-1.42 1.18a7.16 7.16 0 0 1-5.35-2.23 7.18 7.18 0 0 1-2.1-5.08c0-.6.09-1.18.24-1.73A7.17 7.17 0 0 1 12 3.4a7.13 7.13 0 0 1 7.1 7.1l-.02 1.48h-6.84z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#94a3b8" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
  vercel: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#94a3b8" d="M12 2L2 22h20L12 2z"/></svg>`,
  cloudflare: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#94a3b8" d="M17.5 9.5c-.3 0-.6.1-.8.2C16.1 6.5 13.3 4.4 10 4.4c-3.4 0-6.2 2.7-6.3 6.1-.1 0-.2 0-.3 0-1.5 0-2.8 1.2-2.8 2.7 0 1.5 1.2 2.7 2.7 2.7h14.2c1.5 0 2.7-1.2 2.7-2.7 0-1.4-1.1-2.6-2.5-2.7h-.2c-.2-.1-.5-.3-.8-.3v-.3z"/></svg>`,
  supabase: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#94a3b8" d="M12 2L2 7.5l10 5.5 10-5.5L12 2zm0 7.5L2 15l10 5.5L22 15l-10-5.5z"/></svg>`,
  openai: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#94a3b8" d="M22.28 10.26a9.3 9.3 0 0 0-.84-3.56 9.45 9.45 0 0 0-6.38-4.7 9.52 9.52 0 0 0-5.06.16 9.37 9.37 0 0 0-4.16 3.27A9.36 9.36 0 0 0 4.3 12a9.33 9.33 0 0 0 1.28 5.27 9.48 9.48 0 0 0 6.43 4.68 9.54 9.54 0 0 0 5.08-.14 9.35 9.35 0 0 0 4.14-3.24 9.34 9.34 0 0 0 1.05-8.35zM12 20.2a8.2 8.2 0 0 1-8.2-8.2 8.16 8.16 0 0 1 3.5-6.7 8.2 8.2 0 0 1 9.4-1.5 8.17 8.17 0 0 1 3.5 6.7A8.2 8.2 0 0 1 12 20.2zm5.8-11.8c-.2 0-.4.1-.5.2l-4.3 2.5a.7.7 0 0 0 0 1.2l4.3 2.5c.2.1.4.1.5.2a.7.7 0 0 0 .7-.7V9.1a.7.7 0 0 0-.7-.7z"/></svg>`,
};

// Brand labels
const BRAND_NAMES = {
  google: 'Google',
  github: 'GitHub',
  vercel: 'Vercel',
  cloudflare: 'Cloudflare',
  supabase: 'Supabase',
  openai: 'OpenAI',
};

// Design orchestrator fetched photos
const HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1636690598773-c50645a47aeb?w=1920&q=80&fit=max', // Abstract AI blue/gold gradient (orchestrator)
  'https://images.unsplash.com/photo-1765619574770-6c7b86e51ae2?w=1920&q=80&fit=max', // Abstract blue bokeh
  'https://images.unsplash.com/photo-1715010895566-32db124e83e5?w=1920&q=80&fit=max', // Purple lines on black
];

const HERO_PHOTO = HERO_PHOTOS[0];

// ─── AnimatedGradientText (Magic-ui inspired) ────────────────────────────────
// Inline implementation — animates gradient colors across text
function AnimatedGradientText({ children, className = '', speed = 1, colorFrom = '#D4AF37', colorTo = '#00D4FF' }) {
  return (
    <span
      className={`inline-block animate-gradient bg-clip-text text-transparent bg-[length:var(--bg-size)_100%] bg-[linear-gradient(90deg,var(--color-from),var(--color-to),var(--color-from))] ${className}`}
      style={{
        '--bg-size': `${speed * 300}%`,
        '--color-from': colorFrom,
        '--color-to': colorTo,
      }}
    >
      {children}
    </span>
  );
}

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] glassmorphism mb-8"
    >
      {/* Premium photo background */}
      <div className="absolute inset-0">
        <picture>
          <source
            srcSet={`${HERO_PHOTO}&w=2560&q=80 2560w, ${HERO_PHOTO}&w=1920&q=80 1920w, ${HERO_PHOTO}&w=1280&q=80 1280w`}
            sizes="100vw"
          />
          <img
            src={HERO_PHOTO}
            alt=""
            role="presentation"
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            width="1920"
            height="1080"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        </picture>
        {/* Layered gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060D1F]/80 via-[#0A1832]/75 to-[#0D1A30]/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060D1F]/40 via-transparent to-[#060D1F]/40" />
      </div>

      {/* Animated background orbs — deeper, more visible */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-[#D4AF37]/12 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[#00D4FF]/10 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-1/4 left-1/4 w-2/3 h-2/3 bg-purple-500/8 rounded-full blur-[100px]"
        />
        {/* Refined grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.015)_1px,transparent_1px)] bg-[size:60px_60px] opacity-50" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 sm:p-12">
        {/* Skip navigation link (accessibility) */}
        <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
          Skip to main content
        </a>

        {/* Watermark Logo — subliminal depth */}
        <img
          src="/assets/brand/E.T.D_logo_f4_transparent.png"
          alt=""
          className="pointer-events-none select-none absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 w-[420px] h-auto opacity-[0.06] hidden md:block"
        />

        {/* Brand badge — with shimmer border effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-4 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.05] backdrop-blur-md px-5 py-3 mb-8 relative overflow-hidden"
        >
          {/* Shimmer sweep on badge border */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <motion.div
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear', delay: 2 }}
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent"
            />
          </div>
          <img src="/assets/brand/E.T.D_logo_f4_transparent.png" alt="E.T.D" className="h-14 w-auto drop-shadow-[0_0_10px_rgba(212,175,55,0.2)] relative z-10" />
          <div className="flex flex-col relative z-10">
            <span className="text-base font-bold tracking-wide text-[#F0D060]">E.T.D</span>
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#A08040]/90">Elohim Tech Dynamics</span>
          </div>
        </motion.div>

        {/* Headline — with AnimatedGradientText on key word */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl font-display leading-[1.05]"
          id="hero-headline"
        >
          YouTube{' '}
          <AnimatedGradientText
            speed={1.5}
            colorFrom="#D4AF37"
            colorTo="#00D4FF"
            className="font-bold"
            aria-label="Transcript"
          >
            Transcript
          </AnimatedGradientText>
          <span className="block text-white/90 text-3xl sm:text-4xl lg:text-5xl mt-1">
            Engine
          </span>
        </motion.h1>

        {/* Subtitle — sharper, more compelling */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-5 max-w-2xl text-lg text-slate-300/80 sm:text-xl leading-relaxed"
        >
          Extract structured transcripts from any YouTube video. AI-powered analysis 
          transforms content into{' '}
          <span className="text-[#F0D060] font-medium">summaries</span>,{' '}
          <span className="text-[#00D4FF] font-medium">action points</span>, and{' '}
          <span className="text-purple-300 font-medium">professional edits</span>.
        </motion.p>

        {/* Feature pills — refined with unique accent colors */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-[#F0D060]/90 shadow-[0_0_28px_rgba(212,175,55,0.12)] transition-all hover:bg-[#D4AF37]/[0.1] hover:border-[#D4AF37]/40 hover:shadow-[0_0_36px_rgba(212,175,55,0.18)]">
            <Zap className="h-4 w-4 text-[#D4AF37]" />
            <span>Instant Extraction</span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-[#00D4FF]/25 bg-[#00D4FF]/[0.06] backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-[#7AE8FF]/90 shadow-[0_0_28px_rgba(0,212,255,0.12)] transition-all hover:bg-[#00D4FF]/[0.1] hover:border-[#00D4FF]/40 hover:shadow-[0_0_36px_rgba(0,212,255,0.18)]">
            <FileText className="h-4 w-4 text-[#00D4FF]" />
            <span>Multi-language</span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-purple-400/25 bg-purple-400/[0.06] backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-purple-300/90 shadow-[0_0_28px_rgba(168,85,247,0.12)] transition-all hover:bg-purple-400/[0.1] hover:border-purple-400/40 hover:shadow-[0_0_36px_rgba(168,85,247,0.18)]">
            <Brain className="h-4 w-4 text-purple-400" />
            <span>4 AI Analysis Modes</span>
          </div>
        </motion.div>

        {/* Built with — refined logos section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 pt-6 border-t border-white/[0.06]"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500/80 mb-4">
            Powered by
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 opacity-60 hover:opacity-80 transition-opacity duration-300">
            {['google', 'github', 'vercel', 'cloudflare', 'supabase', 'openai'].map((brand) => (
              <motion.span
                key={brand}
                whileHover={{ opacity: 1, scale: 1.05, y: -1 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400"
              >
                <span dangerouslySetInnerHTML={{ __html: BRAND_SVGS[brand] }} className="inline-flex" />
                <span>{BRAND_NAMES[brand]}</span>
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Photo attribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-4 flex items-center gap-2 text-[11px] text-slate-500/60"
        >
          <span>Photo by</span>
          <a href="https://unsplash.com/@vackground" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-700/30 hover:text-slate-400 transition-colors">
            vackground.com
          </a>
          <span>on</span>
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-700/30 hover:text-slate-400 transition-colors">
            Unsplash
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
}
