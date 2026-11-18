/**
 * Scroll `el` into view inside `container` only. (Element.scrollIntoView would also
 * scroll the overflow:hidden CRT ancestors and shove the whole picture around.)
 */
export function revealInContainer(container: HTMLElement | null, el: HTMLElement | null | undefined, margin = 6) {
  if (!container || !el) return;
  const c = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (r.top < c.top + margin) container.scrollTop -= c.top + margin - r.top;
  else if (r.bottom > c.bottom - margin) container.scrollTop += r.bottom - (c.bottom - margin);
}

/** Smoothly scroll a container by a fraction of its height (D-pad scrolling). */
export function scrollByPage(container: HTMLElement | null, dir: 1 | -1, fraction = 0.4) {
  if (!container) return false;
  const before = container.scrollTop;
  container.scrollBy({ top: dir * container.clientHeight * fraction, behavior: 'smooth' });
  return before !== container.scrollTop || container.scrollHeight > container.clientHeight;
}
