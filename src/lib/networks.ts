// The icon a profile link carries. A network the icon set has a mark for is
// shown by its mark; every other network falls back to the external link
// icon, so adding a profile to src/content/profile.yaml never leaves a link
// without an icon and never needs a template changed.
//
// The names are src/components/Icon.astro's. A network gains its own mark by
// adding the path there and a row here, and nothing else.

export type ProfileIcon = 'github' | 'linkedin' | 'external-link';

const marks: Record<string, ProfileIcon> = {
  github: 'github',
  linkedin: 'linkedin',
};

export function profileIcon(network: string): ProfileIcon {
  return marks[network.trim().toLowerCase()] ?? 'external-link';
}
