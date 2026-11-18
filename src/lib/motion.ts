const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

export const prefersReducedMotion = () => !!query?.matches;

export const safeStorage = {
  get(kind: 'local' | 'session', key: string): string | null {
    try {
      return (kind === 'local' ? localStorage : sessionStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(kind: 'local' | 'session', key: string, value: string) {
    try {
      (kind === 'local' ? localStorage : sessionStorage).setItem(key, value);
    } catch {
      /* storage unavailable (private mode) — ignore */
    }
  },
};

export const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/**
 * Resolve a file in /public against the deploy base (e.g. /tantamtrang_retro/ on
 * GitHub Pages). Full URLs (https://…, data:…) are returned unchanged.
 */
export const asset = (path: string) => (/^(https?:|data:|blob:)/.test(path) ? path : import.meta.env.BASE_URL + path.replace(/^\//, ''));
