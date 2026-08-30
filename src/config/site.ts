/* =========================================================================
   SITE CONFIG  —  everything here is PLACEHOLDER. Replace with your details.
   This is the only file you need to touch to change your name, bio,
   contact details and social links across the whole site.
   ========================================================================= */

export const site = {
  /** Your name. Appears in the header, the page <title> and the footer. */
  name: 'Your Name', // TODO: replace

  /** Short role line under the hero. Keep it to one line. */
  role: 'Your Role · Your Department · Your Institution', // TODO: replace

  /** The one-line thesis statement in the hero. This is the biggest text
   *  on the site — one sentence, no more than ~120 characters reads best. */
  heroStatement:
    'A one-line statement of what you study and why it matters.', // TODO: replace

  /** Two or three sentences under the hero statement. */
  bio:
    'A short paragraph about your research: the questions your group works on, the methods you use, and the problems you think are still open. Two or three sentences is plenty here — the CV and publication pages carry the detail.', // TODO: replace

  /** Used for the mailto: links in the hero and footer. */
  email: 'you@example.edu', // TODO: replace

  /** Shown as underlined links next to your email in the hero.
   *  Add, remove or reorder freely — the layout adapts. */
  socials: [
    { label: 'Google Scholar', url: 'https://scholar.google.com/' }, // TODO: replace
    { label: 'GitHub', url: 'https://github.com/' }, // TODO: replace
    { label: 'ORCID', url: 'https://orcid.org/' }, // TODO: replace
  ],

  /** Portrait image. Put the file in `public/` and point here, e.g.
   *  '/portrait.jpg'. Leave as null to render the striped placeholder box. */
  avatar: null as string | null,

  /** Caption printed under the portrait (or under the placeholder box).
   *  Set to null to hide it. */
  avatarCaption: 'portrait, 3:4' as string | null,

  /** CV PDF. Put the file in `public/` and set this to e.g. '/cv.pdf'.
   *  While it is null the "Download CV (PDF)" button is not rendered. */
  cvPdf: null as string | null,

  /** Small mono line on the left of the footer. Set to null to hide it. */
  footerAddress: 'YOUR INSTITUTION · YOUR BUILDING, YOUR STREET' as
    | string
    | null,

  /** Fallback description used for SEO on pages that don't set their own. */
  description:
    'Personal academic site: publications, talks, writing and CV.', // TODO: replace
} as const;

/* ---------------------------------------------------------------
   SECTION INTROS — the lead paragraph under each page title.
   --------------------------------------------------------------- */
export const pageIntros = {
  publications:
    'Peer-reviewed papers, preprints and dataset releases. Author copies are linked; ask me for anything that isn’t.', // TODO: replace
  talks:
    'Keynotes, invited talks and conference presentations. Slides are public; recordings where the host published them.', // TODO: replace
  writing:
    'Notes on research practice, side projects, and things I’m reading. Less formal than the papers, on purpose.', // TODO: replace
  cv: 'Positions, training, and the work that shaped the direction.', // TODO: replace
} as const;

/* ---------------------------------------------------------------
   NAVIGATION — the header links, in order.
   --------------------------------------------------------------- */
export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Publications', href: '/publications' },
  { label: 'Talks', href: '/talks' },
  { label: 'Writing', href: '/writing' },
  { label: 'CV', href: '/cv' },
] as const;
