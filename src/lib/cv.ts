/* The CV timeline from src/data/cv.json, typed, plus the small helpers the
   homepage uses to render it. Nothing here needs editing for content. */
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

const entries = cv.entries as CvEntry[];

/** One section's entries in cv.json order, with its heading. */
export function cvSection(id: string) {
  const label = cv.sections.find((s) => s.id === id)?.label ?? id;
  return { label, items: entries.filter((e) => e.section === id) };
}

export const isCurrentRole = (e: CvEntry) =>
  (e.end ?? '').toLowerCase() === 'present';

/** Normalise `logo` to a list, so one and many render through one path. */
export const logosOf = (e: CvEntry): string[] =>
  Array.isArray(e.logo) ? e.logo : e.logo ? [e.logo] : [];

/** "2023 — present", "2020 — 2024", or a single year. */
export function dateLabel(e: CvEntry): string {
  if (isCurrentRole(e)) return `${e.start} — present`;
  if (e.end && e.end !== e.start) return `${e.start} — ${e.end}`;
  return e.start;
}
