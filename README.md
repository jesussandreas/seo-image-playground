# SEO image playground

[Open the public gallery](https://jesussandreas.github.io/seo-image-playground/).

Nine designs, each in light and dark. All 18 test pages and PNGs are public, so
social crawlers can fetch them without signing in.

Copy a **test-page URL**, not an image URL, into a message, post, or preview
inspector. Every test page has its own canonical URL, Open Graph tags, Twitter
large-image tags, and downloadable PNG. Its metadata and image work without
JavaScript. The main gallery also includes a static list of all test links when
JavaScript is disabled.

The PNGs are unchanged 1024 by 538 exports of 1200 by 630 source frames. Their
dimensions and SHA-256 hashes are recorded in `images.json`. Descriptive labels
identify the artwork; they are not product announcements.

## Run locally

Use Node 24 or newer:

```sh
npm ci --ignore-scripts
npm run dev
```

Open the address printed by Vite with `/seo-image-playground/` appended.

```sh
npm run verify
npm run preview
```

Verification checks TypeScript, builds the standalone gallery and static pages,
and verifies every PNG and its metadata. GitHub Actions runs the same checks
before deploying `dist/` to GitHub Pages.

## Update an image

Replace its PNG in `public/images/`, update its dimensions, byte count, and
SHA-256 in `images.json`, then run `npm run verify`. The generator does not
redraw, crop, or resize images. The static pages, main-page metadata, and
fallback links are generated from this manifest.

If you change the host or repository name, update `site.config.json` before
building. Both the gallery's asset base and every absolute Open Graph URL use
that address. Stable test-page URLs may retain cached previews on social
platforms; use the platform's refresh or re-scrape controls after an update.

## Contents and attribution

This repository contains only the standalone image playground and its approved
image set. It has no analytics, sign-in flow, or conversation history.

The gallery uses the public Primer Brand React components and Mona Sans.
Dependency license notices are included in the deployed site. The GitHub artwork
and trademarks remain the property of their respective owners; this testing site
does not grant a new license to them or imply product or Brand approval.
