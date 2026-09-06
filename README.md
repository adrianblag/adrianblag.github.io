# Personal academic site

A static [Astro](https://astro.build) site with five sections — home,
publications, talks, writing (blog) and CV. Built from the approved design
mockup; all colour, type and spacing values live as CSS custom properties in
[`src/styles/global.css`](src/styles/global.css).

Everything currently on the site is **placeholder content**. The three files
you will actually edit are covered under [Configuration](#configuration).

---

## Running it locally

```bash
npm install
```

```bash
npm run dev
```

That serves the site at <http://localhost:4321> with hot reload. Two more:

```bash
npm run build
```

```bash
npm run preview
```

`build` writes a fully static site to `dist/`; `preview` serves that `dist/`
folder so you can check the production output before deploying.

Requires Node 18 or newer (Node 22 LTS or 24 is a good default).

---

## Where things live

```
src/
  config/
    site.ts          ← your name, bio, email, socials, CV PDF  ← EDIT THIS
    taxonomy.ts      ← the category options for the filter pills ← EDIT THIS
  data/
    cv.json          ← the CV timeline ← EDIT THIS
  content/
    publications/    ← one .md file per paper
    talks/           ← one .md file per talk
    posts/           ← one .md file per blog post (body = the post)
  content.config.ts  ← Zod schemas (validation only — rarely needs editing)
  pages/             ← the routes: /, /publications, /talks, /writing, /cv
  components/        ← header, footer, filter pills, shared row bits
  layouts/Base.astro ← <head>, fonts, view transitions, header + footer
  styles/global.css  ← every design token and every style rule
  lib/format.ts      ← date formatting, year grouping, small helpers
public/              ← static files served as-is: portrait, CV PDF, post images
```

---

## Configuration

### 1. `src/config/site.ts` — who you are

One object plus two small ones. Every value is marked `// TODO: replace`.

- `name`, `role`, `heroStatement`, `bio` — the homepage hero.
- `email`, `socials` — the underlined links in the hero and in the footer.
  Add or remove entries from `socials` freely; the layout adapts.
- `avatar` — set to `'/portrait.jpg'` after putting `portrait.jpg` in
  `public/`. While it is `null` you get the striped placeholder box.
- `cvPdf` — set to `'/cv.pdf'` after putting `cv.pdf` in `public/`. While it
  is `null` the **Download CV (PDF)** button is simply not rendered, so the
  page never links to a missing file.
- `footerAddress` — the small mono line in the footer; `null` hides it.
- `pageIntros` — the lead paragraph under each page title.
- `nav` — the header links and their order.

### 2. `src/config/taxonomy.ts` — the filter pills

Three plain string arrays: `publicationTypes`, `talkTypes`, `postCategories`.

These are deliberately **separate from the Zod schemas**. The schemas accept
any free-text string for `venueType`, talk `type` and post `category`, so
renaming or adding a category here can never fail a build.

The strings must match the values in your content frontmatter exactly,
including case. An `All` pill is added automatically. A category with no
matching content does not get a pill at all, so you will not end up with dead
buttons while the site is half-populated.

### 3. `src/data/cv.json` — the CV timeline

Plain JSON, in two parts:

- `sections` — sets the order and heading of each block, e.g.
  `{ "id": "employment", "label": "Appointments" }`. Empty sections are
  skipped automatically.
- `entries` — each entry's `section` must match one of those `id`s.

```json
{
  "section": "employment",
  "title": "Assistant Professor of Something",
  "organization": "Your University · Your Group",
  "start": "2023",
  "end": "present",
  "bullets": ["One line about the role.", "Another line."]
}
```

- `end: "present"` renders `2023 —` and a **filled** timeline dot (the marker
  for a current role). Every other entry gets a hollow dot.
- Omit `end` entirely for a single-year item — an award, a service role — and
  only the start year is shown.
- `organization` and `bullets` are both optional.

(The `_readme` key at the top of the file is ignored by the site; JSON has no
comments, so the notes live there.)

---

## Adding real content

Each collection is a folder of Markdown files. The filename becomes the
identifier — and for posts, the URL slug — so
`src/content/posts/on-reviewing.md` is served at `/writing/on-reviewing`.
Filenames are otherwise free; a `YYYY-` prefix keeps the folder sorted but is
not required and is not used for anything.

Delete the `sample-*` files once you have your own.

### A publication — `src/content/publications/whatever.md`

```markdown
---
title: "Legible uncertainty in dialogue agents"
authors:
  - { name: "Your Name", isYou: true }
  - { name: "A. Collaborator" }
venue: "Proceedings of ACL 2026"
venueType: "Conference"
year: 2026
date: 2026-07-14        # optional; only `year` is used for grouping
pdf: "/papers/acl2026.pdf"
doi: "10.18653/v1/2026.acl-long.1"
links:
  - { label: "Code", url: "https://github.com/you/repo" }
note: "Best paper honourable mention"   # optional
tags: ["dialogue"]      # optional, not displayed yet
featured: true          # optional — shows in the homepage "Selected work" panel
---
```

`isYou: true` renders that author's name in bold. `pdf` and `doi` become
`PDF` and `DOI` link tags automatically (a bare DOI is expanded to a
`doi.org` URL), followed by anything in `links`. The body of the file is
unused for publications — leave it empty.

### A talk — `src/content/talks/whatever.md`

```markdown
---
title: "The pragmatics of machine hedging"
event: "SIGDIAL 2026"
location: "Lisbon"
type: "Keynote"
date: 2026-05-18
abstract: "One or two sentences."   # optional
image: "/talks/sigdial.jpg"         # optional; placeholder box if absent
links:
  - { label: "Slides", url: "https://…" }
  - { label: "Video", url: "https://…" }
---
```

### A post — `src/content/posts/whatever.md`

```markdown
---
title: "On reviewing as a form of teaching"
date: 2026-07-21
description: "One or two sentences. Shown on the index and used as the page description."
category: "Research life"   # optional
image: "/posts/reviewing.jpg"   # optional, 16:9 reads best
draft: false                # optional
---

The Markdown body is the post. Headings, links, lists, blockquotes, tables and
fenced code blocks are all styled.
```

The newest post is featured large at the top of `/writing`; the rest become
compact rows. Reading time is computed from the body.

`draft: true` keeps a post visible in `npm run dev` but excludes it from
`npm run build` — from the index, the homepage panel and the generated route.

### Images, figures and PDFs in a post

Two routes, and they behave differently.

**Figures and plots — put the file next to the `.md` and use a relative path.**

```
src/content/posts/
  my-post.md
  figure-1.png        ← lives beside the post
```

```markdown
![What the figure shows](./figure-1.png)
```

Astro processes these at build time: the image is converted to WebP,
`width`/`height` are written into the tag (so the page does not jump as it
loads), `loading="lazy"` is added, and the filename is content-hashed for
cache-busting. A 800x450 PNG came out as
`/_astro/figure-1.bMfj6jzv_Z1QcQHh.webp`. This is the route to use for
anything you are rendering yourself — plots, diagrams, screenshots.

**PDFs and anything needing a stable URL — put it in `public/`.**

```
public/posts/poster-eupvsec-2025.pdf
```

```markdown
[Download the poster (PDF)](/posts/poster-eupvsec-2025.pdf)
```

Files under `public/` are copied to the site verbatim, keeping the exact URL
you wrote — which is what you want for a PDF you might cite or send to
someone. The trade-off is that images served this way get no optimisation at
all: no WebP, no dimensions, no lazy-loading. So use `public/` for
attachments and stable links, and relative paths for figures.

Either way the styling is already handled: `.prose img` in `global.css` gives
images room and a hairline border, and links inside a post pick up the
underline treatment.

### Coloured and highlighted text in a post

Markdown has no syntax for colour, but posts render raw HTML, so:

```markdown
I am talking about color <mark>green</mark>.
I am talking about color <span class="accent">green</span>.
```

`<mark>` gives a pale green highlight; `.accent` colours the text. Both pull
from the theme tokens, so they invert with the palette — the accent is a deep
green in light mode and a lighter sage in dark, and the highlight ground
flips the same way. Measured in dark mode: 6.6:1 for the highlight, 8.9:1 for
the accent text, both comfortably past WCAG AA.

Avoid `<span style="color: green">`. A hardcoded colour cannot follow the
theme, and that particular one measures 3.6:1 against the dark background —
below the 4.5:1 AA threshold for body text.

### Dates

Write dates as unquoted `YYYY-MM-DD`. They are parsed as UTC and formatted as
UTC, so a date never shifts by a day depending on where the site is built.

---

## How the pieces work

- **Filtering** is ~40 lines of vanilla DOM code in
  [`src/components/FilterPills.astro`](src/components/FilterPills.astro) — no
  client framework. Clicking a pill hides non-matching rows, hides year groups
  that become empty, keeps the `N items` counts in sync, and moves the
  trailing hairline to the last visible row.
- **Navigation** uses Astro's `ClientRouter` (View Transitions) for a fade
  between pages, while every page remains a real route with a real URL. The
  filter script re-initialises on each navigation via `astro:page-load`.
- **Motion** is a single fade-and-rise on page load (`.rv` / `.rv2`). All
  animation and transition is switched off under
  `prefers-reduced-motion: reduce`, including the view transitions.
- **Fonts** are Newsreader (display/body), Work Sans (UI/nav) and JetBrains
  Mono (meta/dates), loaded with plain Google Fonts `<link>` tags in
  `Base.astro`.
- **Theming** is one `light-dark()` pair per token in `global.css`, so there
  is no duplicated dark block to drift out of sync. `color-scheme` decides
  which half applies: the OS preference by default, or `data-theme` on
  `<html>` once someone uses the header toggle. That choice is remembered in
  `localStorage`, and until one is made the site keeps following the OS live.
  A small synchronous script in `<head>` stamps the attribute before first
  paint so the page never flashes the wrong theme, and re-stamps it on
  `astro:after-swap` because Astro's router copies `<html>` attributes from
  the incoming document. Code blocks ship both Shiki themes and switch with
  the rest of the palette; CV logos get a pale chip in dark mode, since
  several of them (USC, Cambridge) are dark on transparent and would
  otherwise disappear.
- **Responsive** down to 375px: multi-column rows stack, the hero type scales
  with `clamp()`, the nav wraps, and the CV date column moves above each
  entry while the timeline rule stays continuous.

---

## Deploying to GitHub Pages

Wired up and ready. The site deploys to **<https://adrianblag.github.io>** from
the repo `adrianblag/adrianblag.github.io`.

- [`astro.config.mjs`](astro.config.mjs) sets `site` to that URL. There is no
  `base`, because a user site is served from the domain root — adding one
  would prefix every asset URL with a subpath that does not exist.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and
  publishes on every push to `main` (and on manual dispatch). It runs
  `npm ci`, so `package-lock.json` must stay committed.

### First-time setup

1. Create the repo on GitHub named exactly **`adrianblag.github.io`**, empty —
   no README, no .gitignore, no licence.
2. Push this folder to it:

```bash
git remote add origin https://github.com/adrianblag/adrianblag.github.io.git
```

```bash
git push -u origin main
```

3. On GitHub: **Settings → Pages → Build and deployment → Source = GitHub
   Actions**. (Do this once; without it the workflow builds but never
   publishes.)

The first deploy takes a couple of minutes. After that, every push to `main`
republishes automatically — watch it under the repo's **Actions** tab.

### If you see a failed "pages build and deployment" run

That is GitHub's *legacy* Jekyll builder, not this project's workflow. GitHub
auto-enables branch-based Pages on the first push to a `<user>.github.io`
repo, and that builder runs Jekyll over the **source tree** — where it hits
the `---` fences at the top of every `.astro` file, reads them as YAML front
matter, and fails.

It never touches the real site. Once **Settings → Pages → Source** is set to
**GitHub Actions**, it stops running. If it ever fires again, that setting has
reverted.

`public/.nojekyll` is a separate, permanent safeguard: it ships inside the
published output so nothing downstream can strip the `_astro/` directory
(Jekyll drops underscore-prefixed folders, which would 404 every stylesheet
and script). Leave it in place.

### Moving to a custom domain later

Set `site` in `astro.config.mjs` to the new domain, add a `public/CNAME` file
containing just the domain, and point the DNS at GitHub Pages. Nothing else
changes.
