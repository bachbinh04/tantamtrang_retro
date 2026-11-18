import { useEffect, useRef } from 'react';
import { useIsPresent } from 'framer-motion';
import { inputBus, type Handler } from '../systems/input';

/**
 * Register a page-level action handler. Latest mounted handler wins; return `true` to consume.
 * A page that is animating out (AnimatePresence exit) stops listening immediately,
 * so presses during a channel switch never reach the outgoing screen.
 */
export function useInput(handler: Handler, active = true) {
  const ref = useRef(handler);
  ref.current = handler;
  const isPresent = useIsPresent();
  const enabled = active && isPresent;
  useEffect(() => {
    if (!enabled) return;
    return inputBus.push((a) => ref.current(a));
  }, [enabled]);
}
