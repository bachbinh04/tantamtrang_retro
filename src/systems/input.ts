/**
 * Input bus — the controller, the keyboard and on-screen taps all speak the same
 * language of "actions". Pages push a handler on a stack; the top-most handler
 * gets first refusal and returns `true` when it consumed the action.
 */
export type Action =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirm' // ✕
  | 'back' // ○
  | 'triangle' // △
  | 'square' // □
  | 'start'
  | 'select'
  | 'l1'
  | 'r1'
  | 'l2'
  | 'r2';

export type Handler = (action: Action) => boolean | void;
type PressListener = (action: Action) => void;

const stack: Handler[] = [];
const pressListeners = new Set<PressListener>();
let fallback: Handler | null = null;
let lockHandler: Handler | null = null;

export const inputBus = {
  push(handler: Handler) {
    stack.push(handler);
    return () => {
      const i = stack.lastIndexOf(handler);
      if (i >= 0) stack.splice(i, 1);
    };
  },
  setFallback(handler: Handler | null) {
    fallback = handler;
  },
  /** While set (TV off / booting) every action goes here instead of the pages. */
  setLock(handler: Handler | null) {
    lockHandler = handler;
  },
  isLocked: () => lockHandler !== null,
  /** Visual / audio feedback listeners — they hear every press, consumed or not. */
  onPress(listener: PressListener) {
    pressListeners.add(listener);
    return () => {
      pressListeners.delete(listener);
    };
  },
  emit(action: Action) {
    pressListeners.forEach((l) => l(action));
    if (lockHandler) {
      lockHandler(action);
      return;
    }
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i](action) === true) return;
    }
    fallback?.(action);
  },
};
