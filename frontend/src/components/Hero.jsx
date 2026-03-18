import { motion } from 'framer-motion';
import { Sparkles, Zap, Play, Brain, FileText } from 'lucide-react';
// Brand SVG logos — OFFICIAL from simple-icons and Iconify logos prefix
const BRAND_SVGS = {
  // Google — official from Iconify logos
  google: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 262"><path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"/><path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"/><path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"/><path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"/></svg>`,
  // GitHub — official from Iconify logos
  github: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 250"><path fill="#94a3b8" d="M128.001 0C57.317 0 0 57.307 0 128.001c0 56.554 36.676 104.535 87.535 121.46c6.397 1.185 8.746-2.777 8.746-6.158c0-3.052-.12-13.135-.174-23.83c-35.61 7.742-43.124-15.103-43.124-15.103c-5.823-14.795-14.213-18.73-14.213-18.73c-11.613-7.944.876-7.78.876-7.78c12.853.902 19.621 13.19 19.621 13.19c11.417 19.568 29.945 13.911 37.249 10.64c1.149-8.272 4.466-13.92 8.127-17.116c-28.431-3.236-58.318-14.212-58.318-63.258c0-13.975 5-25.394 13.188-34.358c-1.329-3.224-5.71-16.242 1.24-33.874c0 0 10.749-3.44 35.21 13.121c10.21-2.836 21.16-4.258 32.038-4.307c10.878.049 21.837 1.47 32.066 4.307c24.431-16.56 35.165-13.12 35.165-13.12c6.967 17.63 2.584 30.65 1.255 33.873c8.207 8.964 13.173 20.383 13.173 34.358c0 49.163-29.944 59.988-58.447 63.157c4.591 3.972 8.682 11.762 8.682 23.704c0 17.126-.148 30.91-.148 35.126c0 3.407 2.304 7.398 8.792 6.14C219.37 232.5 256 184.537 256 128.002C256 57.307 198.691 0 128.001 0"/></svg>`,
  // Vercel — official triangle from Iconify logos
  vercel: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 222"><path fill="#94a3b8" d="m128 0l128 221.705H0z"/></svg>`,
  // Cloudflare — official from Iconify logos (orange)
  cloudflare: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 256 117"><path fill="#F38020" d="M205.52 50.813c-.858 0-1.705.03-2.551.058a49.98 49.98 0 0 0-35.946-15.028c-24.33 0-45.092 16.38-51.462 38.993a37.1 37.1 0 0 0-24.674-9.383c-20.652 0-37.391 16.74-37.391 37.391s16.74 37.391 37.391 37.391h179.054a25.3 25.3 0 0 0 25.289-25.289A25.29 25.29 0 0 0 205.52 50.813"/></svg>`,
  // Supabase — official from Iconify logos (green)
  supabase: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 263"><defs><linearGradient id="supG1" x1="20.862%" x2="63.426%" y1="20.687%" y2="44.071%"><stop offset="0%" stop-color="#249361"/><stop offset="100%" stop-color="#3ECF8E"/></linearGradient></defs><path fill="url(#supG1)" d="M149.602 258.579c-6.718 8.46-20.338 3.824-20.5-6.977l-2.367-157.984h106.229c19.24 0 29.971 22.223 18.007 37.292z"/><path fill="#3ECF8E" d="M106.399 4.37c6.717-8.461 20.338-3.826 20.5 6.976l1.037 157.984H23.037c-19.241 0-29.973-22.223-18.008-37.292z"/></svg>`,
  // OpenAI — official interlocking knot from Iconify logos (verified against openai.com)
  openai: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 256 260"><path fill="#94a3b8" d="M239.184 106.203a64.72 64.72 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.72 64.72 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.67 64.67 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.77 64.77 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483m-97.56 136.338a48.4 48.4 0 0 1-31.105-11.255l1.535-.87l51.67-29.825a8.6 8.6 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601M37.158 197.93a48.35 48.35 0 0 1-5.781-32.589l1.534.921l51.722 29.826a8.34 8.34 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803M23.549 85.38a48.5 48.5 0 0 1 25.58-21.333v61.39a8.29 8.29 0 0 0 4.195 7.316l62.874 36.272l-21.845 12.636a.82.82 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405zm179.466 41.695l-63.08-36.63L161.73 77.86a.82.82 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.54 8.54 0 0 0-4.4-7.213m21.742-32.69l-1.535-.922l-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.72.72 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391zM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87l-51.67 29.825a8.6 8.6 0 0 0-4.246 7.367zm11.868-25.58L128.067 97.3l28.188 16.218v32.434l-28.086 16.218l-28.188-16.218z"/></svg>`,
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
