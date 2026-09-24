---
use-when: "deciding how an old address forwards, and whether its anchor can survive the forward without a script"
---

# A meta refresh drops the fragment of the address it leaves

**Question.** When an old address such as `/en/work/#projects` forwards with a `<meta http-equiv="refresh">` and no script, does the fragment reach the new address?

**What was run.** On 2026-09-24, a throwaway Node server served three files: `a.html`, refreshing to `b.html`; `c.html`, refreshing to `b.html#x`; and `b.html`, holding a heading with the id `projects`. The installed Playwright Chromium opened each forwarding page with `#projects` on its address and printed where it ended. Firefox and WebKit are not installed here, so neither was tried.

**What it printed.**

```
chromium a.html#projects -> http://localhost:4599/b.html
chromium c.html#projects -> http://localhost:4599/b.html#x
```

**Finding.** Chromium does not carry the fragment across a meta refresh. A target with no fragment arrives with none. A target with its own fragment keeps its own and loses the old one. So a forwarding page with no script sends every old anchor on one address to the same place. That place is whatever fragment the refresh names.

**What it decided.** Requirement 8 of [[efforts/33-one-page-portfolio/spec]] asked for the old anchors to carry across without script, and on this evidence that cannot hold. Saud chose on 2026-09-24 to forward each old address to one section with no script, over adding a script to the forwarding pages. The spec was amended the same day.
