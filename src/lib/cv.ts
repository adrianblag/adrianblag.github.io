/* The CV timeline from src/data/cv.json, typed, plus the small helpers the
   CV page and the homepage share. Nothing here needs editing for content. */
import cv from '../data/cv.json';

export type CvEntry = {
  section: string;
  title: string;
  organization?: string;
  /** Links the organization name — a verification link where one exists. */
  url?: string;
  /** One logo path under public/, or several for a joint award. */
  logo?: string | string[];
  start: string;
  end?: string;
  bullets?: string[];
};

export const cvEntries = cv.entries as CvEntry[];

/** Sections in the order declared in cv.json; empty ones are skipped. */
export const cvSections = cv.sections
  .map((s) => ({ ...s, items: cvEntries.filter((e) => e.section === s.id) }))
  .filter((s) => s.items.length > 0);

/** One section's entries in cv.json order, with its heading. */
export function cvSection(id: string) {
  const label = cv.sections.find((s) => s.id === id)?.label ?? id;
  return { label, items: cvEntries.filter((e) => e.section === id) };
}

export const isCurrentRole = (e: CvEntry) =>
  (e.end ?? '').toLowerCase() === 'present';

/** Normalise `logo` to a list, so one and many render through one path. */
export const logosOf = (e: CvEntry): string[] =>
  Array.isArray(e.logo) ? e.logo : e.logo ? [e.logo] : [];

/** "2023 —" for a current role, "2020 — 2024" for a span, else the year. */
export function dateLabel(e: CvEntry): string {
  if (isCurrentRole(e)) return `${e.start} —`;
  if (e.end && e.end !== e.start) return `${e.start} — ${e.end}`;
  return e.start;
}
