import { createContext, useContext } from "react";
import { DEFAULT_LABELS, type TableSyncLabels } from "./labels";
import { SettingsStore, type SaveErrorHandler } from "./settingsStore";
import { createLocalStorage } from "./storage/localStorage";

export interface TableSyncContextValue {
  store: SettingsStore;
  labels: TableSyncLabels;
  onSaveError: SaveErrorHandler;
  stickyOffset: number;
}

const logSaveError: SaveErrorHandler = (error, tableKey) =>
  console.error(`[tablesync] settings of "${tableKey}" could not be saved`, error);

// Without a TableSyncProvider: localStorage, English texts
export const TableSyncContext = createContext<TableSyncContextValue>({
  store: new SettingsStore(createLocalStorage()),
  labels: DEFAULT_LABELS,
  onSaveError: logSaveError,
  stickyOffset: 0,
});

export { logSaveError };

export const useTableSync = () => useContext(TableSyncContext);
