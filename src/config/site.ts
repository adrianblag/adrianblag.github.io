/* =========================================================================
   SITE CONFIG
   This is the only file you need to touch to change your name, bio,
   contact details and social links across the whole site.
   ========================================================================= */

// The hero portrait. Images imported from src/ are resized and converted to
// WebP at build time; to change it, replace the file (or point this import
// at a new one).
import portrait from '../assets/portrait.jpg';

export const site = {
  /** Your name. Appears in the header, the page <title> and the footer. */
  name: 'Adrián Blanco Aguiar',

  /** Short role line under the hero. Keep it to one line. */
  role: 'Predoctoral Researcher · Computational Biology · CSIC',

  /** The one-line thesis statement in the hero. This is the biggest text
   *  on the site — one sentence, no more than ~120 characters reads best.
   *  Wrap a word in *asterisks* to set it in green italics. */
  heroStatement:
    'I study how to recover the *objective* a system is optimising from the *behaviour* it produces.',

  /** Two or three sentences under the hero statement. */
  bio:
    'I hold a predoctoral contract at the Spanish National Research Council (CSIC), in the Computational Biology group at the Misión Biolóxica de Galicia, where I work on the inverse optimal control problem and inverse reinforcement learning, bridging the theoretical and practical gaps between the two. Before that I built statistical models for accelerating photovoltaic system simulations at IECO Desarrollo Digital. Mathematics graduate from the Universidade de Santiago de Compostela, with a Master’s in Statistical Techniques (USC, UVigo, UDC).',

  /** Used for the mailto: links in the hero and footer. */
  email: 'blancoag02@gmail.com',

  /** Shown as underlined links next to your email in the hero.
   *  Add, remove or reorder freely — the layout adapts.
   *  TODO: add ORCID and Google Scholar here once you have them. */
  socials: [
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/adri%C3%A1n-blanco-aguiar-784b0331a',
    },
    { label: 'GitHub', url: 'https://github.com/adrianblag' },
  ],

  /** Portrait image, imported at the top of this file.
   *  Set to null to render the striped placeholder box instead. */
  avatar: portrait as ImageMetadata | null,

  /** Caption printed under the striped placeholder box. Only shown when
   *  `avatar` is null, so it is unused while a real portrait is set. */
  avatarCaption: null as string | null,

  /** Quote shown under the hero portrait, inside its frame.
   *  Set to null to render the portrait on its own. */
  quote: {
    text: 'To live life, you need problems. If you get everything you want the minute you want it, then what’s the point of livin’?',
    attribution: 'Jake the Dog',
  } as { text: string; attribution: string } | null,

  /** CV PDF. Put the file in `public/` and set this to e.g. '/cv.pdf'.
   *  While it is null the "Download CV (PDF)" button is not rendered.
   *  TODO: deliberately left off — the current CV carries a personal
   *  details block (date of birth, phone, home address) that should not
   *  be published. Point this at a trimmed version when you have one. */
  cvPdf: null as string | null,

  /** Small mono line on the left of the footer. Set to null to hide it. */
  footerAddress: 'MISIÓN BIOLÓXICA DE GALICIA (CSIC) · PONTEVEDRA, SPAIN' as
    | string
    | null,

  /** Fallback description used for SEO on pages that don't set their own. */
  description:
    'Adrián Blanco Aguiar — predoctoral researcher at CSIC working on inverse optimal control and inverse reinforcement learning.',
} as const;

/* ---------------------------------------------------------------
   SKILLS & TOOLS — the tag groups on the homepage.
   Add, remove or rename groups and items freely; each group becomes
   a column (they stack on phones).
   --------------------------------------------------------------- */
export const skills = [
  {
    label: 'Research',
    items: [
      'Inverse optimal control',
      'Inverse reinforcement learning',
      'Control theory',
      'Computational biology',
    ],
  },
  {
    label: 'Statistics & ML',
    items: [
      'Statistical modelling',
      'Machine learning',
      'Cluster analysis',
      'Photovoltaic system simulation',
    ],
  },
  {
    label: 'Programming',
    items: ['Python', 'pvlib', 'Parallel computing', 'Performance optimisation'],
  },
] as const;

/* ---------------------------------------------------------------
   NAVIGATION — the header links, in order. Each one jumps to its
   section on the homepage (the ids are set in src/pages/index.astro),
   from any page; your name in the header links back to the top.
   --------------------------------------------------------------- */
export const nav = [
  { label: 'CV', href: '/#experience' },
  { label: 'Publications', href: '/#publications' },
  { label: 'Talks & posters', href: '/#talks' },
  { label: 'Writing', href: '/#writing' },
] as const;
