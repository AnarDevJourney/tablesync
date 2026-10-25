import { useMemo, type ReactNode } from "react";
import { logSaveError, TableSyncContext } from "./context";
import { mergeLabels, type TableSyncLabelsInput } from "./labels";
import { SettingsStore, type SaveErrorHandler } from "./settingsStore";
import { createLocalStorage } from "./storage/localStorage";
import type { TableSettingsStorage } from "./types";

export interface TableSyncProviderProps {
  // Where settings are saved; default: this browser's localStorage.
  // Keep it stable (module level or useMemo) — a new one starts a new cache.
  storage?: TableSettingsStorage;
  // Your texts; missing ones fall back to English. Memoize them.
  labels?: TableSyncLabelsInput;
  // A change could not be saved (the table then reloads from the storage)
  onSaveError?: SaveErrorHandler;
  // Default sticky header offset of every table (your top bar's height)
  stickyOffset?: number;
  children: ReactNode;
}

// Settings for every DataTable inside. The cache lives as long as the
// provider: mount it where the signed-in user is known (or give it a
// `key` per user) so one user never sees another's settings.
export function TableSyncProvider({
  storage,
  labels,
  onSaveError = logSaveError,
  stickyOffset = 0,
  children,
}: TableSyncProviderProps) {
  const store = useMemo(
    () => new SettingsStore(storage ?? createLocalStorage()),
    [storage],
  );
  const merged = useMemo(() => mergeLabels(labels), [labels]);
  const value = useMemo(
    () => ({ store, labels: merged, onSaveError, stickyOffset }),
    [store, merged, onSaveError, stickyOffset],
  );
  return <TableSyncContext.Provider value={value}>{children}</TableSyncContext.Provider>;
}
