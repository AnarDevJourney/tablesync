import type { TableViewId } from "./types";

// Ready-made looks of every DataTable. Each one is only CSS (DataTable.module.css,
// `.view-<id>`); the columns, data and behaviour stay the same.
export const TABLE_VIEWS: readonly TableViewId[] = [
  "classic",
  "striped",
  "grid",
  "minimal",
  "cards",
  "accent",
];

export const DEFAULT_TABLE_VIEW: TableViewId = "classic";

export const isTableView = (id: string | null | undefined): id is TableViewId =>
  TABLE_VIEWS.some((view) => view === id);
