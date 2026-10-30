import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* =========================================================================
   CONTENT COLLECTIONS

   Note on category fields: `venueType`, talk `type` and post `category` are
   plain strings on purpose — NOT Zod enums — so any label works. They are
   shown as written next to each entry on the homepage.
   ========================================================================= */

/** One author of a publication. Set `isYou: true` on your own name and it
 *  renders bold in the author list. */
const author = z.object({
  name: z.string(),
  isYou: z.boolean().optional().default(false),
});

/** A labelled external link, e.g. { label: 'Slides', url: 'https://…' } */
const link = z.object({
  label: z.string(),
  url: z.string(),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(author),
    venue: z.string(),
    /** free text, e.g. "Conference" / "Contributed" / "Notes" */
    venueType: z.string(),
    year: z.number(),
    /** optional exact date; only `year` is used for grouping */
    date: z.coerce.date().optional(),
    /** bare DOI ("10.1000/xyz") or a full URL — both work */
    doi: z.string().optional(),
    pdf: z.string().optional(),
    links: z.array(link).optional().default([]),
    /** e.g. "Best paper honourable mention" — appended after the venue */
    note: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    /** listed first in the homepage Publications section */
    featured: z.boolean().optional().default(false),
  }),
});

const talks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/talks' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      event: z.string(),
      location: z.string(),
      /** free text, e.g. "Conference" / "Contributed" / "Notes" */
      type: z.string(),
      date: z.coerce.date(),
      links: z.array(link).optional().default([]),
      abstract: z.string().optional(),
      /** an image next to this file, e.g. './sigdial.jpg'. Resized and
       *  converted to WebP at build time; a wrong path fails the build. */
      image: image().optional(),
      /** where the slides are, shown as a "Slides" button that opens in a
       *  new tab: a deck or PDF under public/slides/ (e.g.
       *  '/slides/sigdial-2026/index.html') or any URL */
      slides: z.string().optional(),
      tags: z.array(z.string()).optional().default([]),
    }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      description: z.string(),
      /** free text, e.g. "Conference" / "Contributed" / "Notes" */
      category: z.string().optional(),
      /** an image next to this file, e.g. './my-post.jpg' (16:9 reads best).
       *  Resized and converted to WebP at build time. */
      image: image().optional(),
      draft: z.boolean().optional().default(false),
    }),
});

export const collections = { publications, talks, posts };
