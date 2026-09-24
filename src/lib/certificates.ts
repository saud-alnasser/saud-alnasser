// A certificate's document as the page's dialog needs it, decided once for
// the two places that offer one: the certification card (Certificate.astro)
// and each course in the timeline's online-courses node (CourseList.astro).
//
// The documents and their previews are read once for the whole build rather
// than per entry: the PDFs as the addresses Vite gives the files under
// _astro/, the previews as image metadata, whose address is the committed
// file under _astro/ and whose width and height let the dialog reserve the
// image's box before it arrives. Both are keyed by the path the entry's
// `document` field names, relative to the certificates directory
// (src/content.config.ts). The preview is served as it was committed, 1600
// pixels wide and 19 to 116 KB (scripts/certificate-previews.mjs), which is
// wider than the dialog is on any viewport and so stays sharp on a dense
// screen; deriving a smaller copy through Astro's image pipeline made the
// build emit the original beside it, unreferenced. Nothing on the page loads
// the preview: the element carries its address and size, and the script in
// the base layout sets them on the dialog's <img> when it is opened.

const documents = import.meta.glob('../content/certificates/files/*.pdf', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const previews = import.meta.glob('../content/certificates/files/*.webp', {
  import: 'default',
  eager: true,
}) as Record<string, ImageMetadata>;

const key = (relative: string) => `../content/certificates/${relative}`;

// The data attributes the dialog script reads off the element it opens from,
// for the entry's document, or undefined where the entry names none. The
// caption is what the dialog says the image is, and what a screen reader
// hears in place of it.
export function documentAttributes(
  document: string | undefined,
  caption: string,
): Record<`data-${string}`, string> | undefined {
  if (!document) return undefined;
  const address = documents[key(document)];
  const preview = previews[key(document.replace(/\.pdf$/, '.webp'))];
  if (!address || !preview) return undefined;
  return {
    'data-document': address,
    'data-preview': preview.src,
    'data-preview-width': String(preview.width),
    'data-preview-height': String(preview.height),
    'data-caption': caption,
  };
}
