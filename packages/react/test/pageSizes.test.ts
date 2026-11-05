import { describe, expect, it } from "vitest";
import { cleanPageSizes, savedPageSizes } from "../src/pageSizes";

describe("page sizes", () => {
  it("keeps whole numbers from 1 to 100, unique and sorted", () => {
    expect(cleanPageSizes(["30", 15, " 75 ", "15"])).toEqual([15, 30, 75]);
    expect(cleanPageSizes(["0", "101", "-5", "10.5", "abc", "", null])).toEqual([]);
    expect(cleanPageSizes(["1", "100"])).toEqual([1, 100]);
  });

  it("keeps at most 10 sizes", () => {
    expect(cleanPageSizes(Array.from({ length: 15 }, (_, i) => i + 1))).toHaveLength(10);
  });

  it("treats nothing usable as nothing saved", () => {
    expect(savedPageSizes(null)).toBeNull();
    expect(savedPageSizes([])).toBeNull();
    expect(savedPageSizes([500])).toBeNull();
    expect(savedPageSizes([30, 15])).toEqual([15, 30]);
  });
});
