const frame = "fill-card stroke-line-strong";

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

export function NoScenariosIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden>
      <ellipse cx="120" cy="148" rx="86" ry="6" className="fill-fg/5" />
      <rect x="54" y="18" width="132" height="122" rx="12" className={frame} strokeWidth="1.5" />
      <rect x="54" y="18" width="132" height="26" rx="12" className="fill-surface" />
      <path d="M54 44 H186" className="stroke-line-strong" strokeWidth="1.5" />
      <rect x="68" y="28" width="46" height="6" rx="3" className="fill-fg-3" opacity="0.45" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="66" y={54 + i * 27} width="108" height="20" rx="6" fill="none" className="stroke-line-strong" strokeWidth="1.3" strokeDasharray="4 3" />
          <circle cx="77" cy={64 + i * 27} r="4" fill="none" className="stroke-line-strong" strokeWidth="1.3" strokeDasharray="2 2" />
          <rect x="87" y={62 + i * 27} width={[56, 44, 64][i]} height="4" rx="2" className="fill-pixel-off" />
        </g>
      ))}
      <g transform="translate(184 120)">
        <circle r="17" className="fill-card stroke-line-strong" strokeWidth="1.5" />
        <circle r="12" className="fill-danger-soft" />
        <rect x="-4.5" y="-4.5" width="9" height="9" rx="2" className="fill-danger" />
      </g>
    </svg>
  );
}

export function NoStepsIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 160" className={className} aria-hidden>
      <rect x="40" y="10" width="200" height="104" rx="12" className={frame} strokeWidth="1.5" />
      <path d="M40 30 H240" className="stroke-line-strong" strokeWidth="1.5" />
      {[54, 63, 72].map((cx) => <circle key={cx} cx={cx} cy="20" r="2.6" className="fill-pixel-off" />)}
      <rect x="56" y="42" width="78" height="7" rx="3.5" className="fill-pixel-off" />
      <rect x="56" y="56" width="110" height="4" rx="2" className="fill-pixel-off" opacity="0.7" />
      <rect x="56" y="65" width="92" height="4" rx="2" className="fill-pixel-off" opacity="0.7" />
      <circle cx="194" cy="76" r="18" className="fill-accent-soft" />
      <path d="M188 66.5 v19 l15.5 -9.5 z" className="fill-accent" opacity="0.75" strokeLinejoin="round" />
      <path d="M40 132 H240" className="stroke-line-strong" strokeWidth="1.5" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={56 + i * 36} y="122" width="28" height="20" rx="5" className="fill-card stroke-line-strong" strokeWidth="1.3" strokeDasharray="3 2.5" />
          <circle cx={70 + i * 36} cy="132" r="2" className={i === 0 ? "fill-accent" : "fill-pixel-off"} />
        </g>
      ))}
    </svg>
  );
}

export function CleanRunIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      <ellipse cx="100" cy="130" rx="54" ry="5" className="fill-fg/5" />
      <circle cx="100" cy="64" r="46" className="fill-success-soft" />
      <path d="M100 26 L132 38 V64 C132 86 118 100 100 108 C82 100 68 86 68 64 V38 Z" className="fill-card stroke-success" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M86 66 l10 10 l19 -21" fill="none" className="stroke-success" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {[[40, 34, 4], [158, 28, 3], [164, 92, 4.5], [34, 96, 3]].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y - r * 2} q1 ${r * 1.5} ${r * 2} ${r * 2} q-${r * 1.5} 1 -${r * 2} ${r * 2} q-1 -${r * 1.5} -${r * 2} -${r * 2} q${r * 1.5} -1 ${r * 2} -${r * 2} z`}
          className={i % 2 ? "fill-accent" : "fill-success"} opacity="0.7" />
      ))}
    </svg>
  );
}

export function BugHuntIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      <ellipse cx="100" cy="130" rx="56" ry="5" className="fill-fg/5" />
      <rect x="34" y="20" width="112" height="86" rx="12" className={frame} strokeWidth="1.5" />
      {[0, 1, 2].map((i) => <rect key={i} x="48" y={36 + i * 16} width={[70, 54, 62][i]} height="5" rx="2.5" className="fill-pixel-off" />)}
      <g fill="none" className="stroke-fg-3" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 3" opacity="0.7">
        <ellipse cx="118" cy="80" rx="9" ry="11" />
        <circle cx="118" cy="66" r="5" />
        <path d="M109 76 l-7 -3 M109 84 l-8 2 M127 76 l7 -3 M127 84 l8 2" />
      </g>
      <circle cx="122" cy="76" r="26" className="fill-accent/10 stroke-accent" strokeWidth="5" />
      <path d="M141 95 l22 22" className="stroke-accent" strokeWidth="9" strokeLinecap="round" />
      <path d="M108 62 a18 18 0 0 1 12 -6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function SearchEmptyIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden>
      {[0, 1, 2].map((i) => (
        <g key={i} opacity={1 - i * 0.25}>
          <rect x="24" y={16 + i * 24} width="96" height="18" rx="6" className="fill-card stroke-line-strong" strokeWidth="1.2" />
          <rect x="31" y={21 + i * 24} width="8" height="8" rx="2.5" className="fill-pixel-off" />
          <rect x="44" y={23 + i * 24} width={[52, 40, 46][i]} height="4" rx="2" className="fill-pixel-off" />
        </g>
      ))}
      <circle cx="108" cy="62" r="20" className="fill-card stroke-fg-3" strokeWidth="4" />
      <path d="M122 76 l16 16" className="stroke-fg-3" strokeWidth="7" strokeLinecap="round" />
      <path d="M102.5 57 a5.5 5.5 0 1 1 7.5 5.2 c-1.6 0.7 -2 1.6 -2 3.3" fill="none" className="stroke-accent" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="108" cy="71" r="1.8" className="fill-accent" />
    </svg>
  );
}

export function QuietBellIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden>
      <ellipse cx="80" cy="102" rx="34" ry="4" className="fill-fg/5" />
      <circle cx="78" cy="56" r="36" className="fill-accent/10" />
      <path d="M78 26 c-14 0 -22 10 -22 24 v14 l-7 10 h58 l-7 -10 v-14 c0 -14 -8 -24 -22 -24 z" className="fill-card stroke-fg-3" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M71 80 a7 7 0 0 0 14 0" fill="none" className="stroke-fg-3" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="78" cy="24" r="3" className="fill-fg-3" />
      <g className="fill-accent" fontWeight="700" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
        <text x="108" y="38" fontSize="13">z</text>
        <text x="118" y="26" fontSize="10" opacity="0.7">z</text>
        <text x="126" y="16" fontSize="8" opacity="0.45">z</text>
      </g>
    </svg>
  );
}
