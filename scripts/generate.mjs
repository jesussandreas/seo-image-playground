import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

const require = createRequire(import.meta.url);

const site = JSON.parse(await readFile(resolve(root, "site.config.json"), "utf8"));

const entries = JSON.parse(await readFile(resolve(root, "images.json"), "utf8"));

const siteUrl = new URL(site.url);

assert.equal(siteUrl.protocol, "https:", "The published site must use HTTPS.");
assert.ok(site.url.endsWith("/"), "The site URL must end with a slash.");
assert.equal(siteUrl.search + siteUrl.hash + siteUrl.username + siteUrl.password, "");

const brandRoot = dirname(require.resolve("@primer/react-brand/package.json"));

const colors = JSON.parse(
  await readFile(resolve(brandRoot, "lib/design-tokens/json/colors.json"), "utf8"),
);

const entryFields = [
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}

function color(family, step) {
  const value = colors[`--base-color-scale-${family}-${step}`];

  if (!value) throw new Error(`Unknown Primer color: ${family}-${step}`);
  return value;
}

function palette(theme) {
  const dark = theme === "dark";

  return {
    background: dark ? color("gray", 9) : color("white", 0),
    foreground: dark ? color("white", 0) : color("gray", 9),
    muted: dark ? color("gray", 3) : color("gray", 7),
    accent: color("green", dark ? 3 : 5),
  };
}

function metadata({ entry, title, description, pagePath }) {
  const imageUrl = new URL(`images/${entry.imageFile}`, siteUrl).href;

  return [
    ["property", "og:type", "website"],
    ["property", "og:site_name", "SEO image playground"],
    ["property", "og:url", new URL(pagePath, siteUrl).href],
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:image", imageUrl],
    ["property", "og:image:secure_url", imageUrl],
    ["property", "og:image:type", "image/png"],
    ["property", "og:image:width", entry.width],
    ["property", "og:image:height", entry.height],
    ["property", "og:image:alt", entry.alt],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
    ["name", "twitter:image", imageUrl],
    ["name", "twitter:image:alt", entry.alt],
  ]
    .map(
      ([attribute, name, content]) =>
        `<meta ${attribute}="${name}" content="${escapeHtml(content)}">`,
    )
    .join("\n");
}

function shareDocument(entry) {
  const p = palette(entry.theme);

  const title = `${entry.name} / ${entry.themeLabel} | SEO image playground`;

  const description = `${entry.name} in ${entry.theme}. A ${entry.width} by ${entry.height} Open Graph test image.`;

  const tags = metadata({ entry, title, description, pagePath: entry.pagePath });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="${entry.theme}">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(new URL(entry.pagePath, siteUrl).href)}">
<link rel="icon" type="image/png" href="../../images/${entry.imageFile}">
${tags}
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: ${p.background}; color: ${p.foreground}; font-family: system-ui, sans-serif; line-height: 1.6; }
  main { max-width: 1080px; margin: auto; padding: 32px 24px 64px; }
  a { color: inherit; text-underline-offset: 4px; }
  a:hover { text-decoration-thickness: 2px; }
  a:focus-visible, summary:focus-visible { outline: 3px solid ${p.accent}; outline-offset: 5px; }
  .back { display: inline-block; padding-block: 12px; }
  h1 { font-size: clamp(28px, 5vw, 44px); font-weight: 600; letter-spacing: -.03em; margin: 24px 0 8px; line-height: 1.2; }
  .description { max-width: 66ch; color: ${p.muted}; margin: 0 0 28px; }
  img { display: block; width: 100%; max-width: ${entry.width}px; height: auto; }
  .caption { display: flex; flex-wrap: wrap; gap: 12px 24px; justify-content: space-between; margin-block: 16px 32px; }
  .caption a { padding-block: 8px; }
  details { border-top: 1px solid ${p.muted}; padding-top: 20px; }
  summary { cursor: pointer; padding: 8px 0; }
  pre { font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; }
  .note { max-width: 70ch; color: ${p.muted}; }
</style>
</head>
<body>
<main>
  <a class="back" href="${escapeHtml(siteUrl.pathname)}">Back to the image gallery</a>
  <h1>${escapeHtml(entry.name)} / ${entry.themeLabel}</h1>
  <p class="description">${escapeHtml(description)}</p>
  <img src="../../images/${entry.imageFile}" width="${entry.width}" height="${entry.height}" alt="${escapeHtml(entry.alt)}">
  <div class="caption"><span>${entry.width} &times; ${entry.height} &middot; PNG &middot; ${entry.themeLabel}</span><a href="../../images/${entry.imageFile}" download="${entry.imageFile}">Download PNG</a></div>
  <details><summary>View this page's Open Graph tags</summary><pre>${escapeHtml(tags)}</pre></details>
  <p class="note">This page and its original PNG are public and work without JavaScript. Share this page's URL to test its preview. Different platforms may crop images or cache earlier previews; use their refresh or re-scrape controls when available.</p>
</main>
</body>
</html>
`;
}

function galleryDocument(entry) {
  const title = "SEO image playground | 18 Open Graph image tests";

  const description =
    "Nine designs in light and dark. Explore 18 public Open Graph image test pages.";

  const links = entries
    .map(
      (item) =>
        `<li><a href="${escapeHtml(`${siteUrl.pathname}${item.pagePath}`)}">${escapeHtml(item.name)} / ${item.themeLabel}</a></li>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${escapeHtml(site.url)}">
<link rel="icon" type="image/png" href="${escapeHtml(`${siteUrl.pathname}images/${entry.imageFile}`)}">
${metadata({ entry, title, description, pagePath: "" })}
</head>
<body>
<div id="root">
  <main class="static-gallery">
    <h1>Social images, in every light.</h1>
    <p>Nine designs. Two colorways. Open a test page and share its URL to see its social preview.</p>
    <ul>${links}</ul>
  </main>
</div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;
}

async function dependencyNotices() {
  const lock = JSON.parse(await readFile(resolve(root, "package-lock.json"), "utf8"));

  const notices = [
    "Third-party notices for the SEO image playground",
    "These licenses cover the dependencies and font, not the gallery artwork.",
  ];

  for (const [folder, info] of Object.entries(lock.packages)) {
    if (!folder || info.dev) continue;
    assert.ok(
      folder.startsWith("node_modules/"),
      "Dependencies must come from the public package install.",
    );

    const packageRoot = resolve(root, folder);

    const manifest = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));

    const licenseFiles = (await readdir(packageRoot)).filter((name) =>
      /^(licen[cs]e|notice)($|\.)/i.test(name),
    );

    const licensePaths = licenseFiles.map((file) => resolve(packageRoot, file));

    // The Brand npm archive omits its MIT notice, so retain the upstream copy.
    if (manifest.name === "@primer/react-brand" && licensePaths.length === 0) {
      licensePaths.push(resolve(root, "public/licenses/primer-react-brand.txt"));
    }
    assert.ok(licensePaths.length, `${manifest.name} is missing its redistribution notice.`);
    notices.push(`\n${manifest.name} ${manifest.version} (${manifest.license})\n${"=".repeat(60)}`);
    for (const file of licensePaths.sort()) {
      notices.push(await readFile(file, "utf8"));
    }
  }

  notices.push("\nMona Sans font\n" + "=".repeat(60));
  notices.push(await readFile(resolve(root, "public/licenses/mona-sans.txt"), "utf8"));
  return notices.join("\n\n") + "\n";
}

assert.equal(entries.length, 18, "This playground requires nine light/dark pairs.");
assert.equal(new Set(entries.map((entry) => entry.id)).size, 18, "Entry IDs must be unique.");

for (const entry of entries) {
  assert.deepEqual(
    Object.keys(entry).sort(),
    entryFields,
    `Unexpected manifest fields for ${entry.id}.`,
  );
  assert.match(entry.id, /^(light|dark)-0[1-9]$/);
  assert.ok(["light", "dark"].includes(entry.theme));
  assert.equal(entry.id, `${entry.theme}-${entry.studyId}`);
  assert.equal(entry.themeLabel, entry.theme === "light" ? "Light" : "Dark");
  assert.equal(entry.imageFile, `${entry.id}.png`);
  assert.equal(entry.pagePath, `${entry.theme}/${entry.studyId}/`);
  assert.ok(typeof entry.name === "string" && entry.name.trim());
  assert.ok(typeof entry.alt === "string" && entry.alt.trim());

  const image = await readFile(resolve(root, "public/images", entry.imageFile));

  assert.equal(
    image.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
    `${entry.imageFile} must be a PNG.`,
  );
  assert.equal(image.subarray(12, 16).toString("ascii"), "IHDR");
  assert.equal(image.readUInt32BE(16), entry.width);
  assert.equal(image.readUInt32BE(20), entry.height);
  assert.ok(entry.width > 0 && entry.height > 0);
  assert.equal(image.length, entry.bytes);
  assert.equal(
    createHash("sha256").update(image).digest("hex"),
    entry.sha256,
    `${entry.imageFile} has changed.`,
  );

  const destination = resolve(root, "public", entry.pagePath);

  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, "index.html"), shareDocument(entry));
}

const cover = entries.find((entry) => entry.id === site.galleryImageId);

assert.ok(cover, "The gallery cover must be one of the recorded images.");
await writeFile(resolve(root, "index.html"), galleryDocument(cover));
await writeFile(resolve(root, "public/third-party-licenses.txt"), await dependencyNotices());
process.stdout.write(
  "Generated the public gallery, 18 static test pages, and dependency notices.\n",
);
