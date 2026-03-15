import { useMemo } from 'react';

/**
 * BrandIcon — renders real brand SVG logos from simple-icons CDN.
 * No emoji placeholders. No manufactured/AI-looking generic icons.
 * Actual platform logos with proper fill colors for dark backgrounds.
 */

// Official MCP logo mark (the three-curve node symbol, extracted from the wordmark)
const MCP_LOGO_SVG = `<svg viewBox="0 0 195 195" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M25 97.8528L92.8822 29.9706C102.255 20.598 117.451 20.598 126.823 29.9706V29.9706C136.196 39.3431 136.196 54.5391 126.823 63.9117L75.5581 115.177" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
<path d="M76.2652 114.47L126.823 63.9117C136.196 54.5391 151.392 54.5391 160.765 63.9117L161.118 64.2652C170.491 73.6378 170.491 88.8338 161.118 98.2063L99.7248 159.6C96.6006 162.724 96.6006 167.789 99.7248 170.913L112.331 183.52" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
<path d="M109.853 46.9411L59.6482 97.1457C50.2756 106.518 50.2756 121.714 59.6482 131.087V131.087C69.0208 140.459 84.2167 140.459 93.5893 131.087L143.794 80.8822" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
</svg>`;

// Custom hand-crafted OpenClaw icon — a stylized claw/crown (not a generic emoji)
// Designed to match the E.T.D brand aesthetic (navy/gold/cyan)
const OPENCLAW_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2L8 8H4L6 14H10L8 20L18 12H14L18 8H14L12 2Z" fill="currentColor" opacity="0.9"/>
<path d="M12 2L8 8H4L6 14H10L8 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

// CDN base URL for simple-icons
const SI_BASE = 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons';

/**
 * Get the CDN URL for a simple-icons icon.
 * These are SVGs with a single path using currentColor.
 * We fetch them and replace currentColor with the actual fill.
 */
function getSimpleIconUrl(slug) {
  return `${SI_BASE}/${slug}.svg`;
}

export default function BrandIcon({ name, size = 24, color, className = '', style = {} }) {
  const iconConfig = useMemo(() => {
    const normalized = name?.toLowerCase().replace(/\s+/g, '');

    // Map of icon names to their CDN slugs or custom SVGs
    const iconMap = {
      // AI/Dev tools — simple-icons slugs
      anthropic: { type: 'cdn', slug: 'anthropic' },
      cursor: { type: 'cdn', slug: 'cursor' },
      vscode: { type: 'cdn', slug: 'visualstudiocode' },
      'vscode-copilot': { type: 'cdn', slug: 'githubcopilot' },
      copilot: { type: 'cdn', slug: 'githubcopilot' },
      windsurf: { type: 'cdn', slug: 'windsurf' },
      cline: { type: 'cdn', slug: 'cline' },
      codeium: { type: 'cdn', slug: 'codeium' },
      github: { type: 'cdn', slug: 'github' },
      python: { type: 'cdn', slug: 'python' },
      typescript: { type: 'cdn', slug: 'typescript' },
      react: { type: 'cdn', slug: 'react' },
      openai: { type: 'cdn', slug: 'openai' },
      claude: { type: 'cdn', slug: 'anthropic' },

      // Custom icons (not in simple-icons)
      openclaw: { type: 'custom', svg: OPENCLAW_ICON_SVG },
      'generic-mcp': { type: 'custom', svg: MCP_LOGO_SVG },
      mcp: { type: 'custom', svg: MCP_LOGO_SVG },
    };

    return iconMap[normalized] || null;
  }, [name]);

  // No icon found — return null so parent can show text fallback
  if (!iconConfig) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size, ...style }}
      >
        <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
          <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      </span>
    );
  }

  // Custom SVG — render inline with currentColor
  if (iconConfig.type === 'custom') {
    return (
      <span
        className={`inline-block ${className}`}
        style={{ width: size, height: size, color: color || '#ffffff', ...style }}
        dangerouslySetInnerHTML={{ __html: iconConfig.svg }}
      />
    );
  }

  // CDN icon — fetch SVG and replace currentColor with fill
  const iconUrl = getSimpleIconUrl(iconConfig.slug);
  const resolvedColor = color || '#ffffff';

  return (
    <img
      src={iconUrl}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      className={`inline-block ${className}`}
      style={{
        filter: `brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(${getHueFromColor(resolvedColor)}deg)`,
        opacity: 0.9,
        ...style,
      }}
      onError={(e) => {
        // If CDN fails, show a minimal geometric icon
        e.target.style.display = 'none';
        e.target.parentElement.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><rect x="3" y="3" width="18" height="18" rx="3" fill="${resolvedColor}" opacity="0.6"/></svg>`;
      }}
    />
  );
}

/**
 * Approximate hue rotation from a hex color for simple-icons SVG filter.
 * Simple-icons SVGs use currentColor, but <img> tags can't set that.
 * This filter approach approximates the target color.
 */
function getHueFromColor(hex) {
  // For white (#fff, #ffffff), no rotation needed (simple-icons default is black, invert→white)
  if (hex === '#ffffff' || hex === '#fff' || hex === 'white') return 0;
  // For gold (#C8A941), ~43° hue rotation
  if (hex.toLowerCase().includes('c8a941') || hex.toLowerCase().includes('d4a843')) return 43;
  // For cyan/blue
  if (hex.toLowerCase().includes('00d4ff') || hex.toLowerCase().includes('7ae8ff')) return 190;
  return 0;
}
