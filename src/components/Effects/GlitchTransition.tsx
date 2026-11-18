import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Channel-switch transition: the old picture smears sideways and blows out,
 * the new one rolls in from a collapsed raster line. Paired with a L4 glitch.
 */
const analog: Variants = {
  initial: { opacity: 0, scaleY: 0.015, scaleX: 1.12, filter: 'brightness(3.5)' },
  animate: {
    opacity: 1,
    scaleY: 1,
    scaleX: 1,
    filter: 'brightness(1)',
    transition: { duration: 0.34, ease: [0.2, 0.9, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    scaleX: 1.04,
    skewX: 8,
    x: '3%',
    filter: 'brightness(2.2)',
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

const calm: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export function GlitchTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className="absolute inset-0" variants={reduced ? calm : analog} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}
