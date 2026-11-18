import type { Ref } from 'react';

interface Props {
  turbulenceRef: Ref<SVGFETurbulenceElement>;
  displacementRef: Ref<SVGFEDisplacementMapElement>;
  offsetRRef: Ref<SVGFEOffsetElement>;
  offsetBRef: Ref<SVGFEOffsetElement>;
}

/**
 * SVG filter used by glitch levels 2–4:
 *   horizontal-band turbulence → displacement (signal tearing)
 *   → split red / cyan channels and offset them (RGB separation).
 * Values are animated from JS only while a glitch runs.
 */
export function CRTGlitch({ turbulenceRef, displacementRef, offsetRRef, offsetBRef }: Props) {
  return (
    <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
      <filter id="crt-glitch" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
        <feTurbulence ref={turbulenceRef} type="fractalNoise" baseFrequency="0.00001 0.06" numOctaves={1} seed={3} result="noise" />
        {/* lock the G channel to 0.5 so displacement is horizontal only */}
        <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1" result="hnoise" />
        <feDisplacementMap ref={displacementRef} in="SourceGraphic" in2="hnoise" scale="0" xChannelSelector="R" yChannelSelector="G" result="torn" />
        <feColorMatrix in="torn" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
        <feOffset ref={offsetRRef} in="red" dx="0" result="redShift" />
        <feColorMatrix in="torn" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cyan" />
        <feOffset ref={offsetBRef} in="cyan" dx="0" result="cyanShift" />
        <feBlend in="redShift" in2="cyanShift" mode="screen" />
      </filter>
    </svg>
  );
}
