// Every path the site publishes is joined to the base path here, and nowhere
// else. GitHub Pages serves this repository as a project site under the
// repository's name, so `base` in astro.config.mjs is "/saud-alnasser" and a
// path written as "/en/" would resolve outside the site. `withBase("/en/")`
// is "/saud-alnasser/en/"; with `base` set back to "/", which is all a custom
// domain would need, it is "/en/" again.
//
// `joinBase` is the pure join, for the scripts and the tests that run outside
// the build and read `base` from the config themselves.

export function joinBase(base: string, path: string): string {
  const prefix = base.replace(/\/+$/, '');
  return `${prefix}${path.startsWith('/') ? '' : '/'}${path}`;
}

// The repository the site is built from, which the footer links as its
// source. GitHub Pages serves a project site under the repository's name, so
// astro.config.mjs derives `base` from this address rather than writing the
// name a second time.
export const repository = 'https://github.com/saud-alnasser/saud-alnasser';

// A path on the site, under the base the build was given.
export function withBase(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

// The full address of a path on the site. `site` is Astro.site, which carries
// the origin and no base.
export function absolute(path: string, site: URL): string {
  return new URL(withBase(path), site).href;
}
