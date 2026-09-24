// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { forwards } from './src/lib/forwards.ts';
import { gapReport } from './src/lib/localized.ts';
import { joinBase, repository } from './src/lib/paths.ts';

// The site's address. The repository is saud-alnasser/saud-alnasser, which
// GitHub Pages serves as a project site under the repository's name, so the
// site lives at `site` + `base` and every path it publishes is joined to
// `base` (src/lib/paths.ts). The scripts and the tests import these two values
// rather than repeating them. A custom domain, if one is ever added, sets
// `base` to '/' and changes nothing else. The Pages source is set to GitHub
// Actions once, by hand, in the repository settings (docs/development.md,
// "Deployment").
export const site = 'https://saud-alnasser.github.io';
export const base = `/${new URL(repository).pathname.split('/').pop()}`;

// Prints the language gap report once the pages are built: every field whose
// Arabic was missing and rendered its English instead. The pages record the
// gaps as they render; this only reads them.
const localizedGaps = {
  name: 'localized',
  hooks: {
    'astro:build:done': () => {
      console.log(gapReport());
    },
  },
};

// The sitemap integration writes sitemap-index.xml and sitemap-0.xml. The spec
// names /sitemap.xml, so the page list is copied to that name once it exists;
// derived from the integration's own file, it can never disagree with it.
/** @type {import('astro').AstroIntegration} */
const sitemapAlias = {
  name: 'sitemap-alias',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const { copyFile } = await import('node:fs/promises');
      await copyFile(new URL('sitemap-0.xml', dir), new URL('sitemap.xml', dir));
      logger.info('`sitemap.xml` created at `dist`');
    },
  },
};

// The full address of every forward in both languages, as the sitemap
// integration names a page.
const forwarded = new Set(
  ['en', 'ar'].flatMap((locale) => forwards.map(({ route }) => `${site}${joinBase(base, `/${locale}${route}`)}`)),
);

// https://astro.build/config
export default defineConfig({
  site,
  base,
  output: 'static',

  // Every page lives under `/en/` or `/ar/`, so the two languages are symmetrical.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: {
      prefixDefaultLocale: true,
    },
  },

  // The root of the site is a static page carrying a meta refresh to the
  // default language, since there is no server to redirect. Astro's own i18n
  // redirect for the root only runs in server output, so it is declared here.
  // The source is read under the base and the target is written as given, so
  // the target is joined to the base.
  redirects: {
    '/': joinBase(base, '/en/'),
  },

  // The sitemap lists the pages and not the addresses that only forward to
  // one (src/lib/forwards.ts): those carry `noindex`, and a sitemap naming
  // them would ask a search engine to index what the page asks it not to.
  integrations: [sitemap({ filter: (page) => !forwarded.has(page) }), localizedGaps, sitemapAlias],

  vite: {
    plugins: [tailwindcss()],
  },
});
