import { describe, expect, test } from "vitest";
import { touchesType } from "../../src/cacheKey";

const MEDIUM = "Library.Catalog.Medium";
const MEMBER = "Library.Circulation.Member";
const RESERVATION = "Library.Circulation.Reservation";

describe("touchesType", () => {
  test("finds the root type", () => {
    expect(touchesType(MEDIUM, [MEDIUM, "list"])).toBe(true);
  });

  test("finds a type in a hierarchical hop", () => {
    const key = [MEMBER, "detail", 42, RESERVATION, "list", "Reservations"];
    expect(touchesType(RESERVATION, key)).toBe(true);
    expect(touchesType(MEMBER, key)).toBe(true);
  });

  test("finds the root type of a re-rooted key", () => {
    const key = [RESERVATION, "list", { filter: { "Member/Id": 42 } }];
    expect(touchesType(RESERVATION, key)).toBe(true);
    expect(touchesType(MEMBER, key)).toBe(false);
  });

  test("finds a cast in the params object", () => {
    const key = [MEDIUM, "list", { cast: "Library.Catalog.Book" }];
    expect(touchesType("Library.Catalog.Book", key)).toBe(true);
  });

  test("a property name never matches", () => {
    const key = [MEMBER, "detail", 42, RESERVATION, "list", "Reservations"];
    expect(touchesType("Reservations", key)).toBe(false);
  });

  test("matching is exact - there is no inheritance", () => {
    const key = ["PublisherRegistry.Publisher", "detail", 7, "Library.Catalog.Book", "list", "Books"];
    expect(touchesType("Library.Catalog.Book", key)).toBe(true);
    expect(touchesType(MEDIUM, key)).toBe(false);
  });

  test("a bound operation name is reported - a harmless imprecision", () => {
    const key = [MEMBER, "detail", 42, "Library.Circulation.BulkRenew"];
    expect(touchesType("Library.Circulation.BulkRenew", key)).toBe(true);
  });

  test("an unrelated type does not match", () => {
    expect(touchesType("Library.Catalog.Book", [MEDIUM, "list"])).toBe(false);
  });

  test("an empty key matches nothing", () => {
    expect(touchesType(MEDIUM, [])).toBe(false);
  });

  test("a search term with no dot cannot be a type and never matches", () => {
    // this is what makes "a property name never matches" true for any input rather than only for
    // well-formed input: without the guard, the scan would find the hop's own name
    const key = [MEMBER, "detail", 42, RESERVATION, "list", "Reservations"];
    expect(touchesType("Reservations", key)).toBe(false);
    expect(touchesType("detail", key)).toBe(false);
    expect(touchesType("", key)).toBe(false);
  });

  test("only the cast entry of the params object is inspected, not other params values", () => {
    const key = [MEDIUM, "list", { filter: { Title: "Library.Catalog.Book" }, cast: "Library.Catalog.Book" }];
    expect(touchesType("Library.Catalog.Book", key)).toBe(true);
    const noCast = [MEDIUM, "list", { filter: { Title: "Library.Catalog.Book" } }];
    expect(touchesType("Library.Catalog.Book", noCast)).toBe(false);
  });
});
