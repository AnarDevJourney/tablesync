export const TABLESYNC_OPTIONS = Symbol("TABLESYNC_OPTIONS");

export const TABLE_DENSITIES = ["compact", "comfortable"] as const;
export type TableDensity = (typeof TABLE_DENSITIES)[number];

export const COLUMN_PINS = ["left", "right"] as const;
export type ColumnPin = (typeof COLUMN_PINS)[number];

// Table keys and views: 'users', 'lab-queue', 'striped'
export const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;
// Column keys follow your API's field names ('lastName', 'createdAt', 'meta.tag')
export const COLUMN_KEY = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,59}$/;

export const MAX_COLUMNS = 60;
export const MIN_COLUMN_WIDTH = 40;
export const MAX_COLUMN_WIDTH = 1200;
export const DEFAULT_MAX_TABLES_PER_USER = 200;
