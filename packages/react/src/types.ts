import type { TableProps } from "antd";
import type { Key, ReactNode } from "react";

export type TableDensity = "compact" | "comfortable";
export type ColumnPin = "left" | "right";
export type TableViewId = "classic" | "striped" | "grid" | "minimal" | "cards" | "accent";

// ─── Saved settings ──────────────────────────────────────────

export interface TableColumnSetting {
  key: string;
  visible: boolean;
  width: number | null; // null = the column's default width
  pinned: ColumnPin | null;
}

// What is saved for one table (and one user); null = the table's default
export interface TableSettings {
  columns: TableColumnSetting[] | null;
  density: TableDensity | null;
  view: string | null;
}

export type TableSettingsPatch = Partial<TableSettings>;

// Where settings live: localStorage, your REST API, anything async.
// `load` may return extra fields (they are ignored) or null (nothing saved).
// `save` gets only the changed fields; `reset` deletes the saved settings.
export interface TableSettingsStorage {
  load(tableKey: string): Promise<Partial<TableSettings> | null>;
  save(tableKey: string, patch: TableSettingsPatch): Promise<unknown>;
  reset(tableKey: string): Promise<unknown>;
}

// ─── Columns and props ───────────────────────────────────────

export interface DataTableColumn<T> {
  // Stable id, stored in the user's table settings — never rename one
  key: string;
  // Plain text: header and the name in the settings drawer
  title: string;
  // Custom header content (icon, tooltip …); defaults to `title`
  header?: ReactNode;
  // Field to read; nested paths as arrays (["doctor", "lastName"])
  dataIndex?: keyof T | string[];
  render?: (value: unknown, record: T, index: number) => ReactNode;
  width?: number; // default width in px (160)
  minWidth?: number; // resize limits (72 … 800)
  maxWidth?: number;
  align?: "left" | "center" | "right";
  // Numbers, money, times, MRN: tabular figures, right aligned
  numeric?: boolean;
  // Server-side sorting: the table reports the clicked column via onSortChange
  sortable?: boolean;
  ellipsis?: boolean;
  defaultHidden?: boolean;
  defaultPinned?: ColumnPin;
  // false = always visible (e.g. the name column)
  hideable?: boolean;
}

export type SortOrder = "asc" | "desc";
export interface DataTableSort {
  key: string;
  order: SortOrder;
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  pageSizeOptions?: number[];
}

export interface DataTableEmptyState {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

// One item of a row's ⋮ menu
export interface DataTableRowAction {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}
// "divider" draws a line; dividers at the edges or doubled are dropped,
// so conditional items need no special care
export type DataTableRowMenuItem = DataTableRowAction | "divider";

export interface DataTableProps<T extends object> {
  // Key the settings are saved under ('users', 'orders', …)
  tableKey: string;
  columns: DataTableColumn<T>[];
  data: T[] | undefined;
  rowKey: keyof T | ((record: T) => Key);

  loading?: boolean; // first load → skeleton rows; refetch → dimmed rows
  error?: Error | null;
  onRetry?: () => void;
  empty?: DataTableEmptyState;

  pagination?: DataTablePagination | false;
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;

  onRowClick?: (record: T) => void;
  // Color of the left stripe in the "accent" view (a CSS color / variable)
  rowAccent?: (record: T) => string | undefined;
  rowSelection?: TableProps<T>["rowSelection"];

  // ⋮ menu at the end of every row, in a column pinned to the right. Not a
  // user column: it can't be hidden, moved or resized in the settings.
  rowActions?: (record: T) => DataTableRowMenuItem[];
  // Adds "View details" as the first item of the ⋮ menu (opens a drawer)
  onViewDetails?: (record: T) => void;
  // The row's name for screen readers: "Actions for <name>"
  rowLabel?: (record: T) => string;

  // Left side of the toolbar (search, filters); right side: extra actions
  toolbar?: ReactNode;
  actions?: ReactNode;

  defaultDensity?: TableDensity;
  defaultView?: TableViewId;
  // false hides the settings button (e.g. small embedded tables)
  configurable?: boolean;
  // Sticky header offset (height of the app's top bar); default from the
  // TableSyncProvider, else 0
  stickyOffset?: number;
}
