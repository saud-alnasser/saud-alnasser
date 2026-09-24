// What the tests share: the routes the site publishes, under the base path
// the config gives it, the width of each route's content column, and the
// palette values they assert on, taken from src/styles/global.css so a
// failure names the colour that was expected.

import { base } from '../astro.config.mjs';
import { forwards as forwarded } from '../src/lib/forwards';
import { joinBase } from '../src/lib/paths';

export const locales = ['en', 'ar'] as const;
export const routes = ['/', '/cv/', '/resume/'] as const;

export type Locale = (typeof locales)[number];
export type Route = (typeof routes)[number];

// The width of `main` at 1440 pixels, in pixels, per route: the `column`
// each page passes to src/layouts/Base.astro, `grid` at max-w-5xl for the
// home page laying cards in columns and `document` at max-w-3xl for the two
// document pages.
export const columns: Record<Route, number> = {
  '/': 1024,
  '/cv/': 768,
  '/resume/': 768,
};

// A path on the site as the server publishes it, under the base path from
// astro.config.mjs: at("/en/") is "/saud-alnasser/en/".
export const at = (path: string) => joinBase(base, path);

// Every page of the site, as at("/en/"), at("/ar/cv/"), and so on.
export const pages = locales.flatMap((locale) => routes.map((route) => at(`/${locale}${route}`)));

// The same pages with what a test needs to know about each: its language,
// its route, and the width its column takes.
export const pageList = locales.flatMap((locale) =>
  routes.map((route) => ({ locale, route, path: at(`/${locale}${route}`), width: columns[route] })),
);

// The addresses that were pages and now only forward to a section of the
// home page (src/lib/forwards.ts), in both languages: not pages, so none of
// the suites above visits them; tests/forwards.spec.ts does.
export const forwards = locales.flatMap((locale) =>
  forwarded.map(({ route, section }) => ({ locale, path: at(`/${locale}${route}`), section })),
);

export const otherLocale = (locale: Locale): Locale => (locale === 'en' ? 'ar' : 'en');

// How far below the sticky header's bottom edge a heading sits: zero where
// it touches, negative where the header covers it.
export const belowHeader = (page: import('@playwright/test').Page, id: string) =>
  page.evaluate((id) => {
    const header = document.querySelector('body > header')!.getBoundingClientRect();
    return document.getElementById(id)!.getBoundingClientRect().top - header.bottom;
  }, id);

// The `--background` token of each palette, as a browser reports it.
export const background = {
  light: 'rgb(255, 255, 255)',
  dark: 'rgb(18, 22, 28)',
} as const;

// The key and the control the inline script in src/layouts/Base.astro uses,
// and the language menu it dismisses.
export const storageKey = 'theme';
export const control = '[data-theme-toggle]';
export const menu = '[data-language-menu]';
