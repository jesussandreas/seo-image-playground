import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

const entries = JSON.parse(await readFile(resolve(root, "images.json"), "utf8"));

const site = JSON.parse(await readFile(resolve(root, "site.config.json"), "utf8"));

const basePath = new URL(site.url).pathname;

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function meta(html, attribute, name) {
  const head = html.split("</head>")[0];

  const matches = [
    ...head.matchAll(new RegExp(`<meta ${attribute}="${name}" content="([^"]*)"`, "g")),
  ];

  assert.equal(matches.length, 1, `Expected one ${name} tag in the initial HTML.`);
  return decodeHtml(matches[0][1]);
}

function verifyMetadata(html, entry, pageUrl) {
  const imageUrl = new URL(`images/${entry.imageFile}`, site.url).href;

  assert.equal(meta(html, "property", "og:type"), "website");
  assert.equal(meta(html, "property", "og:url"), pageUrl);
  assert.equal(meta(html, "property", "og:image"), imageUrl);
  assert.equal(meta(html, "property", "og:image:secure_url"), imageUrl);
  assert.equal(meta(html, "property", "og:image:type"), "image/png");
  assert.equal(meta(html, "property", "og:image:width"), String(entry.width));
  assert.equal(meta(html, "property", "og:image:height"), String(entry.height));
  assert.equal(meta(html, "property", "og:image:alt"), entry.alt);
  assert.equal(meta(html, "name", "twitter:card"), "summary_large_image");
  assert.equal(meta(html, "name", "twitter:image"), imageUrl);
  assert.equal(meta(html, "name", "twitter:image:alt"), entry.alt);
  assert.ok(meta(html, "property", "og:title"));
  assert.equal(meta(html, "name", "twitter:title"), meta(html, "property", "og:title"));
  assert.equal(meta(html, "name", "twitter:description"), meta(html, "property", "og:description"));
  assert.equal(meta(html, "name", "description"), meta(html, "property", "og:description"));
  assert.ok(html.includes(`<link rel="canonical" href="${pageUrl}">`));
}

test("the public manifest contains exactly nine light/dark pairs and no source-only fields", () => {
  const fields = [
    "id",
    "studyId",
    "name",
    "theme",
    "themeLabel",
    "alt",
    "imageFile",
    "pagePath",
    "width",
    "height",
    "bytes",
    "sha256",
  ].sort();

  assert.equal(entries.length, 18);
  assert.equal(new Set(entries.map((entry) => entry.pagePath)).size, 18);
  for (let number = 1; number <= 9; number++) {
    for (const theme of ["light", "dark"]) {
      const entry = entries.find(
        (item) => item.id === `${theme}-${String(number).padStart(2, "0")}`,
      );

      assert.ok(entry);
      assert.deepEqual(Object.keys(entry).sort(), fields);
      assert.equal(entry.theme, theme);
      assert.equal(entry.imageFile, `${entry.id}.png`);
      assert.equal(entry.pagePath, `${theme}/${entry.studyId}/`);
      assert.ok(entry.alt.trim());
    }
  }
});

for (const entry of entries) {
  test(`${entry.id}: original PNG, public URLs, and static crawler-readable metadata`, async () => {
    const original = await readFile(resolve(root, "public/images", entry.imageFile));

    const deployed = await readFile(resolve(root, "dist/images", entry.imageFile));

    const html = await readFile(resolve(root, "dist", entry.pagePath, "index.html"), "utf8");

    assert.deepEqual(deployed, original, "The build must not modify the image.");
    assert.equal(createHash("sha256").update(deployed).digest("hex"), entry.sha256);
    assert.equal(deployed.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(deployed.readUInt32BE(16), entry.width);
    assert.equal(deployed.readUInt32BE(20), entry.height);
    assert.equal(deployed.length, entry.bytes);
    verifyMetadata(html, entry, new URL(entry.pagePath, site.url).href);
    assert.ok(meta(html, "property", "og:title").includes(`${entry.name} / ${entry.themeLabel}`));
    assert.ok(
      html.includes(`href="${basePath}"`),
      "The gallery link must retain the project subpath.",
    );
    assert.ok(html.includes(`src="../../images/${entry.imageFile}"`));
    assert.ok(html.includes(`download="${entry.imageFile}"`));
    assert.match(html, /<details><summary>View this page's Open Graph tags<\/summary>/);
    assert.doesNotMatch(html, /<script\b/i, "Share pages must not depend on JavaScript.");
    assert.doesNotMatch(html, /data:image|http-equiv="refresh"/i);
  });
}

test("the built gallery has initial HTML metadata and all 18 no-JavaScript links", async () => {
  const html = await readFile(resolve(root, "dist/index.html"), "utf8");

  const cover = entries.find((entry) => entry.id === site.galleryImageId);

  assert.ok(cover);
  verifyMetadata(html, cover, site.url);
  for (const entry of entries) {
    assert.ok(html.includes(`href="${basePath}${entry.pagePath}"`));
  }
  for (const match of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) {
    assert.ok(match[1].startsWith(basePath), "Built assets must retain the project subpath.");
    assert.ok((await readFile(resolve(root, "dist", match[1].slice(basePath.length)))).length);
  }
});

test("only the 18 expected image files are published", async () => {
  const files = await readdir(resolve(root, "dist/images"));

  assert.deepEqual(files.sort(), entries.map((entry) => entry.imageFile).sort());
});

test("the bundled font and production dependencies retain their license notices", async () => {
  const notices = await readFile(resolve(root, "dist/third-party-licenses.txt"), "utf8");

  assert.match(notices, /@primer\/react-brand/);
  assert.match(notices, /@primer\/octicons-react/);
  assert.match(notices, /react-dom/);
  assert.match(notices, /Permission is hereby granted/);
  assert.match(notices, /SIL OPEN FONT LICENSE/);
  assert.match(notices, /Reserved Font Name "Mona Sans"/);
});
