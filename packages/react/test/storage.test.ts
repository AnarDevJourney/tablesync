import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalStorage } from "../src/storage/localStorage";
import { createRestStorage, TableSyncRequestError } from "../src/storage/rest";

describe("createLocalStorage", () => {
  beforeEach(() => window.localStorage.clear());

  it("saves patches, loads them back and resets", async () => {
    const storage = createLocalStorage({ prefix: "app:" });
    expect(await storage.load("users")).toBeNull();
    await storage.save("users", { density: "comfortable" });
    await storage.save("users", { view: "grid" });
    expect(await storage.load("users")).toEqual({ density: "comfortable", view: "grid" });
    expect(window.localStorage.getItem("app:users")).not.toBeNull();
    await storage.reset("users");
    expect(await storage.load("users")).toBeNull();
  });

  it("treats broken JSON as nothing saved", async () => {
    window.localStorage.setItem("tablesync:users", "{oops");
    expect(await createLocalStorage().load("users")).toBeNull();
  });
});

describe("createRestStorage", () => {
  const json = (status: number, body?: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), { status });

  it("talks to {baseUrl}/:tableKey with the right methods", async () => {
    const fetch = vi.fn(async () => json(200, { data: { density: "compact" } }));
    const storage = createRestStorage({
      baseUrl: "/api/table-settings/",
      headers: () => ({ Authorization: "Bearer t" }),
      unwrap: (body) => (body as { data: never }).data,
      fetch,
    });

    expect(await storage.load("users")).toEqual({ density: "compact" });
    await storage.save("users", { view: "grid" });
    fetch.mockResolvedValueOnce(json(204));
    await storage.reset("users");

    const calls = fetch.mock.calls as unknown as [string, RequestInit][];
    expect(calls.map(([url, init]) => `${init.method} ${url}`)).toEqual([
      "GET /api/table-settings/users",
      "PATCH /api/table-settings/users",
      "DELETE /api/table-settings/users",
    ]);
    expect(calls[1][1].body).toBe('{"view":"grid"}');
    expect((calls[1][1].headers as Record<string, string>)["authorization"]).toBe(
      "Bearer t",
    );
    expect(calls[0][1].credentials).toBe("same-origin");
  });

  it("maps 404 on load to nothing saved and errors to TableSyncRequestError", async () => {
    const fetch = vi.fn(async () => json(404));
    const storage = createRestStorage({ baseUrl: "/s", fetch });
    expect(await storage.load("users")).toBeNull();

    fetch.mockResolvedValueOnce(json(503));
    await expect(storage.save("users", { view: "grid" })).rejects.toMatchObject({
      name: "TableSyncRequestError",
      status: 503,
    });

    fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const error = await storage.load("users").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TableSyncRequestError);
    expect((error as TableSyncRequestError).status).toBe(0);
  });
});
