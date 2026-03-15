import { useMemo, useState } from 'react';

/**
 * BrandIcon — 4-tier icon resolution with graceful fallback.
 *
 * Tier 0: Brandfetch CDN  — real company logos (requires domain prop + brandfetch_client_id)
 * Tier 1: Dashboard Icons — 1,800+ dev tool / self-hosted service mascots
 * Tier 2: Iconify CDN     — 290K+ icons from 200+ open-source icon sets
 * Tier 3: Custom inline SVG — hand-crafted fallbacks for MCP and OpenClaw
 *
 * Usage:
 *   <BrandIcon name="openclaw" size={24} />          — Tier 1 or 3
 *   <BrandIcon domain="stripe.com" size={48} />       — Tier 0 (real logo)
 *   <BrandIcon name="github" size={24} color="#fff" /> — Tier 2 (Iconify)
 */

/* ─── Tier 1: Dashboard Icons (known slugs) ─────────────────────────── */
const DASHBOARD_ICONS_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons';
const DASHBOARD_KNOWN_SLUGS = new Set([
  'openclaw','homarr','nextcloud','portainer','jellyfin','pihole','adguard',
  'homeassistant','plex','sonarr','radarr','tautulli','nzbget','deluge',
  'transmission','qbittorrent','sabnzbd','emby','navidrome','immich',
  'paperless','vaultwarden','uptime-kuma','gatus','grafana','prometheus',
  'traefik','nginx','caddy','authentik','keycloak','wireguard','zerotier',
  'tailscale','syncthing','minio','searxng','whisper','ollama','openwebui',
  'n8n','dify','flowise','langflow','supabase','appwrite','directus',
  'strapi','payload','ghost','wordpress','drupal','matomo','plausible',
  'umami','goatcounter','wikijs','bookstack','hugo','jekyll','eleventy',
  'vercel','netlify','cloudflare','aws','azure','gcp','digitalocean',
  'linode','vultr','hetzner','oracle','github','gitlab','gitea','codeberg',
  'bitbucket','vscode','cursor','windsurf','cline','codeium','jetbrains',
  'docker','kubernetes','terraform','ansible','vagrant','virtualbox',
]);

/* ─── Tier 2: Iconify (broad icon sets) ─────────────────────────────── */
function iconifyUrl(slug) {
  return `https://api.iconify.design/mdi/${slug}.svg`;
}

/* ─── Tier 3: Custom SVGs (hand-crafted, no AI) ─────────────────────── */
const MCP_LOGO_SVG = `<svg viewBox="0 0 195 195" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M25 97.8528L92.8822 29.9706C102.255 20.598 117.451 20.598 126.823 29.9706V29.9706C136.196 39.3431 136.196 54.5391 126.823 63.9117L75.5581 115.177" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
<path d="M76.2652 114.47L126.823 63.9117C136.196 54.5391 151.392 54.5391 160.765 63.9117L161.118 64.2652C170.491 73.6378 170.491 88.8338 161.118 98.2063L99.7248 159.6C96.6006 162.724 96.6006 167.789 99.7248 170.913L112.331 183.52" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
<path d="M109.853 46.9411L59.6482 97.1457C50.2756 106.518 50.2756 121.714 59.6482 131.087V131.087C69.0208 140.459 84.2167 140.459 93.5893 131.087L143.794 80.8822" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
</svg>`;

/* ─── Slug ↔ name mapping ───────────────────────────────────────────── */
const SLUG_MAP = {
  // AI / Dev tools → Iconify slugs (Material Design Icons)
  anthropic: 'robot-outline',
  cursor: 'cursor-default-outline',
  vscode: 'microsoft-visual-studio-code',
  'vscode-copilot': 'robot',
  copilot: 'robot',
  windsurf: 'surfing',
  cline: 'account-outline',
  codeium: 'code-braces',
  openai: 'brain',
  claude: 'robot-outline',
  python: 'language-python',
  typescript: 'language-typescript',
  react: 'react',
  github: 'github',
  gitlab: 'gitlab',
  docker: 'docker',
  kubernetes: 'kubernetes',
  ollama: 'face-agent',
  // Brandfetch-domain names (Tier 0)
  stripe: { domain: 'stripe.com' },
  google: { domain: 'google.com' },
  microsoft: { domain: 'microsoft.com' },
  apple: { domain: 'apple.com' },
  vercel: { domain: 'vercel.com' },
  netlify: { domain: 'netlify.com' },
  cloudflare: { domain: 'cloudflare.com' },
  supabase: { domain: 'supabase.com' },
  linear: { domain: 'linear.app' },
  notion: { domain: 'notion.so' },
  figma: { domain: 'figma.com' },
  slack: { domain: 'slack.com' },
  discord: { domain: 'discord.com' },
};

/* ─── Fallback SVG (geometric neutral) ──────────────────────────────── */
function fallbackSvg(size, color) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
    <path d="M8 12h8M12 8v8" stroke="${color}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
  </svg>`;
}

export default function BrandIcon({
  name,
  domain,
  size = 24,
  color = '#ffffff',
  className = '',
  style = {},
}) {
  const [tier, setTier] = useState(0);
  const resolved = useMemo(() => {
    const n = (name || '').toLowerCase().replace(/\s+/g, '');
    const d = (domain || '').toLowerCase();
    const mapping = SLUG_MAP[n];

    // Tier 0: Brandfetch domain
    if (d) {
      const clientId = import.meta.env.VITE_BRANDFETCH_CLIENT_ID;
      return {
        tier: 0,
        url: `https://cdn.brandfetch.io/${d}?c=${clientId || ''}&w=${size}`,
        slug: d,
      };
    }
    // Tier 0: Brandfetch from name mapping
    if (mapping && typeof mapping === 'object' && mapping.domain) {
      const clientId = import.meta.env.VITE_BRANDFETCH_CLIENT_ID;
      return {
        tier: 0,
        url: `https://cdn.brandfetch.io/${mapping.domain}?c=${clientId || ''}&w=${size}`,
        slug: mapping.domain,
      };
    }

    // Dashboard Icons known slug?
    if (DASHBOARD_KNOWN_SLUGS.has(n)) {
      return {
        tier: 1,
        url: `${DASHBOARD_ICONS_BASE}/png/${n}.png`,
        svgUrl: `${DASHBOARD_ICONS_BASE}/svg/${n}.svg`,
        slug: n,
      };
    }

    // Tier 2: Iconify (always available)
    const iconifySlug = typeof mapping === 'string' ? mapping : n;
    return {
      tier: 2,
      url: iconifyUrl(iconifySlug),
      slug: iconifySlug,
    };
  }, [name, domain, size]);

  // Tier 3: Custom SVG for MCP
  const n = (name || '').toLowerCase().replace(/\s+/g, '');
  if (n === 'mcp' || n === 'generic-mcp') {
    return (
      <span
        className={`inline-block ${className}`}
        style={{ width: size, height: size, color, ...style }}
        dangerouslySetInnerHTML={{ __html: MCP_LOGO_SVG }}
      />
    );
  }

  const finalColor = color || '#ffffff';

  // Try Dashboard Icons SVG first (Tier 1), fall back to Iconify (Tier 2)
  if (resolved.tier === 1) {
    return (
      <DashboardIconFallback
        slug={resolved.slug}
        pngUrl={resolved.url}
        svgUrl={resolved.svgUrl}
        size={size}
        color={finalColor}
        className={className}
        style={style}
        name={name}
      />
    );
  }

  // Tier 0 (Brandfetch) or Tier 2 (Iconify) — both use <img>
  return (
    <img
      src={resolved.url}
      alt={name || domain}
      width={size}
      height={size}
      loading="lazy"
      className={`inline-block ${className}`}
      style={{ objectFit: 'contain', ...style }}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = `data:image/svg+xml,${encodeURIComponent(fallbackSvg(size, finalColor))}`;
      }}
    />
  );
}

/* ─── Dashboard Icons: try SVG first, PNG fallback ──────────────────── */
function DashboardIconFallback({ slug, pngUrl, svgUrl, size, color, className, style, name }) {
  const [usePng, setUsePng] = useState(false);

  if (usePng) {
    return (
      <img
        src={pngUrl}
        alt={name || slug}
        width={size}
        height={size}
        loading="lazy"
        className={`inline-block ${className}`}
        style={{ objectFit: 'contain', ...style }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `data:image/svg+xml,${encodeURIComponent(fallbackSvg(size, color))}`;
        }}
      />
    );
  }

  return (
    <img
      src={svgUrl}
      alt={name || slug}
      width={size}
      height={size}
      loading="lazy"
      className={`inline-block ${className}`}
      style={{ objectFit: 'contain', ...style }}
      onError={() => setUsePng(true)}
    />
  );
}
