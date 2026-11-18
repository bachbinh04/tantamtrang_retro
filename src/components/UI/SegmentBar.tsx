import type { CSSProperties } from 'react';

/** Retro segmented meter (HP / XP / skill level). Segments fill in sequence on mount. */
export function SegmentBar({ value, segments = 12, tone = 'cyan', label }: { value: number; segments?: number; tone?: 'cyan' | 'magenta' | 'green' | 'purple'; label?: string }) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * segments);
  return (
    <div className={`seg-bar seg-bar--${tone}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
      {Array.from({ length: segments }, (_, i) => (
        <i key={i} className={i < filled ? 'on' : ''} style={{ '--i': i } as CSSProperties} />
      ))}
    </div>
  );
}
