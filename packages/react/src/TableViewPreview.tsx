import type { CSSProperties } from "react";
import type { ResolvedColumn } from "./resolveColumns.js";
import type { TableDensity, TableViewId } from "./types.js";
import styles from "./TableViewPreview.module.css";

// Accent colors of the mock rows
const ACCENTS = [
  "var(--ts-accent-1)",
  "var(--ts-accent-2)",
  "var(--ts-accent-3)",
  "var(--ts-accent-4)",
];

interface TableViewPreviewProps<T> {
  view: TableViewId;
  density: TableDensity;
  columns: ResolvedColumn<T>[];
}

// Live miniature of a table look: built from the user's own visible columns
// (relative widths, pinned ones shaded) and density, so every card shows
// how *this* table would look.
export function TableViewPreview<T>({
  view,
  density,
  columns,
}: TableViewPreviewProps<T>) {
  const visible = columns.filter((c) => c.visible).slice(0, 5);
  const template = visible.map((c) => `${c.width}fr`).join(" ") || "1fr";
  const rows = density === "compact" ? 5 : 4;

  const row = (index: number, header = false) => (
    <div
      key={index}
      className={[styles.row, header && styles.header].filter(Boolean).join(" ")}
      style={
        {
          gridTemplateColumns: template,
          "--accent": ACCENTS[index % ACCENTS.length],
        } as CSSProperties
      }
    >
      {visible.map((column, i) => (
        <span
          key={column.key}
          className={[styles.cell, column.pinned && styles.pinned]
            .filter(Boolean)
            .join(" ")}
        >
          <span
            className={styles.bar}
            style={{ width: header ? "55%" : `${45 + ((index * 17 + i * 23) % 45)}%` }}
          />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={[styles.preview, styles[`view-${view}`], styles[density]].join(" ")}
      aria-hidden="true"
    >
      {row(-1, true)}
      {Array.from({ length: rows }, (_, i) => row(i))}
    </div>
  );
}
