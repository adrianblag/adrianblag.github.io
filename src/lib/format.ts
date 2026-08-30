/* Small shared helpers. Nothing here needs editing for normal content work. */

/** Dates in frontmatter are parsed as UTC midnight, so format in UTC too —
 *  otherwise a "2025-05-18" can render as 17 May in western timezones. */
const UTC = { timeZone: 'UTC' } as const;

/** 18 MAY 2026 */
export function stampDate(d: Date): string {
  return d
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...UTC,
    })
    .toUpperCase();
}

/** MAY 2026 */
export function stampMonth(d: Date): string {
  return d
    .toLocaleDateString('en-GB', { month: 'short', year: 'numeric', ...UTC })
    .toUpperCase();
}

export function year(d: Date): number {
  return d.getUTCFullYear();
}

/** Rough reading time from the raw Markdown body. */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Group items into year buckets, newest year first. */
export function groupByYear<T>(
  items: T[],
  getYear: (item: T) => number
): { year: number; items: T[] }[] {
  const buckets = new Map<number, T[]>();
  for (const item of items) {
    const y = getYear(item);
    const bucket = buckets.get(y);
    if (bucket) bucket.push(item);
    else buckets.set(y, [item]);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([y, list]) => ({ year: y, items: list }));
}

/** Accepts a bare DOI ("10.1000/xyz") or a full URL and returns a URL. */
export function doiUrl(doi: string): string {
  return /^https?:\/\//.test(doi) ? doi : `https://doi.org/${doi}`;
}

/** Base-path-aware internal link, so a GitHub Pages `base` in
 *  astro.config.mjs doesn't break every href. */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (path === '/') return base === '' ? '/' : `${base}/`;
  return `${base}${path}`;
}

/** True when `pathname` is (or is inside) `path`. Used for nav highlighting. */
export function isCurrent(pathname: string, path: string): boolean {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const here = pathname.replace(/\/+$/, '') || '/';
  const target = (base + (path === '/' ? '' : path)).replace(/\/+$/, '') || '/';
  if (target === (base || '/') || target === '') return here === (base || '/');
  return here === target || here.startsWith(`${target}/`);
}

/**
 * Which pills to render: the configured categories that are actually used by
 * content (in configured order), followed by any category used in content but
 * missing from the config. Keeps dead pills off the page.
 */
export function resolveCategories(
  configured: readonly string[],
  used: (string | undefined)[]
): string[] {
  const usedSet = new Set(used.filter((c): c is string => Boolean(c)));
  const ordered = configured.filter((c) => usedSet.has(c));
  const extras = [...usedSet]
    .filter((c) => !configured.includes(c))
    .sort((a, b) => a.localeCompare(b));
  return [...ordered, ...extras];
}
