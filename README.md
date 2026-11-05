# Personal academic site

A static [Astro](https://astro.build) site: one page with the whole profile —
experience, education, skills, publications, talks and posters, writing — plus
a page for each blog post. Built from the approved design mockup; all colour,
type and spacing values live as CSS custom properties in
[`src/styles/global.css`](src/styles/global.css).

The files you will actually edit are covered under
[Configuration](#configuration); everything else comes from the Markdown files
under `src/content/`.

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
    site.ts          ← your name, bio, email, socials, skills, CV PDF ← EDIT THIS
  data/
    cv.json          ← the CV timeline ← EDIT THIS
  content/
    publications/    ← one .md file per paper
    talks/           ← one .md file per talk, plus its photo
    posts/           ← one .md file per blog post (body = the post), plus images
  assets/
    portrait.jpg     ← the hero portrait (imported in site.ts)
  content.config.ts  ← Zod schemas (validation only — rarely needs editing)
  pages/             ← the routes: / and /writing/<post>
  components/        ← header, footer, the homepage rows and toggles, the
                       contour figure, …
  layouts/Base.astro ← <head>, fonts, view transitions, scroll reveals
  styles/global.css  ← every design token and every style rule
  lib/
    format.ts        ← date formatting and other small helpers
    cv.ts            ← cv.json typed, for the homepage
    objective-map.ts ← draws the contour figure at build time
public/              ← static files served as-is: logos, favicons, slides, PDFs
astro.config.mjs     ← site URL, and redirects from the old page URLs
```

---

## Configuration

### 1. `src/config/site.ts` — who you are

The `site` object, plus two small lists, `skills` and `nav`.

- `name`, `role`, `heroStatement`, `bio` — the homepage hero. Wrap a word
  of `heroStatement` in `*asterisks*` to set it in green italics.
- `email`, `socials` — the **Get in touch** buttons and the underlined links
  in the hero, the closing contact section and the footer. Add or remove
  entries from `socials` freely; the layout adapts.
- `avatar` — the portrait, imported at the top of the file from
  `src/assets/portrait.jpg`. To change it, replace that file (or point the
  import at a new one). Images imported from `src/` are resized and
  converted to WebP at build time. Set it to `null` for the striped
  placeholder box.
- `cvPdf` — set to `'/cv.pdf'` after putting `cv.pdf` in `public/`. While it
  is `null` the **CV (PDF)** button in the Experience heading is simply not
  rendered, so the page never links to a missing file.
- `footerAddress` — the small mono line in the footer; `null` hides it.
- `skills` — the **Skills & tools** block on the homepage: a list of
  groups, each a label and its items. Each group becomes a column.
- `nav` — the header links and their order. Each jumps to its section of
  the homepage (`/#experience`, `/#publications`, `/#talks`, `/#writing`),
  from any page; your name in the header links back to the top.

### 2. `src/data/cv.json` — the CV timeline

Plain JSON, in two parts:

- `sections` — sets the order and heading of each block, e.g.
  `{ "id": "employment", "label": "Experience" }`. Empty sections are
  skipped automatically. The homepage uses the `employment`, `education`
  and `training` sections: every role with all its bullets (roles beyond
  the latest three fold under **Show N earlier roles**), every degree, and
  the training entries (the first shown, the rest under **Show N more**).
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
featured: true          # optional — listed first under Publications
---
```

`isYou: true` renders that author's name in bold. `pdf` and `doi` become
`PDF` and `DOI` link tags automatically (a bare DOI is expanded to a
`doi.org` URL), followed by anything in `links`. The body of the file is
unused for publications — leave it empty. The homepage shows two
publications (featured ones first, then the newest) and folds the rest under
**Show N more publications**.

### A talk — `src/content/talks/whatever.md`

```markdown
---
title: "The pragmatics of machine hedging"
event: "SIGDIAL 2026"
location: "Lisbon"
type: "Keynote"
date: 2026-05-18
abstract: "One or two sentences."   # optional
image: "./sigdial.jpg"              # optional; the photo, next to this file
slides: "/slides/sigdial-2026/index.html"  # optional; the "Slides" button
links:
  - { label: "Video", url: "https://…" }
---
```

**Slides.** Put the deck under `public/slides/` — an HTML presentation as a
folder with its `index.html` (`public/slides/sigdial-2026/`), or a PDF
(`public/slides/sigdial-2026.pdf`) — and point `slides:` at it. For a
folder, link the `index.html` itself: GitHub Pages would also serve the bare
folder URL, but `npm run dev` does not. The talk gets a **Slides** button that
opens it in a new tab, and its title links there too. `slides:` also takes
any URL. Files in `public/` are published exactly as they are, so strip
speaker notes and anything private first; `public/slides/phday-eio-2026/` is
an example of a cleaned reveal.js deck.

Name every deck the same way, so they look alike when opened:

- File or folder: `<event>-<year>`, lowercase, e.g. `eu-pvsec-2025.pdf`,
  `phday-eio-2026/`.
- Title shown in the browser tab: `<talk title, as on the first slide> ·
  <event> <year>`, in sentence case, e.g. "Accelerating photovoltaic system
  simulations via statistical data aggregation · EU PVSEC 2025". For an HTML
  deck it is the `<title>` in its `index.html`; for a PDF it is the document
  title (in Google Slides, the presentation's name when you download it).

Put the photo next to the talk's Markdown file and point `image:` at it with
`./`. It is resized and converted to WebP at build time, and a wrong path
fails the build with a clear message instead of shipping a broken image.
Without an image the talk gets the striped placeholder box. The homepage
shows the two most recent talks and folds older ones under **Show N older
presentations**.

### A post — `src/content/posts/whatever.md`

```markdown
---
title: "On reviewing as a form of teaching"
date: 2026-07-21
description: "One or two sentences. Shown on the homepage and used as the page description."
category: "Research life"   # optional
image: ./reviewing.jpg      # optional, next to this file; 16:9 reads best
draft: false                # optional
---

The Markdown body is the post. Headings, links, lists, blockquotes, tables and
fenced code blocks are all styled.
```

The newest post is featured in the homepage's Writing section; older posts
fold under **Show N older posts** as compact rows. Reading time is computed
from the body. The `image:` works like a talk's: the file sits next to the
post.

`draft: true` keeps a post visible in `npm run dev` but excludes it from
`npm run build` — from the homepage and from its own page.

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

### Previewing a post while you write

Two options, and they are good at different things.

**The real thing — Simple Browser inside VS Code.** Start the dev server
(`Ctrl+Shift+B`, or `npm.cmd run dev`), then `Ctrl+Shift+P` →
**Simple Browser: Show** → `http://localhost:4321/writing/your-post/`. Drag
that tab to a split so it sits beside the Markdown. It hot-reloads on save.

This is the accurate preview: real fonts, real dark mode, the post header
and hero image, the offset photo frame, your `<mark>` greens — because it is
the actual page, not a reconstruction.

**The quick one — the built-in Markdown preview** (`Ctrl+Shift+V`). Styled
by `.vscode/markdown-preview.css`, wired up in `.vscode/settings.json`. It
needs no dev server and updates on every keystroke, and it matches the real
post on type, measure, colour, headings, links, blockquotes, tables, code
and both green utilities, in light and dark.

What it cannot show, because it only renders the Markdown body:

- the post header — title, date, category, reading time
- the hero image, which comes from the `image:` frontmatter field
- the site header and footer, and the offset frame around the hero
- exact code-block token colours (VS Code highlights those itself, rather
  than with Shiki as the site does)

So: draft in the Markdown preview, check in Simple Browser before publishing.

The styling is scoped to this workspace, so Markdown in your other projects
is unaffected. Note that Markdown Preview Enhanced, if you use it instead,
is styled from `~/.mume/style.less`, which is global — it would restyle every
Markdown file you preview on the machine.

#### Installing the site fonts

Both previews fall back to Georgia / Segoe UI / Consolas unless the three
site fonts are installed locally. They are free; installing them for your
user account needs no administrator rights:

- <https://fonts.google.com/specimen/Newsreader>
- <https://fonts.google.com/specimen/Instrument+Sans>
- <https://fonts.google.com/specimen/JetBrains+Mono>

On each page choose **Get font → Download all**, unzip, then select the
`*-VariableFont*.ttf` files (the variable fonts cover every weight the site
uses, including Newsreader 300), right-click and choose **Install**.

### Dates

Write dates as unquoted `YYYY-MM-DD`. They are parsed as UTC and formatted as
UTC, so a date never shifts by a day depending on where the site is built.

---

## How the pieces work

- **The homepage** is the whole profile: experience, education, skills,
  publications, talks and posters, writing and a contact section. Each
  section heading says how many entries it holds; the newest few are shown
  and the rest fold under a toggle that names them (**Show 1 older
  presentation**), so a visitor never has to leave the page. How many each
  list shows is the `SHOW` constant at the top of `src/pages/index.astro`.
  The toggle is a native `<details>` (`MoreList.astro`): no script,
  keyboard- and screen-reader-friendly, and images inside load only once it
  opens. Printing the homepage opens every toggle first, so it prints the
  full profile.
- **Old URLs** (`/cv`, `/publications`, `/talks`, `/writing`, from when these
  were separate pages) are `redirects` in `astro.config.mjs` to the matching
  homepage section, so links already shared keep working.
- **The contour figure** in the hero is computed at build time by
  `src/lib/objective-map.ts` and rendered as plain SVG by
  `ObjectiveMap.astro`: a landscape of Gaussian hills, its contour lines,
  and four gradient-ascent paths that climb to the optimum, J*. Edit the
  `HILLS` and `STARTS` constants there to reshape it.
- **Navigation** uses Astro's `ClientRouter` (View Transitions) for a fade
  between the homepage and the post pages, while every page remains a real
  route with a real URL. The reveal script re-initialises on each
  navigation via `astro:page-load`.
- **Motion**: one signature moment, the contour figure drawing itself on
  the homepage, then a calm fade-and-rise on every page (`.rv`) and
  homepage sections that fade up once as they first come into view
  (`.reveal`, ~30 lines of IntersectionObserver in `Base.astro`). It is
  built to keep scrolling smooth: animations fill `backwards` only, so
  nothing stays animating (or held on its own GPU layer) once it has
  played; nothing is tied to the scroll position; hovers move things with
  transforms rather than padding; and the sticky header is solid rather
  than a backdrop blur. All of it is switched off under
  `prefers-reduced-motion: reduce`, including the view transitions.
- **Images** (the portrait, talk photos, post images) live under `src/` and
  go through `astro:assets`: each is resized to the sizes it is shown at and
  converted to WebP, and the browser picks the right one. Logos are tiny
  and stay in `public/`.
- **Fonts** are Newsreader (display/body), Instrument Sans (UI/nav) and
  JetBrains Mono (meta/dates), loaded with plain Google Fonts `<link>` tags
  in `Base.astro`.
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
  with `clamp()`, the header links drop to a row of their own below 960px,
  the contour figure moves under the hero text, and Experience and Education
  stack into one column.

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
