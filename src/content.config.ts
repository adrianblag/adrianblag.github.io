import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* =========================================================================
   CONTENT COLLECTIONS

   Note on category fields: `venueType`, talk `type` and post `category` are
   plain strings on purpose — NOT Zod enums. The list of options shown as
   filter pills lives in `src/config/taxonomy.ts`, so you can rename or add
   categories there without touching validation here.
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
    /** free text — see src/config/taxonomy.ts */
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
    /** show in the "Selected work" panel on the homepage */
    featured: z.boolean().optional().default(false),
  }),
});

const talks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    event: z.string(),
    location: z.string(),
    /** free text — see src/config/taxonomy.ts */
    type: z.string(),
    date: z.coerce.date(),
    links: z.array(link).optional().default([]),
    abstract: z.string().optional(),
    /** path under `public/`, e.g. '/talks/sigdial.jpg' */
    image: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    /** free text — see src/config/taxonomy.ts */
    category: z.string().optional(),
    /** path under `public/`, e.g. '/posts/my-post.jpg' (16:9 reads best) */
    image: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { publications, talks, posts };
