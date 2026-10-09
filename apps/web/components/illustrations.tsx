/** Spot illustrations for app empty/error states. Token colors only, so they follow the theme they render in. */

const frame = "fill-card stroke-line-strong";

/** No projects yet: a browser whose address bar is waiting for a site, with a project card sliding out of it. */
export function SitesIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden>
      <ellipse cx="120" cy="148" rx="92" ry="6" className="fill-fg/5" />
      <rect x="28" y="18" width="184" height="118" rx="14" className={frame} strokeWidth="1.5" />
      <path d="M28 44 H212" className="stroke-line-strong" strokeWidth="1.5" />
      {[42, 52, 62].map((cx) => <circle key={cx} cx={cx} cy="31" r="3" className="fill-pixel-off" />)}
      <rect x="80" y="23" width="118" height="16" rx="8" className="fill-surface stroke-accent" strokeWidth="1.5" />
      <g transform="translate(86 25.5) scale(0.46)" fill="none" className="stroke-accent" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 2.5a14 14 0 0 0 0 19 14 14 0 0 0 0-19M2.5 12h19" />
      </g>
      <rect x="102" y="29" width="48" height="4" rx="2" className="fill-fg-3" opacity="0.5" />
      <rect x="153" y="27" width="1.6" height="8" className="caret fill-accent" />
      <rect x="46" y="58" width="70" height="8" rx="4" className="fill-pixel-off" />
      <rect x="46" y="72" width="104" height="5" rx="2.5" className="fill-pixel-off" opacity="0.7" />
      <rect x="46" y="82" width="86" height="5" rx="2.5" className="fill-pixel-off" opacity="0.7" />
      <rect x="46" y="100" width="44" height="16" rx="8" className="fill-accent-soft" />
      <g transform="rotate(-6 176 100)">
        <rect x="140" y="72" width="78" height="58" rx="12" className="fill-card stroke-line-strong" strokeWidth="1.5" />
        <rect x="150" y="82" width="18" height="18" rx="6" className="fill-accent" />
        <path d="M155 91 h8 M159 87 v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <rect x="174" y="84" width="34" height="5" rx="2.5" className="fill-fg-3" opacity="0.55" />
        <rect x="174" y="93" width="22" height="4" rx="2" className="fill-pixel-off" />
        <rect x="150" y="108" width="58" height="4" rx="2" className="fill-pixel-off" />
        <rect x="150" y="116" width="40" height="4" rx="2" className="fill-pixel-off" />
      </g>
    </svg>
  );
}

/** Not found / failed to load: a page with a broken link and a warning sign. */
export function LostIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden>
      <ellipse cx="120" cy="148" rx="84" ry="6" className="fill-fg/5" />
      <rect x="44" y="22" width="152" height="112" rx="14" className={frame} strokeWidth="1.5" />
      <path d="M44 46 H196" className="stroke-line-strong" strokeWidth="1.5" />
      {[58, 68, 78].map((cx) => <circle key={cx} cx={cx} cy="34" r="3" className="fill-pixel-off" />)}
      <g fill="none" className="stroke-fg-3" strokeWidth="3" strokeLinecap="round">
        <path d="M98 92 l-8 8 a10 10 0 0 0 14 14 l8 -8" />
        <path d="M142 88 l8 -8 a10 10 0 0 0 -14 -14 l-8 8" />
        <path d="M112 74 l-4 -8 M122 72 v-9 M104 82 l-9 -3" className="stroke-accent" />
      </g>
      <g transform="translate(160 92)">
        <path d="M0 -20 L22 18 H-22 Z" className="fill-accent" strokeLinejoin="round" />
        <path d="M0 -6 v11" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="0" cy="11" r="1.8" fill="#fff" />
      </g>
    </svg>
  );
}
