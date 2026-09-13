import { describe, expect, test } from "vitest";
import { sameElement } from "../../src/cacheKey/KeyElementEquality";

describe("sameElement", () => {
  test("the same primitive value compares equal", () => {
    expect(sameElement(5, 5)).toBe(true);
    expect(sameElement("5", "5")).toBe(true);
    expect(sameElement("?", "?")).toBe(true);
  });

  test("a numeric and a string key do not compare equal - keys are model-typed, so a cross-type match would be a client-side type error, not a match", () => {
    expect(sameElement(5, "5")).toBe(false);
    expect(sameElement("5", 5)).toBe(false);
  });

  test("a composite key object compares by value, independent of property insertion order", () => {
    expect(sameElement({ MediumId: 5, InventoryNumber: 7 }, { InventoryNumber: 7, MediumId: 5 })).toBe(true);
  });

  test("a composite key with a differing value does not compare equal", () => {
    expect(sameElement({ MediumId: 5, InventoryNumber: 7 }, { MediumId: 5, InventoryNumber: 8 })).toBe(false);
  });

  test("arrays compare element by element", () => {
    expect(sameElement(["Media", "list"], ["Media", "list"])).toBe(true);
    expect(sameElement(["Media", "list"], ["Media", "detail"])).toBe(false);
  });

  test("a primitive and an object never compare equal", () => {
    expect(sameElement(5, { Id: 5 })).toBe(false);
  });
});
