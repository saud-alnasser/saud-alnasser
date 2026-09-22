// Renders the first page of every certificate document to a preview image
// beside it: src/content/certificates/files/<name>.pdf becomes
// files/<name>.webp, 1600 pixels wide, WebP at quality 80, and the same
// under src/content/education/files/, where a degree certificate lives.
// Run after adding or replacing a document, and commit the previews with it:
//
//   pnpm certificates:previews
//
// The previews are committed rather than built, so the site's build never
// depends on a PDF renderer and CI never runs this. The certificate dialog
// shows the preview with the PDF one click away, because a PDF in a frame
// does not render on Android Chrome and shows one unscrollable page on iOS.
// pdf.js's legacy Node build draws the page into a @napi-rs/canvas canvas,
// which it finds by itself, and sharp encodes the pixels. Each preview is a
// pure function of its PDF, so a second run writes the same bytes and leaves
// git clean. A document that does not open or does not render exits non-zero
// naming the file, so a broken PDF is found here rather than as a blank card.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The two collections whose entries may name a document, each with its own
// files/ directory beside its entries (src/content.config.ts).
const collections = ['certificates', 'education'];
const width = 1600;
const quality = 80;

// The fonts pdf.js substitutes for the fourteen standard ones a PDF may use
// without embedding, and the WebAssembly decoders it needs for a JBIG2 or
// CCITT fax image, which is how the degree certificate stores its QR code.
// It appends a file name to each and reads the result, and it insists on a
// forward slash at the end whatever the platform's separator, which Node's
// file system accepts on Windows as well. Without `wasmUrl` pdf.js warns that
// the image could not be decoded, draws the page without it, and resolves,
// so the preview would silently lack the code; `render` below turns that
// warning into the failure the header promises.
const pdfjs = path.dirname(require.resolve('pdfjs-dist/package.json')).split(path.sep).join('/');
const standardFontDataUrl = `${pdfjs}/standard_fonts/`;
const wasmUrl = `${pdfjs}/wasm/`;

class RenderFailure extends Error {
  constructor(reason, message) {
    super(message);
    this.reason = reason;
  }
}

// One PDF to one WebP. The page is scaled so its width is exactly the target
// and its height follows the page's own proportions; the canvas takes the
// rounded size, since a canvas has whole pixels.
async function render(files, name) {
  const source = path.join(files, name);
  const target = path.join(files, `${path.basename(name, '.pdf')}.webp`);

  const task = getDocument({ data: new Uint8Array(await readFile(source)), standardFontDataUrl, wasmUrl });
  try {
    let pdf;
    try {
      pdf = await task.promise;
    } catch (error) {
      throw new RenderFailure('document-not-opened', `${path.relative(root, source)}: ${error.message}`);
    }
    const page = await pdf.getPage(1);
    const scale = width / page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    // An image pdf.js cannot decode is a warning on the console and a page
    // rendered without it, never a rejection, so the warnings are collected
    // and a page missing an image fails like a page that did not render.
    const warnings = [];
    const warn = console.warn;
    console.warn = (...parts) => warnings.push(parts.join(' '));
    try {
      await page.render({ canvas, viewport }).promise;
    } catch (error) {
      throw new RenderFailure('page-not-rendered', `${path.relative(root, source)}: ${error.message}`);
    } finally {
      console.warn = warn;
    }
    const undecoded = warnings.filter((line) => /Unable to decode image|Dependent image isn't ready/.test(line));
    if (undecoded.length > 0) {
      throw new RenderFailure('image-not-decoded', `${path.relative(root, source)}: ${undecoded[0]}`);
    }
    const webp = await sharp(canvas.toBuffer('image/png')).webp({ quality }).toBuffer();
    await writeFile(target, webp);
    return `${path.relative(root, target)}: ${canvas.width} by ${canvas.height} pixels, ${webp.length} bytes`;
  } finally {
    await task.destroy();
  }
}

// Every PDF under each collection's files/ directory. Both directories must
// be readable, as the one always had to be, and no PDF under either is the
// failure it always was: a renamed folder is found here rather than as a
// site full of blank cards.
const documents = [];
for (const collection of collections) {
  const files = path.join(root, 'src', 'content', collection, 'files');
  let names;
  try {
    names = (await readdir(files)).filter((name) => name.endsWith('.pdf')).sort();
  } catch (error) {
    console.error(`certificate-previews: cannot read ${path.relative(root, files)}: ${error.message}`);
    process.exit(1);
  }
  documents.push(...names.map((name) => ({ files, name })));
}
if (documents.length === 0) {
  console.error(`certificate-previews: no PDF under src/content/{${collections.join(',')}}/files/`);
  process.exit(1);
}

try {
  for (const { files, name } of documents) {
    console.log(await render(files, name));
  }
  console.log(`certificate-previews: ${documents.length} previews written, ${width} pixels wide, WebP quality ${quality}`);
} catch (error) {
  if (error instanceof RenderFailure) {
    console.error(`certificate-previews: ${error.reason}: ${error.message}`);
  } else {
    console.error(`certificate-previews: unexpected: ${error.stack ?? error}`);
  }
  process.exit(1);
}
