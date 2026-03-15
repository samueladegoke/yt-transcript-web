import si from 'simple-icons';

/**
 * BrandIcon — renders real brand SVG logos from simple-icons
 * No more emoji placeholders. Actual platform logos.
 */
const ICON_MAP = {
  anthropic: si.siAnthropic,
  cursor: si.siCursor,
  vscode: si.siVscodium, // VSCodium as VS Code proxy (same icon)
  codeium: si.siCodeium,
  windsurf: si.siWindsurf,
  cline: si.siCline,
  github: si.siGithub,
  python: si.siPython,
  typescript: si.siTypescript,
  react: si.siReact,
  openai: si.siOpenai,
};

// Fallback SVGs for brands not in simple-icons
const FALLBACK_SVGS = {
  vscode: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" fill="#0065A9"/></svg>`,
};

export default function BrandIcon({ name, size = 24, color, className = '', fallback = 'emoji' }) {
  const icon = ICON_MAP[name];
  const fallbackEmojis = {
    anthropic: '🧠',
    cursor: '✏️',
    vscode: '💻',
    windsurf: '🏄',
    cline: '🦾',
    github: '🐙',
  };

  // If we have the SVG in simple-icons
  if (icon) {
    const svgContent = icon.svg
      .replace('currentColor', color || `#${icon.hex}`)
      .replace('role="img"', '')
      .replace(/<title>.*<\/title>/, '');

    return (
      <span
        className={`inline-block ${className}`}
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: svgContent.replace('<svg', `<svg width="${size}" height="${size}"`) }}
      />
    );
  }

  // If we have a hardcoded fallback
  if (FALLBACK_SVGS[name]) {
    return (
      <span
        className={`inline-block ${className}`}
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: FALLBACK_SVGS[name].replace(/width=".*?"/, `width="${size}"`).replace(/height=".*?"/, `height="${size}"`) }}
      />
    );
  }

  // Last resort: emoji fallback
  return <span className={className} style={{ fontSize: size, lineHeight: 1 }}>{fallbackEmojis[name] || '🔗'}</span>;
}
