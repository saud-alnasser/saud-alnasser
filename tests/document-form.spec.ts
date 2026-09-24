import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { lowContrastPairs } from './contrast';
import { at, locales, storageKey } from './pages';
import { marker } from '../scripts/form-marker.mjs';
import { placeholder } from '../scripts/placeholder.mjs';
import { strings } from '../src/lib/i18n';

// The form a document page opens at the marked address instead of downloading,
// and the document it produces. Everywhere else the control downloads the
// published PDF, and both paths are tested here as a pair on purpose: a suite
// that only ever navigated to the marked address would pass against a build
// with no gate in it, and the unmarked click is the one every reader makes.
//
// The site publishes no email address and no phone number, so the form is the
// only path to a document that carries either, and it produces one in the
// reader's own browser: the values go into the two hidden slots the contact
// line already has, the page is printed, and the slots are emptied.
//
// The phone number comes from scripts/placeholder.mjs rather than being
// written out here: a Saudi mobile in the source is what scripts/identifiers.mjs
// exists to find, and this repository's history is scanned for one.
//
// window.print() is replaced before the page loads rather than left to run.
// A headless browser has no print dialog to complete, and what these tests are
// about is the state of the document at the moment printing is asked for,
// which is what a reader's print dialog would be handed. The page's title is
// part of that state: Chrome names a printed PDF after it, so the title the
// stub records is the name the file would have landed under.

const content = fileURLToPath(new URL('../src/content/', import.meta.url));
const profile = parseYaml(readFileSync(path.join(content, 'profile.yaml'), 'utf8')).profile;

const dialog = '[data-document-dialog]';
const control = '[data-document-download]';
const contact = '[data-cv-contact]';
const generate = '[data-document-generate]';
const close = '[data-document-close]';

const settled = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));

// Counts the print calls instead of making them, and lets a test fire the
// afterprint the browser would fire once a reader is done with the dialog.
// It records the page's title at each call as well, because that is what
// names the file and it is only observable while the call is happening: the
// page takes its own title back the moment print() returns.
//
// The count lands a task after the dialog's `open` attribute goes, because
// printing happens in the close handler and `close()` removes the attribute
// synchronously. Anything asserting on this counter polls for it.
async function stubPrint(page: Page) {
  await page.addInitScript(() => {
    (window as any).__prints = 0;
    (window as any).__printedAs = [];
    window.print = () => {
      (window as any).__prints += 1;
      (window as any).__printedAs.push(document.title);
    };
  });
}

const prints = (page: Page) => page.evaluate(() => (window as any).__prints as number);

const printedAs = (page: Page) => page.evaluate(() => (window as any).__printedAs as string[]);

// Every value assigned to the page's title, recorded at the assignment.
//
// A test asserting the title never moved cannot read it once the form is
// closed and call that proof, for the reason watchOpen gives: a title set and
// put back inside one task reads exactly like one that was never touched. A
// MutationObserver has that same blindness here, and it was tried first: it
// delivers one batch after the task that produced it, so the move and the
// restore arrive together and only the value that survived them is still
// readable.
//
// Installed before the page loads, the way window.print() is, because what
// these tests are about is what the page did at the moment it asked to print.
async function watchTitle(page: Page) {
  await page.addInitScript(() => {
    (window as any).__titles = [];
    const own = Object.getOwnPropertyDescriptor(Document.prototype, 'title')!;
    Object.defineProperty(document, 'title', {
      configurable: true,
      get: () => own.get!.call(document),
      set: (value) => {
        (window as any).__titles.push(value);
        own.set!.call(document, value);
      },
    });
  });
}

const titles = (page: Page) => page.evaluate(() => (window as any).__titles as string[]);

// Counts the times the dialog gained its `open` attribute, from the moment this
// is installed. A test asserting that nothing opened cannot read the attribute
// afterwards and call it proof: a dialog shown and dismissed in the same tick
// reads exactly like one that never opened.
//
// Which is also why this counts the records rather than reading the attribute
// when the callback runs. Records are delivered at the microtask checkpoint
// after the task that produced them, so by then the attribute is gone again and
// a watcher that re-read it would count nothing, which is the same blindness
// assertion it replaces had. `oldValue === null` is the transition from absent
// to present, and that is the thing being counted.
async function watchOpen(page: Page, selector: string) {
  await page.evaluate((which) => {
    const node = document.querySelector(which);
    (window as any).__opened = node && node.hasAttribute('open') ? 1 : 0;
    if (!node) return;
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.oldValue === null) (window as any).__opened += 1;
      }
    }).observe(node, { attributes: true, attributeFilter: ['open'], attributeOldValue: true });
  }, selector);
}

const opened = (page: Page) => page.evaluate(() => (window as any).__opened as number);

// The value written into one contact slot, and whether the slot is showing.
// The value is the item's first span; the second is the separator bar, which
// is part of the line rather than part of the value.
async function slot(page: Page, which: 'email' | 'phone') {
  const item = page.locator(`${contact} [data-contact-slot="${which}"]`);
  return { text: ((await item.locator('span').first().textContent()) ?? '').trim(), hidden: await item.isHidden() };
}

for (const locale of locales) {
  for (const variant of ['cv', 'resume'] as const) {
    const url = at(`/${locale}/${variant}/`);
    // The same page at the address the form opens at, which every case below
    // that wants the form navigates to by name. The marker is deliberately not
    // in `url` and not in the shared setup: the plain address is what a reader
    // of the site arrives at, and folding the marker into either would leave
    // nothing asserting what happens there.
    const marked = `${url}${marker}`;
    const t = strings[locale];

    test.describe(`the download form on ${url}`, () => {
      test.beforeEach(async ({ page }) => {
        await stubPrint(page);
        await watchTitle(page);
      });

      // What every reader but one gets, and it sits beside the marked case
      // below on purpose: the pair is only legible as a pair, and a suite
      // holding one of them would pass against a build with no gate in it.
      //
      // Nothing cancels the link, so the control downloads the published PDF
      // and the dialog never opens. Asserted by watching the attribute rather
      // than by reading it afterwards, because the criterion is that it never
      // gains `open`, and a dialog opened and closed again in the same tick
      // would read as closed to a later assertion.
      test('downloads the published document at the plain address, by pointer and by Enter, and opens nothing', async ({
        page,
      }) => {
        await page.goto(url);
        await settled(page);
        await watchOpen(page, dialog);

        const download = page.waitForEvent('download');
        await page.locator(control).click();
        expect((await download).url(), `what the control downloaded on ${url}`).toContain(
          `/${variant}.${locale}.pdf`,
        );

        // And by the key a link is activated with, which is the half of the
        // keyboard path that lives at this address. The other half, where Enter
        // opens the form, is in tests/resume.spec.ts at the marked address.
        const byKey = page.waitForEvent('download');
        await page.locator(control).focus();
        await page.keyboard.press('Enter');
        expect((await byKey).url(), `what Enter downloaded on ${url}`).toContain(`/${variant}.${locale}.pdf`);

        // One assertion rather than two: this one already covers a dialog that
        // is closed by the time it is read, which is all the attribute itself
        // could have told us.
        expect(await opened(page), `times the dialog gained open on ${url}`).toBe(0);
        expect(await prints(page), `window.print() on ${url}`).toBe(0);
      });

      test('opens instead of downloading, and fills the contact line with what was typed', async ({ page }) => {
        await page.goto(marked);
        await settled(page);
        await page.locator(control).click();
        await expect(page.locator(dialog)).toHaveAttribute('open', '');

        await page.locator('[data-document-field="email"]').fill('reader@example.com');
        await page.locator('[data-document-field="phone"]').fill(placeholder.phone);
        await page.locator(generate).click();

        await expect(page.locator(dialog)).not.toHaveAttribute('open');
        // Polled rather than read once. `dialog.close()` removes the attribute
        // above synchronously and queues the close event, so that assertion can
        // resolve a task before the handler that prints has run, and a one-shot
        // read then sees zero. It is the lighter of the two documents that loses
        // that race, which is why it showed up on the resume pages and on the
        // runner rather than here.
        await expect.poll(() => prints(page), { message: `window.print() on ${url}` }).toBe(1);

        // In the contact line, in order, at the position the email held
        // before this effort: the two slots come before the nationality.
        const items = await page.locator(`${contact} > li:not([hidden])`).allInnerTexts();
        const cleaned = items.map((item) => item.replace(/\|/g, '').trim());
        expect(cleaned.slice(0, 2)).toEqual(['reader@example.com', placeholder.phone]);
        expect(cleaned[2]).toBe(profile.nationality[locale] ?? profile.nationality.en);
      });

      test('carries the one value when only one is typed', async ({ page }) => {
        await page.goto(marked);
        await settled(page);
        await page.locator(control).click();
        await page.locator('[data-document-field="phone"]').fill(placeholder.phone);
        await page.locator(generate).click();

        expect(await slot(page, 'email')).toEqual({ text: '', hidden: true });
        expect((await slot(page, 'phone')).text).toContain(placeholder.phone);
        expect((await slot(page, 'phone')).hidden).toBe(false);
      });

      // Nothing about the marker is remembered: it lives in the address and
      // nowhere else, so the next visit without it is a visit without the
      // form, in the same browser on the same machine.
      test('leaves nothing behind that would open the form again', async ({ page }) => {
        await page.goto(marked);
        await settled(page);
        await page.locator(control).click();
        await expect(page.locator(dialog)).toHaveAttribute('open', '');
        await page.keyboard.press('Escape');

        await page.goto(url);
        await settled(page);
        const download = page.waitForEvent('download');
        await page.locator(control).click();
        expect((await download).url(), `what the control downloaded on ${url}`).toContain(
          `/${variant}.${locale}.pdf`,
        );
        await expect(page.locator(dialog), `the dialog on ${url} after a marked visit`).not.toHaveAttribute('open');

        const left = await page.evaluate(() => ({
          cookie: document.cookie,
          keys: [...Object.keys(localStorage), ...Object.keys(sessionStorage)],
        }));
        expect(left.cookie, `the cookies ${url} left`).toBe('');
        expect(
          left.keys.filter((key) => key !== storageKey),
          `what ${url} stored besides the theme`,
        ).toEqual([]);
      });

      // The latch, and the reason it is one. The skip link is the first
      // focusable element in the body and points at #content, so the reader
      // this form is for replaces the fragment before reaching the control. A
      // gate that re-read the address at the click would be off by then, and
      // silently, because the icon would simply download.
      test('still opens the form after the fragment has moved on', async ({ page }) => {
        await page.goto(marked);
        await settled(page);

        // Driven the way a reader drives it. history.replaceState fires no
        // hashchange, and a case written that way would read as a broken latch.
        await page.locator('a[href="#content"]').focus();
        await page.keyboard.press('Enter');
        expect(page.url(), `the address after the skip link on ${url}`).toContain('#content');
        await page.locator(control).click();
        await expect(page.locator(dialog), `the dialog after the skip link on ${url}`).toHaveAttribute('open', '');
        await page.keyboard.press('Escape');

        // And any other in-page target, set the way a fragment link sets it.
        await page.evaluate(() => {
          location.hash = '#somewhere-else';
        });
        await page.locator(control).click();
        await expect(page.locator(dialog), `the dialog after a second fragment on ${url}`).toHaveAttribute('open', '');
      });

      // The listener, which is the whole of what separates this design from
      // reading the address once when the script binds. A page loaded without
      // the marker becomes the marked page when the fragment is typed onto it,
      // with no reload, and that is the one thing the latch buys the reader who
      // already has the document open.
      test('opens the form when the marker is typed onto a page already loaded', async ({ page }) => {
        await page.goto(url);
        await settled(page);

        // Assigned rather than navigated to, which is what typing a fragment
        // onto the address of a loaded page does, and what fires hashchange.
        await page.evaluate((fragment) => {
          location.hash = fragment;
        }, marker);
        await page.locator(control).click();
        await expect(page.locator(dialog), `the dialog after ${marker} was typed onto ${url}`).toHaveAttribute(
          'open',
          '',
        );
      });

      test('issues no network request while the form is open or generating', async ({ page }) => {
        await page.goto(marked);
        await settled(page);

        // Everything from here on: opening the dialog, typing, generating.
        // The values are the reader's, and nothing may carry them anywhere.
        const requests: string[] = [];
        page.on('request', (request) => requests.push(request.url()));

        await page.locator(control).click();
        await page.locator('[data-document-field="email"]').fill('reader@example.com');
        await page.locator('[data-document-field="phone"]').fill(placeholder.phone);
        await page.locator(generate).click();
        await expect(page.locator(dialog)).not.toHaveAttribute('open');

        expect(requests, `requests made while generating on ${url}`).toEqual([]);
      });

      test('empties the slots again after printing, and again when dismissed', async ({ page }) => {
        await page.goto(marked);
        await settled(page);
        await page.locator(control).click();
        await page.locator('[data-document-field="email"]').fill('reader@example.com');
        await page.locator(generate).click();
        expect((await slot(page, 'email')).hidden).toBe(false);

        // The afterprint path: what the browser fires once the reader is done
        // with the print dialog, whether they printed or cancelled.
        await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
        expect(await slot(page, 'email')).toEqual({ text: '', hidden: true });

        // The close path: a dialog dismissed rather than generated from
        // leaves the document exactly as it was published.
        await page.locator(control).click();
        await page.locator('[data-document-field="email"]').fill('reader@example.com');
        await page.keyboard.press('Escape');
        await expect(page.locator(dialog)).not.toHaveAttribute('open');
        expect(await slot(page, 'email')).toEqual({ text: '', hidden: true });
      });

      test('shows the next reader nothing, even where afterprint never fires', async ({ page }) => {
        // The browser this is about: one that runs the print and never fires
        // afterprint, so the clear on the way out does not happen. Reopening
        // the form has to start empty anyway, or the next person at this tab
        // gets the last one's email and phone, on the document and in the
        // fields. `afterprint` is deliberately not dispatched here, which is
        // what makes this test about the clear on the way in.
        await page.goto(marked);
        await settled(page);
        await page.locator(control).click();
        await page.locator('[data-document-field="email"]').fill('first@example.com');
        await page.locator('[data-document-field="phone"]').fill(placeholder.phone);
        await page.locator(generate).click();
        expect((await slot(page, 'email')).text, 'the first reader generated').toBe('first@example.com');

        await page.locator(control).click();
        await expect(page.locator(dialog)).toHaveAttribute('open', '');
        expect(await slot(page, 'email'), 'the email slot on reopening').toEqual({ text: '', hidden: true });
        expect(await slot(page, 'phone'), 'the phone slot on reopening').toEqual({ text: '', hidden: true });
        await expect(page.locator('[data-document-field="email"]'), 'the email field on reopening').toHaveValue('');
        await expect(page.locator('[data-document-field="phone"]'), 'the phone field on reopening').toHaveValue('');
      });

      // The name the generated file lands under. Chrome names a printed PDF
      // after the page's title, so the title has to be the published
      // document's name at the moment printing is asked for and the page's own
      // again once it is over: in the tab, the history entry, and anything
      // bookmarked from it.
      test('prints under the name the published document has, and takes its own title back', async ({ page }) => {
        await page.goto(marked);
        await settled(page);
        const own = await page.title();

        await page.locator(control).click();
        await page.locator('[data-document-field="email"]').fill('reader@example.com');
        await page.locator(generate).click();
        await expect.poll(() => prints(page), { message: `window.print() on ${url}` }).toBe(1);

        // The basename of the control's own href without its extension, which
        // is the name the published download already has.
        expect(await printedAs(page), `the title while printing on ${url}`).toEqual([`${variant}.${locale}`]);

        // print() blocks until the reader is done with the dialog, so this is
        // the restore that normally runs, and it has happened by now.
        expect(await page.title(), `the title after printing on ${url}`).toBe(own);
        expect(await titles(page), `the titles ${url} took`).toEqual([`${variant}.${locale}`, own]);

        // And the other half of it, asserted on its own: a browser that left
        // the title behind gets it back from afterprint, which is the same
        // belt the contact line's clear wears and for the same reason.
        await page.evaluate(() => {
          document.title = 'left behind';
        });
        await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
        expect(await page.title(), `the title after afterprint on ${url}`).toBe(own);
      });

      // The path a test that only ever generates would never see. The title is
      // what a tab, a history entry, and a bookmark read, so a reader who opens
      // the form and changes their mind has to watch it stand completely still.
      test('never moves the title for a reader who dismisses the form', async ({ page }) => {
        await page.goto(marked);
        await settled(page);
        const own = await page.title();

        await page.locator(control).click();
        await expect(page.locator(dialog)).toHaveAttribute('open', '');
        await page.locator('[data-document-field="email"]').fill('reader@example.com');
        await page.keyboard.press('Escape');
        await expect(page.locator(dialog)).not.toHaveAttribute('open');

        expect(await prints(page), `window.print() on a dismissed form on ${url}`).toBe(0);
        expect(await titles(page), `the titles ${url} took while the form was dismissed`).toEqual([]);
        expect(await page.title(), `the title after a dismissal on ${url}`).toBe(own);
      });

      test('dismisses on Escape, on the close control, and on the backdrop, returning focus each time', async ({
        page,
      }) => {
        await page.goto(marked);
        await settled(page);

        for (const dismiss of ['escape', 'control', 'backdrop'] as const) {
          await page.locator(control).click();
          await expect(page.locator(dialog)).toHaveAttribute('open', '');
          if (dismiss === 'escape') await page.keyboard.press('Escape');
          if (dismiss === 'control') await page.locator(close).click();
          // The backdrop is the area outside the dialog's own box, and a
          // click there arrives with the dialog itself as its target.
          if (dismiss === 'backdrop') await page.mouse.click(5, 5);
          await expect(page.locator(dialog), `dismissed by the ${dismiss}`).not.toHaveAttribute('open');
          await expect(page.locator(control), `focus after the ${dismiss}`).toBeFocused();
          expect(await slot(page, 'email'), `the email slot after the ${dismiss}`).toEqual({ text: '', hidden: true });
        }
      });

      test('downloads the published document from the way out inside the form', async ({ page }) => {
        await page.goto(marked);
        await settled(page);
        await page.locator(control).click();
        const plain = page.locator(`${dialog} a[download]`);
        await expect(plain).toHaveAttribute('href', at(`/${variant}.${locale}.pdf`));

        const download = page.waitForEvent('download');
        await plain.click();
        expect((await download).url()).toContain(`/${variant}.${locale}.pdf`);
      });

      test('is completable by the keyboard alone, with both fields labelled', async ({ page }) => {
        await page.goto(marked);
        await settled(page);

        // Reached by tabbing rather than clicked, and opened with the key a
        // link is opened with.
        await page.locator(control).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator(dialog)).toHaveAttribute('open', '');

        await expect(page.locator('[data-document-field="email"]')).toHaveAccessibleName(t.cv.form.email);
        await expect(page.locator('[data-document-field="phone"]')).toHaveAccessibleName(t.cv.form.phone);
        await expect(page.locator(generate)).toHaveAccessibleName(t.cv.form.generate);
        await expect(page.locator(close)).toHaveAccessibleName(t.cv.form.close);

        await page.locator('[data-document-field="email"]').focus();
        await page.keyboard.type('reader@example.com');
        await page.keyboard.press('Tab');
        await page.keyboard.type(placeholder.phone);
        await page.locator(generate).focus();
        await page.keyboard.press('Enter');

        await expect(page.locator(dialog)).not.toHaveAttribute('open');
        expect((await slot(page, 'email')).text).toContain('reader@example.com');
        expect((await slot(page, 'phone')).text).toContain(placeholder.phone);
      });

      test('meets the contrast criterion with the form open', async ({ page, colorScheme }) => {
        await page.goto(marked);
        await settled(page);
        // No second settle: were motion allowed, opening the dialog would
        // cancel the page's entrance, and a cancelled animation rejects the
        // promise that waits on it.
        await page.locator(control).click();
        await expect(page.locator(dialog)).toHaveAttribute('open', '');

        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        expect(
          results.violations.map((violation) => `${violation.id}: ${violation.help}`),
          `${colorScheme} palette on ${url} with the form open`,
        ).toEqual([]);
        expect(await page.evaluate(lowContrastPairs), `${colorScheme} palette on ${url} with the form open`).toEqual([]);
      });
    });

    test.describe(`the download form on ${url} with reduced motion`, () => {
      test.use({ reducedMotion: 'reduce' });

      test('animates nothing when it opens', async ({ page }) => {
        await page.goto(marked);
        await page.locator(control).click();
        await expect(page.locator(dialog)).toHaveAttribute('open', '');
        const animations = await page.evaluate(() => document.getAnimations().length);
        expect(animations, `animations with the form open on ${url}`).toBe(0);
      });
    });

    test.describe(`${url} with JavaScript disabled`, () => {
      test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' });

      // Both addresses. The marker is what opens the form where script runs,
      // and it has to mean nothing at all where script does not: the one reader
      // who bookmarked it gets the published PDF like everybody else rather
      // than a page that does nothing.
      for (const [which, address] of [
        ['the plain address', url],
        ['the marked address', marked],
      ] as const) {
        test(`renders in full at ${which} and leaves the control the link to the published PDF`, async ({ page }) => {
          await page.goto(address);
          await expect(page.locator('article.cv')).toBeVisible();
          await expect(page.locator(contact)).toBeVisible();

          const found = await page.locator(control).evaluate((node) => ({
            tag: node.tagName.toLowerCase(),
            href: node.getAttribute('href'),
            download: node.hasAttribute('download'),
          }));
          expect(found).toEqual({ tag: 'a', href: at(`/${variant}.${locale}.pdf`), download: true });

          // The dialog is inert without script, and the document it would fill
          // is the published one: no address, no number, both slots hidden.
          await expect(page.locator(dialog)).not.toHaveAttribute('open');
          expect(await page.locator(contact).innerText()).not.toContain(profile.email);
          await expect(page.locator(`${contact} [data-contact-slot="email"]`)).toBeHidden();
          await expect(page.locator(`${contact} [data-contact-slot="phone"]`)).toBeHidden();
        });
      }
    });
  }
}
