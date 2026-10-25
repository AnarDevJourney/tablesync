import { Select } from "antd";
import { useEffect, useRef, useState } from "react";
import readme from "../../../README.md?raw";
import { Markdown } from "../components/Markdown";
import styles from "./DocsPage.module.css";

// The README from "Why tablesync" on: the title, badges and table of
// contents are replaced by the page header and the sidebar
function docsSource(markdown: string): string {
  const start = markdown.indexOf("## Why tablesync");
  const body = start >= 0 ? markdown.slice(start) : markdown;
  return `# Documentation\n\n${body}`;
}

const SOURCE = docsSource(readme);

interface Heading {
  id: string;
  text: string;
}

export function DocsPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string>("");

  // Sidebar from the rendered h2s (their ids come from rehype-slug)
  useEffect(() => {
    const nodes = [...(contentRef.current?.querySelectorAll("h2[id]") ?? [])];
    setHeadings(nodes.map((n) => ({ id: n.id, text: n.textContent ?? "" })));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    nodes.forEach((n) => observer.observe(n));
    // a /docs#section link: this page loads lazily, so scroll once it is here
    if (location.hash) {
      document
        .getElementById(decodeURIComponent(location.hash.slice(1)))
        ?.scrollIntoView();
    }
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    history.replaceState(null, "", `#${id}`);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActive(id);
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar} aria-label="On this page">
        <div className={styles.sidebarTitle}>On this page</div>
        <nav className={styles.toc}>
          {headings.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              className={[styles.tocLink, active === h.id && styles.tocActive]
                .filter(Boolean)
                .join(" ")}
              onClick={(event) => {
                event.preventDefault();
                go(h.id);
              }}
            >
              {h.text}
            </a>
          ))}
        </nav>
      </aside>

      <div className={styles.content}>
        <div className={styles.mobileToc}>
          <Select
            className={styles.mobileSelect}
            placeholder="Jump to a section"
            value={active || undefined}
            onChange={go}
            options={headings.map((h) => ({ value: h.id, label: h.text }))}
            aria-label="Jump to a section"
          />
        </div>
        <div ref={contentRef}>
          <Markdown source={SOURCE} />
        </div>
      </div>
    </div>
  );
}
