---
title: "Sample draft — visible in dev, hidden in the build"
date: 2025-09-15
description: "This post has draft: true in its frontmatter, so it appears while you run npm run dev and disappears from npm run build. Delete it once you have seen how it behaves."
category: "Notes"
draft: true
---

Drafts are excluded from the production build (and from `/writing`, the
homepage panel and the generated routes) but stay visible in `npm run dev` so
you can preview them. Flip `draft` to `false`, or delete the field, to publish.
