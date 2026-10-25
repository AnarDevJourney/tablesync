import { describe, expect, it } from "vitest";
import { resolveColumns, toSavedColumns } from "../src/resolveColumns";
import type { DataTableColumn } from "../src/types";

type Row = { name: string };
const defs: DataTableColumn<Row>[] = [
  { key: "name", title: "Name", hideable: false },
  { key: "email", title: "Email", width: 240 },
  { key: "role", title: "Role" },
  { key: "notes", title: "Notes", defaultHidden: true },
];
const keys = (columns: { key: string }[]) => columns.map((c) => c.key);

describe("resolveColumns", () => {
  it("uses the definitions when nothing is saved", () => {
    const columns = resolveColumns(defs, null);
    expect(keys(columns)).toEqual(["name", "email", "role", "notes"]);
    expect(columns.map((c) => c.visible)).toEqual([true, true, true, false]);
    expect(columns.map((c) => c.width)).toEqual([160, 240, 160, 160]);
  });

  it("applies the saved order, visibility, width and pins", () => {
    const columns = resolveColumns(defs, [
      { key: "role", visible: true, width: 100, pinned: null },
      { key: "email", visible: false, width: null, pinned: null },
      { key: "name", visible: false, width: null, pinned: "left" },
      { key: "notes", visible: true, width: 5000, pinned: "right" },
    ]);
    expect(keys(columns)).toEqual(["name", "role", "email", "notes"]);
    const byKey = Object.fromEntries(columns.map((c) => [c.key, c]));
    expect(byKey.name.visible).toBe(true); // hideable: false wins
    expect(byKey.email.visible).toBe(false);
    expect(byKey.role).toMatchObject({ width: 100, customWidth: true });
    expect(byKey.notes.width).toBe(800); // clamped to the max width
  });

  it("drops unknown saved keys and slots new columns after their neighbour", () => {
    const columns = resolveColumns(defs, [
      { key: "gone", visible: true, width: null, pinned: null },
      { key: "email", visible: true, width: null, pinned: null },
      { key: "name", visible: true, width: null, pinned: null },
    ]);
    // role and notes are new: they follow email, their neighbour in the definitions
    expect(keys(columns)).toEqual(["email", "role", "notes", "name"]);
  });

  it("round-trips through toSavedColumns", () => {
    const columns = resolveColumns(defs, null);
    const saved = toSavedColumns(columns);
    expect(saved[1]).toEqual({ key: "email", visible: true, width: null, pinned: null });
    expect(keys(resolveColumns(defs, saved))).toEqual(keys(columns));
  });
});
