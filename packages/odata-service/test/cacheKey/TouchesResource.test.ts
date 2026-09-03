import { describe, expect, test } from "vitest";
import { touchesResource } from "../../src/cacheKey";

const MEDIUM = "Library.Catalog.Medium";
const MEMBER = "Library.Circulation.Member";
const RESERVATION = "Library.Circulation.Reservation";

describe("touchesResource", () => {
  test("finds the root type", () => {
    expect(touchesResource(MEDIUM, [MEDIUM, "list"])).toBe(true);
  });

  test("finds a type in a hierarchical hop", () => {
    const key = [MEMBER, "detail", 42, RESERVATION, "list", "Reservations"];
    expect(touchesResource(RESERVATION, key)).toBe(true);
    expect(touchesResource(MEMBER, key)).toBe(true);
  });

  test("finds the root type of a re-rooted key", () => {
    const key = [RESERVATION, "list", { filter: { "Member/Id": 42 } }];
    expect(touchesResource(RESERVATION, key)).toBe(true);
    expect(touchesResource(MEMBER, key)).toBe(false);
  });

  test("finds a cast in the params object", () => {
    const key = [MEDIUM, "list", { cast: "Library.Catalog.Book" }];
    expect(touchesResource("Library.Catalog.Book", key)).toBe(true);
  });

  test("a property name never matches", () => {
    const key = [MEMBER, "detail", 42, RESERVATION, "list", "Reservations"];
    expect(touchesResource("Reservations", key)).toBe(false);
  });

  test("matching is exact - there is no inheritance", () => {
    const key = ["PublisherRegistry.Publisher", "detail", 7, "Library.Catalog.Book", "list", "Books"];
    expect(touchesResource("Library.Catalog.Book", key)).toBe(true);
    expect(touchesResource(MEDIUM, key)).toBe(false);
  });

  test("a bound operation name is reported - a harmless imprecision", () => {
    const key = [MEMBER, "detail", 42, "Library.Circulation.BulkRenew"];
    expect(touchesResource("Library.Circulation.BulkRenew", key)).toBe(true);
  });

  test("an unrelated type does not match", () => {
    expect(touchesResource("Library.Catalog.Book", [MEDIUM, "list"])).toBe(false);
  });

  test("an empty key matches nothing", () => {
    expect(touchesResource(MEDIUM, [])).toBe(false);
  });

  test("a search term with no dot cannot be a type and never matches", () => {
    // this is what makes "a property name never matches" true for any input rather than only for
    // well-formed input: without the guard, the scan would find the hop's own name
    const key = [MEMBER, "detail", 42, RESERVATION, "list", "Reservations"];
    expect(touchesResource("Reservations", key)).toBe(false);
    expect(touchesResource("detail", key)).toBe(false);
    expect(touchesResource("", key)).toBe(false);
  });

  test("only the cast entry of the params object is inspected, not other params values", () => {
    const key = [MEDIUM, "list", { filter: { Title: "Library.Catalog.Book" }, cast: "Library.Catalog.Book" }];
    expect(touchesResource("Library.Catalog.Book", key)).toBe(true);
    const noCast = [MEDIUM, "list", { filter: { Title: "Library.Catalog.Book" } }];
    expect(touchesResource("Library.Catalog.Book", noCast)).toBe(false);
  });
});

describe("touchesResource - array needle: an invalidates entry, wherever it occurs", () => {
  const COPY = "Library.Circulation.Copy";

  test("a root-shaped needle matches itself exactly", () => {
    expect(touchesResource([MEDIUM, "detail", 5], [MEDIUM, "detail", 5])).toBe(true);
  });

  test("a root-shaped needle matches as a plain prefix - the no-skip path", () => {
    const key = [MEDIUM, "detail", 5, COPY, "list", "Copies"];
    expect(touchesResource([MEDIUM, "detail", 5], key)).toBe(true);
  });

  test("a composite key object matches by value, not by reference", () => {
    const key = [COPY, "detail", { MediumId: 5, InventoryNumber: 7 }];
    expect(touchesResource([COPY, "detail", { InventoryNumber: 7, MediumId: 5 }], key)).toBe(true);
  });

  test("the type-wide list entry reaches a nested list hop under a different, unrelated parent", () => {
    const key = ["Library.Circulation.Loan", "detail", 1, COPY, "list", "Copies"];
    expect(touchesResource([COPY, "list"], key)).toBe(true);
  });

  test("a detail needle does not match a list occurrence of the same type - more precise than the string form", () => {
    const key = ["Library.Circulation.Loan", "detail", 1, COPY, "list", "Copies"];
    expect(touchesResource([COPY, "detail", 7], key)).toBe(false);
  });

  test("a specific-key needle reaches the same entity addressed as a hop under an unrelated parent", () => {
    // /SomeOther(9)/Copies(MediumId=5,InventoryNumber=7) - a completely different route to the very
    // same Copy this write's own key names
    const key = [
      "Library.Circulation.SomeOther",
      "detail",
      9,
      COPY,
      "detail",
      "Copies",
      { MediumId: 5, InventoryNumber: 7 },
    ];
    expect(touchesResource([COPY, "detail", { MediumId: 5, InventoryNumber: 7 }], key)).toBe(true);
  });

  test("a specific-key needle does not match a different key reached the same way", () => {
    const key = [
      "Library.Circulation.SomeOther",
      "detail",
      9,
      COPY,
      "detail",
      "Copies",
      { MediumId: 5, InventoryNumber: 7 },
    ];
    expect(touchesResource([COPY, "detail", { MediumId: 9, InventoryNumber: 1 }], key)).toBe(false);
  });

  test("the skip never applies anywhere but immediately after a kind marker", () => {
    // MEDIUM itself is not a kind marker, so this must not skip past it to find a coincidental "detail",5
    // further along
    const key = [MEDIUM, "Copies", "detail", 5];
    expect(touchesResource([MEDIUM, "detail", 5], key)).toBe(false);
  });

  test("a to-one hop with no addressed key of its own is not reachable - there is nothing to find", () => {
    // /Copies(...)/Medium hierarchical: the hop only ever carries type, kind and the property name -
    // never the target's own key, so no needle carrying a key value can match it
    const key = [COPY, "detail", { MediumId: 5, InventoryNumber: 7 }, MEDIUM, "detail", "Medium"];
    expect(touchesResource([MEDIUM, "detail", 5], key)).toBe(false);
  });

  test("an empty key matches nothing", () => {
    expect(touchesResource([MEDIUM, "detail", 5], [])).toBe(false);
  });
});
