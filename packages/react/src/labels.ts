import type { TableViewId } from "./types.js";

// Every text the table shows. Pass your own (all or some) to
// TableSyncProvider — e.g. built from your i18n library.
export interface TableSyncLabels {
  actions: string;
  rowActions: string;
  rowActionsFor: (name: string) => string;
  viewDetails: string;
  settings: string;
  view: string;
  density: string;
  compact: string;
  comfortable: string;
  columns: string;
  visibleCount: (visible: number, total: number) => string;
  columnsHint: string;
  pinnedLeft: string;
  pinnedRight: string;
  notPinned: string;
  pinLeft: string;
  pinRight: string;
  unpin: string;
  showAll: string;
  resetWidth: string;
  alwaysVisible: string;
  dragColumn: (name: string) => string;
  resizeColumn: (name: string) => string;
  reset: string;
  resetConfirmTitle: string;
  resetConfirmBody: string;
  cancel: string;
  done: string;
  emptyTitle: string;
  emptyText: string;
  errorTitle: string;
  retry: string;
  total: (from: number, to: number, total: number) => string;
  views: Record<TableViewId, { name: string; desc: string }>;
}

export type TableSyncLabelsInput = Partial<Omit<TableSyncLabels, "views">> & {
  views?: Partial<Record<TableViewId, { name: string; desc: string }>>;
};

export const DEFAULT_LABELS: TableSyncLabels = {
  actions: "Actions",
  rowActions: "Row actions",
  rowActionsFor: (name) => `Actions for ${name}`,
  viewDetails: "View details",
  settings: "Table settings",
  view: "Table view",
  density: "Row density",
  compact: "Compact",
  comfortable: "Comfortable",
  columns: "Columns",
  visibleCount: (visible, total) => `${visible} of ${total} visible`,
  columnsHint:
    "Drag to reorder, tick to show or hide, pin important columns to the left or right. Resize a column by dragging the edge of its header.",
  pinnedLeft: "Pinned left",
  pinnedRight: "Pinned right",
  notPinned: "Not pinned",
  pinLeft: "Pin left",
  pinRight: "Pin right",
  unpin: "Unpin",
  showAll: "Show all columns",
  resetWidth: "Back to the default width",
  alwaysVisible: "This column is always shown",
  dragColumn: (name) => `Move column ${name}`,
  resizeColumn: (name) => `Resize column ${name}`,
  reset: "Reset to default",
  resetConfirmTitle: "Reset this table?",
  resetConfirmBody: "Columns, widths, pins, density and view go back to the default.",
  cancel: "Cancel",
  done: "Done",
  emptyTitle: "Nothing here yet",
  emptyText: "There are no records to show.",
  errorTitle: "The data could not be loaded",
  retry: "Try again",
  total: (from, to, total) => `${from}–${to} of ${total}`,
  views: {
    classic: { name: "Classic", desc: "Tinted header, a line between rows" },
    striped: {
      name: "Striped",
      desc: "Every other row tinted — easy to follow long rows",
    },
    grid: { name: "Grid", desc: "Lines around every cell, like a spreadsheet" },
    minimal: { name: "Minimal", desc: "No fills, hardly any lines — calm and airy" },
    cards: { name: "Cards", desc: "Each row is a separate card" },
    accent: { name: "Status accent", desc: "A colored stripe shows each row's status" },
  },
};

export function mergeLabels(input: TableSyncLabelsInput | undefined): TableSyncLabels {
  if (!input) return DEFAULT_LABELS;
  return {
    ...DEFAULT_LABELS,
    ...input,
    views: { ...DEFAULT_LABELS.views, ...input.views },
  } as TableSyncLabels;
}
