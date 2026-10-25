import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { TableKeyParam, UpdateTableSettingsDto } from "../dist/index.js";

const errorsOf = async (body: unknown) => {
  const dto = plainToInstance(UpdateTableSettingsDto, body);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  return errors.map((e) => e.property);
};

describe("UpdateTableSettingsDto", () => {
  it("accepts a full patch and nulls", async () => {
    expect(
      await errorsOf({
        columns: [{ key: "lastName", visible: true, width: 180, pinned: "left" }],
        density: "compact",
        view: "striped",
      }),
    ).toEqual([]);
    expect(await errorsOf({ columns: null, density: null, view: null })).toEqual([]);
    expect(await errorsOf({})).toEqual([]);
  });

  it("rejects bad values", async () => {
    expect(await errorsOf({ density: "huge" })).toEqual(["density"]);
    expect(await errorsOf({ view: "Not A Slug" })).toEqual(["view"]);
    expect(
      await errorsOf({
        columns: [{ key: "a", visible: "yes", width: 10, pinned: "top" }],
      }),
    ).toEqual(["columns"]);
    expect(await errorsOf({ extra: 1 })).toEqual(["extra"]);
    expect(
      await errorsOf({
        columns: Array.from({ length: 61 }, (_, i) => ({
          key: `c${i}`,
          visible: true,
          width: null,
          pinned: null,
        })),
      }),
    ).toEqual(["columns"]);
  });

  it("checks the table key", async () => {
    const check = async (tableKey: string) =>
      (await validate(plainToInstance(TableKeyParam, { tableKey }))).length;
    expect(await check("lab-queue")).toBe(0);
    expect(await check("Users")).toBe(1);
    expect(await check("a".repeat(41))).toBe(1);
  });
});
