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

/** Rough reading time from the raw Markdown body. */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "1 talk", "3 talks": a count with the right form of its noun. */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** HTML for a config string where *asterisks* mark emphasis, e.g. the hero
 *  statement. Everything else is escaped, so the string stays plain text. */
export function emphasize(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
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
