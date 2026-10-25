// Real Nest app + PostgreSQL. Runs only with TABLESYNC_TEST_DATABASE_URL set
// (an empty database you can throw away), e.g.
//   TABLESYNC_TEST_DATABASE_URL=postgres://user:pass@localhost:5432/tablesync_test npm test
import "reflect-metadata";
import { Module, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CreateTablesyncSettings1793300000000,
  TableSyncModule,
  TableSyncSettings,
} from "../dist/index.js";
// the browser half: its REST adapter must speak this module's contract
import { createRestStorage } from "../../react/src/storage/rest";

const url = process.env.TABLESYNC_TEST_DATABASE_URL;

describe.skipIf(!url)("TableSyncModule (e2e)", () => {
  let app: INestApplication;
  let base: string;

  // The user comes from a header here; a real app reads req.user from its guard
  const call = (method: string, path: string, user: string | null, body?: unknown) =>
    fetch(`${base}${path}`, {
      method,
      headers: {
        ...(user && { "x-user": user }),
        ...(body !== undefined && { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  beforeAll(async () => {
    @Module({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          url,
          entities: [TableSyncSettings],
          migrations: [CreateTablesyncSettings1793300000000],
          dropSchema: true,
          migrationsRun: true,
        }),
        TableSyncModule.forRoot({
          path: "api/table-settings",
          getUserId: (req) => req.headers["x-user"],
          maxTablesPerUser: 3,
        }),
      ],
    })
    class AppModule {}

    app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0);
    base = await app.getUrl();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("returns defaults when nothing is saved", async () => {
    const res = await call("GET", "/api/table-settings/users", "u1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      tableKey: "users",
      columns: null,
      density: null,
      view: null,
      updatedAt: null,
    });
  });

  it("saves only the sent fields and resets", async () => {
    const columns = [{ key: "email", visible: false, width: 220, pinned: "left" }];
    let res = await call("PATCH", "/api/table-settings/users", "u1", { columns });
    expect(res.status).toBe(200);
    res = await call("PATCH", "/api/table-settings/users", "u1", {
      density: "comfortable",
    });
    const body = await res.json();
    expect(body).toMatchObject({ columns, density: "comfortable", view: null });
    expect(body.updatedAt).not.toBeNull();

    res = await call("PATCH", "/api/table-settings/users", "u1", { columns: null });
    expect(await res.json()).toMatchObject({ columns: null, density: "comfortable" });

    res = await call("DELETE", "/api/table-settings/users", "u1");
    expect(res.status).toBe(204);
    res = await call("GET", "/api/table-settings/users", "u1");
    expect((await res.json()).updatedAt).toBeNull();
  });

  it("keeps users apart", async () => {
    await call("PATCH", "/api/table-settings/orders", "u1", { view: "grid" });
    const res = await call("GET", "/api/table-settings/orders", "u2");
    expect((await res.json()).view).toBeNull();
  });

  it("rejects bad input, duplicates and unknown users", async () => {
    expect(
      (await call("PATCH", "/api/table-settings/users", "u1", { density: "x" })).status,
    ).toBe(400);
    expect((await call("GET", "/api/table-settings/Bad_Key", "u1")).status).toBe(400);
    const dup = { key: "a", visible: true, width: null, pinned: null };
    const res = await call("PATCH", "/api/table-settings/users", "u1", {
      columns: [dup, dup],
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).toContain('duplicate column \\"a\\"');
    expect((await call("GET", "/api/table-settings/users", null)).status).toBe(401);
  });

  it("limits the number of tables per user", async () => {
    for (const key of ["t1", "t2", "t3"]) {
      expect(
        (await call("PATCH", `/api/table-settings/${key}`, "u3", { view: "grid" }))
          .status,
      ).toBe(200);
    }
    expect(
      (await call("PATCH", "/api/table-settings/t4", "u3", { view: "grid" })).status,
    ).toBe(422);
    // an existing table can still change
    expect(
      (await call("PATCH", "/api/table-settings/t1", "u3", { view: "cards" })).status,
    ).toBe(200);
  });

  it("works with the React package's REST storage", async () => {
    const storage = createRestStorage({
      baseUrl: `${base}/api/table-settings`,
      headers: { "x-user": "u4" },
    });
    expect(await storage.load("invoices")).toMatchObject({ columns: null, view: null });
    await storage.save("invoices", { view: "striped", density: "comfortable" });
    expect(await storage.load("invoices")).toMatchObject({
      view: "striped",
      density: "comfortable",
    });
    await storage.reset("invoices");
    expect(await storage.load("invoices")).toMatchObject({ view: null, updatedAt: null });
    await expect(storage.save("invoices", { view: "Bad View" })).rejects.toMatchObject({
      status: 400,
    });
  });
});
