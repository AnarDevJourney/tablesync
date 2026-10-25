import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Link } from "react-router-dom";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { REPO_BLOB } from "../site";
import { CopyButton } from "./CopyButton";
import styles from "./Markdown.module.css";

// Only the languages the docs use (the default set is ~40)
const highlight = {
  languages: { bash, css, json, typescript, xml },
  aliases: { json: ["jsonc"], typescript: ["ts", "tsx"], xml: ["html"] },
};

// The text of a code block, for the copy button
function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textOf(child.props.children)
          : "",
    )
    .join("");
}

const components: Components = {
  a({ href = "", children }) {
    if (href.startsWith("#")) return <a href={href}>{children}</a>;
    // links between the repo's files → GitHub (README.md is the docs page itself)
    if (href.startsWith("./") || href.startsWith("../")) {
      const path = href.replace(/^\.\//, "");
      if (path === "README.md") return <Link to="/docs">{children}</Link>;
      if (path === "CHANGELOG.md") return <Link to="/changelog">{children}</Link>;
      return (
        <a href={REPO_BLOB + path} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  },
  table({ children }) {
    return (
      <div className={styles.tableWrap}>
        <table>{children}</table>
      </div>
    );
  },
  pre({ children }) {
    return (
      <div className={styles.codeBlock}>
        <CopyButton text={textOf(children).replace(/\n$/, "")} className={styles.copy} />
        <pre>{children}</pre>
      </div>
    );
  },
};

export function Markdown({ source }: { source: string }) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, highlight]]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
