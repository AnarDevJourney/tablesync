import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { useMemo } from "react";
import { CopyButton } from "./CopyButton";
import styles from "./CodeBlock.module.css";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

export type CodeLanguage = "bash" | "css" | "json" | "typescript";

interface CodeBlockProps {
  code: string;
  language?: CodeLanguage;
  title?: string; // e.g. a file name
}

export function CodeBlock({ code, language = "typescript", title }: CodeBlockProps) {
  const html = useMemo(
    () => hljs.highlight(code.trim(), { language }).value,
    [code, language],
  );
  return (
    <div className={styles.block}>
      {title && <div className={styles.title}>{title}</div>}
      <CopyButton text={code.trim()} className={styles.copy} />
      <pre className={styles.pre}>
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
