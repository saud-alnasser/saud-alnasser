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
// without embedding. It appends a file name to this and reads the result, and
// it insists on a forward slash at the end whatever the platform's separator,
// which Node's file system accepts on Windows as well.
const standardFontDataUrl = `${path.dirname(require.resolve('pdfjs-dist/package.json')).split(path.sep).join('/')}/standard_fonts/`;

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

  const task = getDocument({ data: new Uint8Array(await readFile(source)), standardFontDataUrl });
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
    try {
      await page.render({ canvas, viewport }).promise;
    } catch (error) {
      throw new RenderFailure('page-not-rendered', `${path.relative(root, source)}: ${error.message}`);
    }
    const webp = await sharp(canvas.toBuffer('image/png')).webp({ quality }).toBuffer();
    await writeFile(target, webp);
    return `${path.relative(root, target)}: ${canvas.width} by ${canvas.height} pixels, ${webp.length} bytes`;
  } finally {
    await task.destroy();
  }
}

// Every PDF under each collection's files/ directory. A collection with no
// documents at all is the failure it always was; a directory that is absent
// is read as empty, so a collection whose documents have all been removed
// does not need an empty folder kept for this script.
const documents = [];
for (const collection of collections) {
  const files = path.join(root, 'src', 'content', collection, 'files');
  let names;
  try {
    names = (await readdir(files)).filter((name) => name.endsWith('.pdf')).sort();
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`certificate-previews: cannot read ${path.relative(root, files)}: ${error.message}`);
      process.exit(1);
    }
    names = [];
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
