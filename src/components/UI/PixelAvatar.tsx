import { memo } from 'react';

// 16×16 sprite. Edit the map to redesign your character.
const SPRITE = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '..PHHSSSSSSHHP..',
  '..PHSSSSSSSSHP..',
  '..PSSESSSSESSP..',
  '...SSSSSSSSSS...',
  '....SSSMMSSS....',
  '.....SSSSSS.....',
  '......SSSS......',
  '....CCCVVCCC....',
  '...CCCCVVCCCC...',
  '..CCCCCVVCCCCC..',
  '..CCKCCVVCCKCC..',
  '..CCKCCCCCCKCC..',
];

const COLORS: Record<string, string> = {
  H: '#2a1747',
  S: '#f0c3a2',
  E: '#10182b',
  M: '#c45a72',
  P: '#9d5bff',
  C: '#168dff',
  V: '#75f5ff',
  K: '#0e5fb8',
};

export const PixelAvatar = memo(function PixelAvatar() {
  return (
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className="block h-full w-full" role="img" aria-label="Pixel-art avatar">
      <rect width="16" height="16" fill="#0b1226" />
      {SPRITE.flatMap((row, y) =>
        row.split('').map((c, x) => (COLORS[c] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLORS[c]} /> : null)),
      )}
      <rect x="5" y="1" width="2" height="1" fill="#5b3a8a" />
    </svg>
  );
});
