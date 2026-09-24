// The addresses that were pages before the portfolio became one page, and
// the section of the home page each now sends a reader to, in the same
// language. Each still answers, as a page of its own holding only a meta
// refresh (src/components/Forward.astro), because GitHub Pages serves files
// and cannot redirect. A refresh cannot carry the anchor the old address was
// followed with, so every anchor on one lands on its one section.
//
// Read by the sitemap filter in astro.config.mjs, the dist check, and the
// tests, so a forward added or removed is added or removed everywhere; each
// route under src/pages/[locale]/ names its section itself, and the dist
// check holds it to this list. Like shown.ts, this file has no runtime
// import: the config and the scripts load it with Node stripping the types.

import type { Section } from './sections';

export const forwards = [
  { route: '/work/', section: 'experience' },
  { route: '/education/', section: 'education' },
] as const satisfies readonly { route: string; section: Section }[];

export type Forwarded = (typeof forwards)[number]['section'];
