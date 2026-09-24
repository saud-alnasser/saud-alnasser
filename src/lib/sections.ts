// The home page's five sections, in the order the page holds them, each by
// the id its heading carries, which is also its anchor. The header links to
// them in this order on every page; the dist check and the tests read the
// same list, so a section added, removed, or moved is changed here and in the
// page's markup, and every reader follows. Like forwards.ts, this file has no
// runtime import: the scripts load it with Node stripping the types.

export const sections = ['about', 'experience', 'projects', 'education', 'skills'] as const;

export type Section = (typeof sections)[number];
