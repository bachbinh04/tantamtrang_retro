import { memo, useId, type ReactNode } from 'react';
import type { ArtPattern } from '../../data/projects';

interface Props {
  art: { pattern: ArtPattern; colors: [string, string, string] };
  seed: string;
  variant?: number;
  src?: string;
  alt: string;
  className?: string;
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Project thumbnail. Uses a real image when `src` is given (lazy-loaded);
 * otherwise draws an original, deterministic low-res "cover art" in SVG.
 */
export const ProjectArt = memo(function ProjectArt({ art, seed, variant = 0, src, alt, className = '' }: Props) {
  const uid = useId().replace(/:/g, '');

  if (src) {
    return <img src={src} alt={alt} loading="lazy" decoding="async" className={`block h-full w-full object-cover ${className}`} />;
  }

  const r = rng(`${seed}-${variant}`);
  const [bg, a, b] = art.colors;
  const pattern: ArtPattern = variant ? (['grid', 'sun', 'waves', 'blocks', 'orbit', 'terrain'] as ArtPattern[])[(['grid', 'sun', 'waves', 'blocks', 'orbit', 'terrain'].indexOf(art.pattern) + variant) % 6] : art.pattern;
  let body: ReactNode = null;

  switch (pattern) {
    case 'grid': {
      const lines = [];
      for (let i = -8; i <= 8; i++) lines.push(<line key={`v${i}`} x1={80} y1={58} x2={80 + i * 22} y2={120} stroke={a} strokeOpacity={0.55} strokeWidth={0.6} />);
      for (let j = 0; j < 7; j++) {
        const y = 58 + Math.pow(j / 6, 1.8) * 62;
        lines.push(<line key={`h${j}`} x1={0} y1={y} x2={160} y2={y} stroke={a} strokeOpacity={0.5} strokeWidth={0.6} />);
      }
      const bars = Array.from({ length: 9 }, (_, i) => {
        const h = 10 + r() * 32;
        return <rect key={i} x={26 + i * 12} y={54 - h} width={7} height={h} fill={i % 3 === 0 ? b : a} opacity={0.85} />;
      });
      body = (
        <>
          <rect y={56} width={160} height={4} fill={b} opacity={0.35} />
          {lines}
          {bars}
        </>
      );
      break;
    }
    case 'sun': {
      body = (
        <>
          <circle cx={80} cy={66} r={34} fill={`url(#sun-${uid})`} />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={40} y={70 + i * 5.5} width={80} height={1.2 + i * 0.6} fill={bg} />
          ))}
          <path d={`M0 120 L0 92 L28 74 L46 86 L70 70 L96 88 L118 72 L160 94 L160 120 Z`} fill={bg} opacity={0.95} />
          <path d={`M0 92 L28 74 L46 86 L70 70 L96 88 L118 72 L160 94`} fill="none" stroke={a} strokeWidth={0.8} />
        </>
      );
      break;
    }
    case 'waves': {
      body = (
        <>
          {Array.from({ length: 9 }, (_, k) => {
            const amp = 4 + r() * 10;
            const f = 0.04 + r() * 0.05;
            const ph = r() * 6;
            const y0 = 20 + k * 11;
            let d = '';
            for (let x = 0; x <= 160; x += 4) d += `${x === 0 ? 'M' : 'L'}${x} ${(y0 + Math.sin(x * f + ph) * amp).toFixed(1)} `;
            return <path key={k} d={d} fill="none" stroke={k % 2 ? a : b} strokeOpacity={0.4 + k * 0.06} strokeWidth={1} />;
          })}
        </>
      );
      break;
    }
    case 'blocks': {
      const cells = [];
      for (let y = 0; y < 12; y++)
        for (let x = 0; x < 16; x++) {
          const v = r();
          if (v > 0.62) cells.push(<rect key={`${x}-${y}`} x={x * 10 + 1} y={y * 10 + 1} width={8} height={8} fill={v > 0.88 ? b : a} opacity={0.3 + (v - 0.62) * 2} />);
        }
      body = <>{cells}</>;
      break;
    }
    case 'orbit': {
      body = (
        <>
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx={80} cy={62} rx={22 + i * 16} ry={8 + i * 6} fill="none" stroke={i % 2 ? a : b} strokeOpacity={0.6} strokeWidth={0.8} transform={`rotate(${-12 + i * 3} 80 62)`} />
          ))}
          <circle cx={80} cy={62} r={11} fill={`url(#sun-${uid})`} />
          {[0, 1, 2].map((i) => {
            const ang = r() * Math.PI * 2;
            const rx = 38 + i * 16;
            return <circle key={i} cx={80 + Math.cos(ang) * rx} cy={62 + Math.sin(ang) * (14 + i * 6)} r={2.4} fill={i % 2 ? b : a} />;
          })}
          {Array.from({ length: 30 }, (_, i) => (
            <rect key={`s${i}`} x={r() * 160} y={r() * 120} width={1} height={1} fill="#fff" opacity={0.3 + r() * 0.5} />
          ))}
        </>
      );
      break;
    }
    case 'terrain': {
      const pts: [number, number][] = [];
      for (let x = 0; x <= 160; x += 16) pts.push([x, 62 + r() * 26]);
      const tris = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        tris.push(<path key={i} d={`M${x1} ${y1} L${x2} ${y2} L${(x1 + x2) / 2} 120 Z`} fill={i % 2 ? a : b} opacity={0.35 + r() * 0.3} />);
        tris.push(<path key={`b${i}`} d={`M${x1} ${y1} L${(x1 + x2) / 2} 120 L${x1} 120 Z`} fill={bg} opacity={0.5} />);
      }
      body = (
        <>
          <circle cx={118} cy={36} r={12} fill={b} opacity={0.85} />
          {tris}
          <path d={`M${pts.map((p) => p.join(' ')).join(' L')}`} fill="none" stroke={b} strokeWidth={0.8} />
        </>
      );
      break;
    }
  }

  return (
    <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" className={`block h-full w-full ${className}`} role="img" aria-label={alt}>
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor="#05070d" />
        </linearGradient>
        <linearGradient id={`sun-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={b} />
          <stop offset="1" stopColor={a} />
        </linearGradient>
        <pattern id={`scan-${uid}`} width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="1" fill="#000" opacity="0.28" />
        </pattern>
      </defs>
      <rect width="160" height="120" fill={`url(#bg-${uid})`} />
      {body}
      <rect width="160" height="120" fill={`url(#scan-${uid})`} />
    </svg>
  );
});
