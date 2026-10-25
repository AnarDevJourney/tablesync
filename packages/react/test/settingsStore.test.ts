import { describe, expect, it, vi } from "vitest";
import { SettingsStore } from "../src/settingsStore";
import type { TableSettingsStorage } from "../src/types";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function memoryStorage(initial: Record<string, object> = {}) {
  const data: Record<string, object> = { ...initial };
  const calls: string[] = [];
  const storage: TableSettingsStorage = {
    load: vi.fn(async (key: string) => {
      calls.push(`load ${key}`);
      return (data[key] as never) ?? null;
    }),
    save: vi.fn(async (key: string, patch: object) => {
      calls.push(`save ${key} ${JSON.stringify(patch)}`);
      data[key] = { ...data[key], ...patch };
    }),
    reset: vi.fn(async (key: string) => {
      calls.push(`reset ${key}`);
      delete data[key];
    }),
  };
  return { storage, data, calls };
}

describe("SettingsStore", () => {
  it("loads a table once and normalizes missing fields to null", async () => {
    const { storage } = memoryStorage({ users: { density: "comfortable", extra: 1 } });
    const store = new SettingsStore(storage);
    expect(store.getSnapshot("users")).toBeUndefined();
    store.load("users");
    store.load("users");
    await flush();
    expect(storage.load).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot("users")).toEqual({
      columns: null,
      density: "comfortable",
      view: null,
    });
  });

  it("falls back to defaults when loading fails", async () => {
    const store = new SettingsStore({
      load: async () => {
        throw new Error("down");
      },
      save: async () => {},
      reset: async () => {},
    });
    store.load("users");
    await flush();
    expect(store.getSnapshot("users")).toEqual({
      columns: null,
      density: null,
      view: null,
    });
  });

  it("updates the cache at once and writes in order", async () => {
    const { storage, calls } = memoryStorage();
    const store = new SettingsStore(storage);
    const listener = vi.fn();
    store.subscribe("users", listener);
    store.load("users");
    await flush();

    store.update("users", { density: "comfortable" }, vi.fn());
    expect(store.getSnapshot("users")?.density).toBe("comfortable");
    store.update("users", { view: "grid" }, vi.fn());
    store.reset("users", vi.fn());
    expect(store.getSnapshot("users")).toEqual({
      columns: null,
      density: null,
      view: null,
    });
    await flush();

    expect(calls).toEqual([
      "load users",
      'save users {"density":"comfortable"}',
      'save users {"view":"grid"}',
      "reset users",
    ]);
    expect(listener).toHaveBeenCalled();
  });

  it("reports a failed write and reloads what is really saved", async () => {
    const { storage, data } = memoryStorage({ users: { density: "compact" } });
    storage.save = vi.fn(async () => {
      throw new Error("500");
    });
    const store = new SettingsStore(storage);
    store.load("users");
    await flush();

    const onError = vi.fn();
    store.update("users", { density: "comfortable" }, onError);
    expect(store.getSnapshot("users")?.density).toBe("comfortable");
    await flush();
    await flush();

    expect(onError).toHaveBeenCalledWith(expect.any(Error), "users");
    expect(store.getSnapshot("users")?.density).toBe("compact");
    expect(data.users).toEqual({ density: "compact" });
  });

  it("keeps tables apart", async () => {
    const { storage } = memoryStorage({ a: { view: "grid" } });
    const store = new SettingsStore(storage);
    store.load("a");
    store.load("b");
    await flush();
    expect(store.getSnapshot("a")?.view).toBe("grid");
    expect(store.getSnapshot("b")?.view).toBeNull();
  });
});
