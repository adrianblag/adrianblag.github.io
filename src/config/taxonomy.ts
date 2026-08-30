/* =========================================================================
   TAXONOMY  —  the category options rendered as filter pills.

   These lists are deliberately kept OUT of the Zod schemas in
   `src/content.config.ts`: the schemas accept any free-text string, so
   adding, renaming or removing a category here never breaks validation
   and never fails a build.

   Rules of thumb:
   - The strings here must match the `venueType` / `type` / `category`
     values in your content files EXACTLY (case included) for a pill to
     match its items.
   - An "All" pill is added automatically — don't list it here.
   - A category listed here with no matching items simply renders a pill
     that filters down to nothing; a category used in content but missing
     here just won't get a pill. Neither is an error.
   ========================================================================= */

/** Matches the `venueType` field of `src/content/publications/*.md` */
export const publicationTypes = [
  'Conference',
  'Journal',
  'Workshop',
  'Preprint',
  'Thesis',
];

/** Matches the `type` field of `src/content/talks/*.md` */
export const talkTypes = [
  'Keynote',
  'Invited',
  'Panel',
  'Contributed',
  'Poster',
  'Tutorial',
];

/** Matches the `category` field of `src/content/posts/*.md` */
export const postCategories = [
  'Research life',
  'Projects',
  'Reading',
  'Notes',
];
