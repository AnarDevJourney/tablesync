import type { ColumnPin, DataTableColumn, TableColumnSetting } from "./types";

export const DEFAULT_COLUMN_WIDTH = 160;
export const MIN_COLUMN_WIDTH = 72;
export const MAX_COLUMN_WIDTH = 800;

export interface ResolvedColumn<T> {
  def: DataTableColumn<T>;
  key: string;
  visible: boolean;
  width: number; // effective width
  customWidth: boolean; // the user resized it
  pinned: ColumnPin | null;
}

export const minWidthOf = <T>(def: DataTableColumn<T>) =>
  def.minWidth ?? MIN_COLUMN_WIDTH;
export const maxWidthOf = <T>(def: DataTableColumn<T>) =>
  def.maxWidth ?? MAX_COLUMN_WIDTH;
export const clampWidth = <T>(def: DataTableColumn<T>, width: number) =>
  Math.round(Math.min(maxWidthOf(def), Math.max(minWidthOf(def), width)));

const zone = (pinned: ColumnPin | null) =>
  pinned === "left" ? 0 : pinned === "right" ? 2 : 1;

// Column definitions (code) + saved settings (user) → display order.
// Saved keys that no longer exist are dropped; new columns keep their
// place from the definitions. Left-pinned first, right-pinned last (AntD
// needs fixed columns at the edges), saved order within each zone.
export function resolveColumns<T>(
  defs: DataTableColumn<T>[],
  saved: TableColumnSetting[] | null,
): ResolvedColumn<T>[] {
  const savedByKey = new Map((saved ?? []).map((s, index) => [s.key, { ...s, index }]));

  const resolved = defs.map((def, defIndex) => {
    const s = savedByKey.get(def.key);
    const width =
      s?.width != null ? clampWidth(def, s.width) : (def.width ?? DEFAULT_COLUMN_WIDTH);
    return {
      def,
      key: def.key,
      visible: def.hideable === false ? true : (s?.visible ?? !def.defaultHidden),
      width,
      customWidth: s?.width != null,
      pinned: s ? s.pinned : (def.defaultPinned ?? null),
      // unsaved (new) columns sort right after the saved column that
      // precedes them in the definitions
      order: s ? s.index : (savedIndexBefore(defs, defIndex, savedByKey) ?? -1) + 0.5,
    };
  });

  return resolved
    .sort((a, b) => zone(a.pinned) - zone(b.pinned) || a.order - b.order)
    .map((column) => ({
      def: column.def,
      key: column.key,
      visible: column.visible,
      width: column.width,
      customWidth: column.customWidth,
      pinned: column.pinned,
    }));
}

function savedIndexBefore<T>(
  defs: DataTableColumn<T>[],
  defIndex: number,
  savedByKey: Map<string, { index: number }>,
): number | undefined {
  for (let i = defIndex - 1; i >= 0; i--) {
    const s = savedByKey.get(defs[i].key);
    if (s) return s.index;
  }
  return undefined;
}

// What is stored: every column, in display order
export function toSavedColumns<T>(columns: ResolvedColumn<T>[]): TableColumnSetting[] {
  return columns.map((c) => ({
    key: c.key,
    visible: c.visible,
    width: c.customWidth ? c.width : null,
    pinned: c.pinned,
  }));
}
