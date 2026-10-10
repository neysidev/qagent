import { useId } from "react";

export function PixelGrid({
  cols, rows, cell = 8, gap = 4, density = 0.08, twinkle = 0, seed = 7, lit, color = "var(--accent)", className = "",
}: {
  cols: number;
  rows: number;
  cell?: number;
  gap?: number;
  density?: number;
  twinkle?: number;
  seed?: number;
  lit?: number[];
  color?: string;
  className?: string;
}) {
  const id = useId();
  const step = cell + gap;
  const w = cols * step - gap;
  const h = rows * step - gap;
  const all = Array.from({ length: cols * rows }, (_, i) => i);
  const on = lit ?? all.filter((i) => rand(i * 31 + seed) < density);
  const blink = all.filter((i) => rand(i * 17 + seed + 3) < twinkle);
  const at = (i: number) => ({ x: (i % cols) * step, y: Math.floor(i / cols) * step, width: cell, height: cell, rx: cell / 4 });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={id} width={step} height={step} patternUnits="userSpaceOnUse">
          <rect width={cell} height={cell} rx={cell / 4} fill="var(--pixel-off)" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={`url(#${id})`} />
      {on.map((i) => <rect key={i} {...at(i)} fill={color} />)}
      {blink.map((i) => (
        <rect key={`t${i}`} {...at(i)} fill={color} className="pixel-twinkle"
          style={{ animationDuration: `${4 + rand(i + seed) * 5}s`, animationDelay: `-${(rand(i * 7 + seed) * 9).toFixed(2)}s` }}
        />
      ))}
    </svg>
  );
}

function rand(n: number) {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}
