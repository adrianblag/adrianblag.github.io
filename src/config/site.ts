/* =========================================================================
   SITE CONFIG
   This is the only file you need to touch to change your name, bio,
   contact details and social links across the whole site.
   ========================================================================= */

export const site = {
  /** Your name. Appears in the header, the page <title> and the footer. */
  name: 'Adrián Blanco Aguiar',

  /** Short role line under the hero. Keep it to one line. */
  role: 'Predoctoral Researcher · Computational Biology · CSIC',

  /** The one-line thesis statement in the hero. This is the biggest text
   *  on the site — one sentence, no more than ~120 characters reads best. */
  heroStatement:
    'I study how to recover the objective a system is optimising from the behaviour it produces.',

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

  /** Portrait image. Put the file in `public/` and point here.
   *  Set to null to render the striped placeholder box instead. */
  avatar: '/portrait.jpg' as string | null,

  /** Caption printed under the striped placeholder box. Only shown when
   *  `avatar` is null, so it is unused while a real portrait is set. */
  avatarCaption: null as string | null,

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
   SECTION INTROS — the lead paragraph under each page title.
   --------------------------------------------------------------- */
export const pageIntros = {
  publications:
    'Conference proceedings and papers. Ask me for a copy of anything that is not linked.',
  talks:
    'Talks and posters presented at national and international conferences.',
  writing:
    'Notes on research practice, side projects, and things I am reading. Less formal than the papers, on purpose.',
  cv: 'Positions, training, and the work that shaped the direction.',
} as const;

/* ---------------------------------------------------------------
   NAVIGATION — the header links, in order.
   --------------------------------------------------------------- */
export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Publications', href: '/publications' },
  { label: 'Talks & posters', href: '/talks' },
  { label: 'Writing', href: '/writing' },
  { label: 'CV', href: '/cv' },
] as const;
