import type { TableSettings, TableSettingsPatch, TableSettingsStorage } from "./types.js";

export const emptySettings = (): TableSettings => ({
  columns: null,
  density: null,
  view: null,
});

const normalize = (raw: Partial<TableSettings> | null): TableSettings => ({
  columns: raw?.columns ?? null,
  density: raw?.density ?? null,
  view: raw?.view ?? null,
});

export type SaveErrorHandler = (error: unknown, tableKey: string) => void;

interface Entry {
  settings: TableSettings | undefined; // undefined = still loading
  started: boolean;
  // Every load and write of one table runs after the previous one,
  // so the storage gets the changes in the order the user made them
  chain: Promise<void>;
  listeners: Set<() => void>;
}

// Settings of every table, loaded the first time a table shows up and
// kept for the lifetime of the store. Changes update the cache first
// (instant UI), then go to the storage; a failed write reloads the table
// from the storage so the UI shows what is really saved.
export class SettingsStore {
  private entries = new Map<string, Entry>();
  private readonly storage: TableSettingsStorage;

  constructor(storage: TableSettingsStorage) {
    this.storage = storage;
  }

  subscribe(tableKey: string, listener: () => void): () => void {
    const entry = this.entry(tableKey);
    entry.listeners.add(listener);
    return () => entry.listeners.delete(listener);
  }

  getSnapshot(tableKey: string): TableSettings | undefined {
    return this.entries.get(tableKey)?.settings;
  }

  load(tableKey: string): void {
    const entry = this.entry(tableKey);
    if (entry.started) return;
    entry.started = true;
    entry.chain = entry.chain.then(async () => {
      try {
        this.set(tableKey, normalize(await this.storage.load(tableKey)));
      } catch {
        // Storage down → table defaults, the table keeps working
        if (!entry.settings) this.set(tableKey, emptySettings());
      }
    });
  }

  update(tableKey: string, patch: TableSettingsPatch, onError: SaveErrorHandler): void {
    const current = this.getSnapshot(tableKey) ?? emptySettings();
    this.set(tableKey, { ...current, ...patch });
    this.write(tableKey, () => this.storage.save(tableKey, patch), onError);
  }

  reset(tableKey: string, onError: SaveErrorHandler): void {
    this.set(tableKey, emptySettings());
    this.write(tableKey, () => this.storage.reset(tableKey), onError);
  }

  private write(
    tableKey: string,
    run: () => Promise<unknown>,
    onError: SaveErrorHandler,
  ) {
    const entry = this.entry(tableKey);
    entry.chain = entry.chain.then(run).then(
      () => undefined,
      async (error: unknown) => {
        onError(error, tableKey);
        try {
          this.set(tableKey, normalize(await this.storage.load(tableKey)));
        } catch {
          // keep what the user sees; the next change tries again
        }
      },
    );
  }

  private set(tableKey: string, settings: TableSettings) {
    const entry = this.entry(tableKey);
    entry.settings = settings;
    entry.listeners.forEach((listener) => listener());
  }

  private entry(tableKey: string): Entry {
    let entry = this.entries.get(tableKey);
    if (!entry) {
      entry = {
        settings: undefined,
        started: false,
        chain: Promise.resolve(),
        listeners: new Set(),
      };
      this.entries.set(tableKey, entry);
    }
    return entry;
  }
}
