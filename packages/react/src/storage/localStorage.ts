import type { TableSettings, TableSettingsStorage } from "../types";

export interface LocalStorageOptions {
  // Key prefix; use one per user if several people share a browser
  prefix?: string;
}

// Zero-backend storage: settings stay in this browser only. Storage that
// is blocked (private mode, quota) behaves like "nothing saved".
export function createLocalStorage({
  prefix = "tablesync:",
}: LocalStorageOptions = {}): TableSettingsStorage {
  const read = (tableKey: string): Partial<TableSettings> | null => {
    try {
      const raw = window.localStorage.getItem(prefix + tableKey);
      return raw ? (JSON.parse(raw) as Partial<TableSettings>) : null;
    } catch {
      return null;
    }
  };

  return {
    async load(tableKey) {
      return read(tableKey);
    },
    async save(tableKey, patch) {
      try {
        const next = { ...read(tableKey), ...patch };
        window.localStorage.setItem(prefix + tableKey, JSON.stringify(next));
      } catch {
        // not saved — the table still shows the change for this session
      }
    },
    async reset(tableKey) {
      try {
        window.localStorage.removeItem(prefix + tableKey);
      } catch {
        // nothing to remove
      }
    },
  };
}
