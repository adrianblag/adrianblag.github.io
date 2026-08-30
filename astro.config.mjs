// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Deployed as a GitHub *user* site at https://adrianblag.github.io
  // (repo: adrianblag/adrianblag.github.io). A user site is served from the
  // domain root, so there is deliberately no `base` here — adding one would
  // prefix every asset URL with a subpath that does not exist.
  site: 'https://adrianblag.github.io',

  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
