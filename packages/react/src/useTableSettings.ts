import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useTableSync } from "./context";
import type { TableSettingsPatch } from "./types";

// Settings of one table: loaded the first time a table with this key
// shows up, then kept in the provider's cache. `settings` is undefined
// until they are loaded.
export function useTableSettings(tableKey: string) {
  const { store, onSaveError } = useTableSync();

  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(tableKey, listener),
    [store, tableKey],
  );
  const settings = useSyncExternalStore(subscribe, () => store.getSnapshot(tableKey));

  useEffect(() => store.load(tableKey), [store, tableKey]);

  const actions = useMemo(
    () => ({
      update: (change: TableSettingsPatch) => store.update(tableKey, change, onSaveError),
      reset: () => store.reset(tableKey, onSaveError),
    }),
    [store, tableKey, onSaveError],
  );

  return { settings, ...actions };
}
