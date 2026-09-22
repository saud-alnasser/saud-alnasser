// What a profile's network decides: the icon its link carries, and whether
// it is the profile the documents carry as their QR code.
//
// The icon: a network the icon set has a mark for is shown by its mark;
// every other network falls back to the external link icon, so adding a
// profile to src/content/profile.yaml never leaves a link without an icon
// and never needs a template changed. The names are
// src/components/Icon.astro's. A network gains its own mark by adding the
// path there and a row here, and nothing else.

export type ProfileIcon = 'github' | 'linkedin' | 'external-link';

const marks: Record<string, ProfileIcon> = {
  github: 'github',
  linkedin: 'linkedin',
};

export function profileIcon(network: string): ProfileIcon {
  return marks[network.trim().toLowerCase()] ?? 'external-link';
}

// The profile the documents carry as their QR code: LinkedIn, by Saud's
// decision on 2026-09-22, when it took the place of GitHub. Decided here,
// once, because three things have to agree on which entry it is: the
// document component that draws the code, the dist check that decodes it
// back out of the rendered PDF, and the browser case that reads its name.
// Each asks this rather than spelling the network for itself, so a spelling
// one of them accepts and another does not cannot leave the check comparing
// against a profile the page never drew. `profileIcon` is what recognises
// the network, so the spellings it takes are the spellings this takes.
//
// Nothing, when the content lists no such profile. The component then draws
// no code and the check fails, which is the right pair: a document without
// its one profile is a document to notice, not a check to pass.
export function codedProfile<T extends { network: string }>(profiles: readonly T[]): T | undefined {
  return profiles.find((entry) => profileIcon(entry.network) === 'linkedin');
}
