import { useState } from "react";
import {
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  MoonIcon,
  SunIcon,
} from "@primer/octicons-react";
import {
  Box,
  Button,
  Grid,
  Heading,
  MinimalFooter,
  SubdomainNavBar,
  Text,
} from "@primer/react-brand";
import entries from "../images.json";
import site from "../site.config.json";
import styles from "./styles.module.css";

type ThemeFilter = "all" | "light" | "dark";

type Entry = (typeof entries)[number];

const basePath = import.meta.env.BASE_URL;

const filters: { id: ThemeFilter; label: string; count: number }[] = [
  { id: "all", label: "All images", count: entries.length },
  { id: "light", label: "Light", count: entries.filter((entry) => entry.theme === "light").length },
  { id: "dark", label: "Dark", count: entries.filter((entry) => entry.theme === "dark").length },
];

const imageSizes = [...new Set(entries.map((entry) => `${entry.width} \u00d7 ${entry.height} px`))];

function shareUrl(entry: Entry) {
  return `${basePath}${entry.pagePath}`;
}

function imageUrl(entry: Entry) {
  return `${basePath}images/${entry.imageFile}`;
}

export default function App() {
  const [filter, setFilter] = useState<ThemeFilter>("all");

  const [copied, setCopied] = useState("");

  const [message, setMessage] = useState("");

  const [copyError, setCopyError] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const visibleEntries = entries.filter((entry) => filter === "all" || entry.theme === filter);

  async function copyLinks(id?: string) {
    const selected = id ? entries.filter((entry) => entry.id === id) : visibleEntries;

    try {
      if (!navigator.clipboard) throw new Error("Clipboard access is unavailable in this browser.");
      await navigator.clipboard.writeText(
        selected.map((entry) => new URL(shareUrl(entry), window.location.origin).href).join("\n"),
      );
      setCopied(id ?? "all");
      setCopyError(false);
      setMessage(id ? "Test-page link copied." : `${selected.length} test-page links copied.`);
    } catch {
      setCopied("");
      setCopyError(true);
      setMessage(
        "Couldn't copy the link. Open a test page and copy its URL from your address bar.",
      );
    }
  }

  return (
    <Box className={styles.page} backgroundColor="default">
      <SubdomainNavBar
        title="Image playground"
        titleHref={basePath}
        logoHref="https://github.com"
        fixed={false}
        fullWidth
        skipToContentTargetId="image-playground-main"
        onNarrowMenuToggle={setMenuOpen}
      >
        <SubdomainNavBar.Link href="#images">The images</SubdomainNavBar.Link>
        <SubdomainNavBar.Link href="#how-to-test">How to test</SubdomainNavBar.Link>
      </SubdomainNavBar>
      <main id="image-playground-main" inert={menuOpen}>
        <div className={styles.container}>
          <section className={styles.intro} aria-labelledby="gallery-title">
            <Heading as="h1" size="2" weight="medium" id="gallery-title" className={styles.title}>
              Social images,
              <br />
              in every light.
            </Heading>
            <div className={styles.introAside}>
              <Text as="p" size="300" variant="muted" className={styles.description}>
                Nine designs. Two colorways. Copy a test page's link to try its Open Graph preview.
              </Text>
              <Text as="p" size="100" variant="muted" className={styles.specification}>
                <span>{entries.length} public entry points</span>
                <span>{imageSizes.join(" / ")}</span>
                <span>PNG</span>
              </Text>
            </div>
          </section>
          <section id="images" aria-label="Social image gallery" className={styles.gallery}>
            <div className={styles.toolbar}>
              <div className={styles.filters} role="group" aria-label="Filter images by theme">
                {filters.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={styles.filter}
                    aria-pressed={filter === item.id}
                    onClick={() => {
                      setFilter(item.id);
                      setCopied("");
                      setMessage("");
                      setCopyError(false);
                    }}
                  >
                    {item.id === "light" ? <SunIcon size={16} /> : null}
                    {item.id === "dark" ? <MoonIcon size={16} /> : null}
                    {item.label}
                    <span className={styles.count}>{item.count}</span>
                  </button>
                ))}
              </div>
              <Button
                variant="subtle"
                size="small"
                leadingVisual={copied === "all" ? CheckIcon : CopyIcon}
                onClick={() => copyLinks()}
              >
                {copied === "all" ? "Links copied" : `Copy ${visibleEntries.length} links`}
              </Button>
            </div>
            <div className={styles.galleryStatus}>
              <Text size="100" variant="muted" aria-live="polite">
                {visibleEntries.length} images / {filter === "all" ? "Light + dark" : filter}
              </Text>
              <p
                className={copyError ? styles.copyError : styles.copyStatus}
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            </div>
            <Grid
              className={styles.imageGrid}
              columnGap="none"
              rowGap="none"
              enableGutters={false}
              fullWidth
            >
              {visibleEntries.map((entry, index) => (
                <Grid.Column
                  key={entry.id}
                  span={{ small: 12, medium: 12, large: 6 }}
                  className={styles.imageCell}
                >
                  <article className={styles.study} data-entry={entry.id}>
                    <a
                      className={styles.imageLink}
                      href={shareUrl(entry)}
                      aria-label={`Open ${entry.name}, ${entry.themeLabel} test page`}
                    >
                      <img
                        src={imageUrl(entry)}
                        alt={entry.alt}
                        width={entry.width}
                        height={entry.height}
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                      />
                      <span className={styles.imageAction}>
                        Open test page <ArrowUpRightIcon size={16} />
                      </span>
                    </a>
                    <div className={styles.cardDetails}>
                      <div>
                        <div className={styles.cardTitle}>
                          <Text size="100" variant="muted" className={styles.studyNumber}>
                            {entry.studyId}
                          </Text>
                          <Heading as="h2" size="5" weight="medium">
                            {entry.name}
                          </Heading>
                        </div>
                        <Text as="p" size="100" variant="muted" className={styles.cardMeta}>
                          {entry.theme === "light" ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                          {entry.themeLabel}
                          <span aria-hidden="true">/</span>
                          {Math.round(entry.bytes / 1024)} KB
                        </Text>
                      </div>
                      <div className={styles.cardActions}>
                        <a
                          className={styles.iconButton}
                          href={imageUrl(entry)}
                          download={entry.imageFile}
                          aria-label={`Download ${entry.name}, ${entry.themeLabel} PNG`}
                          title="Download PNG"
                        >
                          <DownloadIcon size={18} />
                        </a>
                        <button
                          className={styles.iconButton}
                          type="button"
                          onClick={() => copyLinks(entry.id)}
                          aria-label={`Copy link to ${entry.name}, ${entry.themeLabel}`}
                          title={copied === entry.id ? "Link copied" : "Copy test-page link"}
                        >
                          {copied === entry.id ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                        </button>
                      </div>
                    </div>
                  </article>
                </Grid.Column>
              ))}
            </Grid>
          </section>
          <section id="how-to-test" className={styles.instructions} aria-labelledby="test-heading">
            <div>
              <Heading as="h2" size="3" weight="medium" id="test-heading">
                Take it outside
                <br />
                the gallery.
              </Heading>
              <Text as="p" size="200" variant="muted" className={styles.instructionsIntro}>
                Every test page and image is public. No GitHub sign-in is needed to fetch the
                preview.
              </Text>
              <Text as="p" size="100" variant="muted" className={styles.instructionsIntro}>
                The original frames are 1200 &times; 630. These unchanged exports are 1024 &times;
                538.
              </Text>
            </div>
            <ol className={styles.steps}>
              <li>
                <Heading as="h3" size="6">
                  Pick an image
                </Heading>
                <Text as="p" size="200" variant="muted">
                  Open any entry point, or copy its link. Light and dark images have separate URLs.
                </Text>
              </li>
              <li>
                <Heading as="h3" size="6">
                  Share the page, not the PNG
                </Heading>
                <Text as="p" size="200" variant="muted">
                  Paste the test-page URL into a message, social post, or preview inspector. Its
                  Open Graph tags are in the HTML, with no JavaScript required.
                </Text>
              </li>
              <li>
                <Heading as="h3" size="6">
                  Compare the result
                </Heading>
                <Text as="p" size="200" variant="muted">
                  Check the crop, text, and contrast. Platforms can cache previews; use their
                  refresh or re-scrape controls when available.
                </Text>
              </li>
            </ol>
          </section>
        </div>
      </main>
      <div inert={menuOpen}>
        <MinimalFooter socialLinks={false}>
          <MinimalFooter.Link href="#images">Image gallery</MinimalFooter.Link>
          <MinimalFooter.Link href={site.repositoryUrl}>Source repository</MinimalFooter.Link>
          <MinimalFooter.Link href={`${basePath}third-party-licenses.txt`}>
            Dependency licenses
          </MinimalFooter.Link>
          <MinimalFooter.BackToTop>Back to top</MinimalFooter.BackToTop>
        </MinimalFooter>
      </div>
    </Box>
  );
}
