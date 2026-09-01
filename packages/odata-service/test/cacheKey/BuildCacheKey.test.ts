import { describe, expect, test } from "vitest";
import { buildCacheKey, buildInvalidates, hopState, rootState, withKey, withParams } from "../../src/cacheKey";

const MEDIUM = "Library.Catalog.Medium";
const COPY = "Library.Circulation.Copy";
const MEMBER = "Library.Circulation.Member";
const RESERVATION = "Library.Circulation.Reservation";
const CHAPTER = "Library.Catalog.AudiobookChapter";

describe("buildCacheKey", () => {
  test("an entity set collection", () => {
    expect(buildCacheKey(rootState(MEDIUM, "list"))).toEqual([MEDIUM, "list"]);
  });

  test("query params become the trailing object", () => {
    expect(buildCacheKey(rootState(MEDIUM, "list"), { top: 10, select: ["Title"] })).toEqual([
      MEDIUM,
      "list",
      { top: 10, select: ["Title"] },
    ]);
  });

  test("an empty params object is dropped entirely", () => {
    expect(buildCacheKey(rootState(MEDIUM, "list"), {})).toEqual([MEDIUM, "list"]);
    expect(buildCacheKey(rootState(MEDIUM, "list"), undefined)).toEqual([MEDIUM, "list"]);
  });

  test("an entity by key", () => {
    expect(buildCacheKey(withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }))).toEqual([MEDIUM, "detail", 5]);
  });

  test("a composite key travels as an object", () => {
    const key = { MediumId: 5, InventoryNumber: 7 };
    expect(buildCacheKey(withKey(rootState(COPY, "list"), key, key))).toEqual([COPY, "detail", key]);
  });

  test("a singleton", () => {
    const state = withParams(rootState("Library.Circulation.Branch", "detail"), { singleton: "MainBranch" });
    expect(buildCacheKey(state)).toEqual(["Library.Circulation.Branch", "detail", { singleton: "MainBranch" }]);
  });

  test("a cast is a params entry, the root stays the entity set's type", () => {
    const state = withParams(rootState(MEDIUM, "list"), { cast: "Library.Catalog.Book" });
    expect(buildCacheKey(state)).toEqual([MEDIUM, "list", { cast: "Library.Catalog.Book" }]);
  });

  test("a navigation hop", () => {
    const state = hopState(withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }), {
      typeName: COPY,
      kind: "list",
      name: "Copies",
      entitySetType: COPY,
    });
    expect(buildCacheKey(state)).toEqual([MEDIUM, "detail", 5, COPY, "list", "Copies"]);
  });

  test("the state's own params and the query params merge", () => {
    const state = withParams(rootState(MEDIUM, "list"), { cast: "Library.Catalog.Book" });
    expect(buildCacheKey(state, { top: 10 })).toEqual([MEDIUM, "list", { cast: "Library.Catalog.Book", top: 10 }]);
  });

  test("a derived filter is applied last and replaces a same-path query filter", () => {
    const state = hopState(withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }), {
      typeName: COPY,
      kind: "list",
      name: "Copies",
      entitySetType: COPY,
      reRoot: { typeName: COPY, filter: { MediumId: 5 } },
    });
    expect(buildCacheKey(state, { filter: { MediumId: 9, Condition: 3 } })).toEqual([
      COPY,
      "list",
      { filter: { Condition: 3, MediumId: 5 } },
    ]);
  });

  test("an unbound operation with no entity set", () => {
    const state = withParams(rootState("$operation", "detail"), {});
    const key = buildCacheKey({ ...state, steps: ["Library.Circulation.TotalMediaCount"] });
    expect(key).toEqual(["$operation", "Library.Circulation.TotalMediaCount"]);
  });
});

describe("buildInvalidates", () => {
  test("a write to an entity: own key and own type, coarsest first", () => {
    const state = withKey(rootState(MEDIUM, "list"), 5, { Id: 5 });
    expect(buildInvalidates(state)).toEqual([
      [MEDIUM, "detail", 5],
      [MEDIUM, "list"],
    ]);
  });

  test("the own key is taken without its params object", () => {
    const state = withParams(withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }), { cast: "Library.Catalog.Book" });
    expect(buildInvalidates(state)).toContainEqual([MEDIUM, "detail", 5]);
  });

  test("a re-rooted write names the ancestor, the own key and the own type", () => {
    const copies = hopState(withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }), {
      typeName: COPY,
      kind: "list",
      name: "Copies",
      entitySetType: COPY,
      reRoot: { typeName: COPY, filter: { MediumId: 5 } },
    });
    const key = { MediumId: 5, InventoryNumber: 7 };
    expect(buildInvalidates(withKey(copies, key, key))).toEqual([
      [MEDIUM, "detail", 5],
      [COPY, "detail", key],
      [COPY, "list"],
    ]);
  });

  test("a POST to a re-rooted collection: the own key without params is the own type", () => {
    const copies = hopState(withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }), {
      typeName: COPY,
      kind: "list",
      name: "Copies",
      entitySetType: COPY,
      reRoot: { typeName: COPY, filter: { MediumId: 5 } },
    });
    expect(buildInvalidates(copies)).toEqual([
      [MEDIUM, "detail", 5],
      [COPY, "list"],
    ]);
  });

  test("an entry another entry is a prefix of is dropped", () => {
    const reservations = hopState(withKey(rootState(MEMBER, "list"), 42, { Id: 42 }), {
      typeName: RESERVATION,
      kind: "list",
      name: "Reservations",
      entitySetType: RESERVATION,
    });
    expect(buildInvalidates(withKey(reservations, 9, { Id: 9 }))).toEqual([
      [MEMBER, "detail", 42],
      [RESERVATION, "list"],
    ]);
  });

  test("a contained resource contributes no type entry", () => {
    const chapters = hopState(withKey(rootState(MEDIUM, "list"), 1, { Id: 1 }), {
      typeName: CHAPTER,
      kind: "list",
      name: "Chapters",
    });
    expect(buildInvalidates(withKey(chapters, 3, { Id: 3 }))).toEqual([[MEDIUM, "detail", 1]]);
  });

  test("two structurally equal key objects built independently compare as one entry", () => {
    // the prefix/dedup rule compares key elements by value, not by reference - two objects with the
    // same entries in a different insertion order are the same key
    const state = withKey(
      rootState(COPY, "list"),
      { MediumId: 5, InventoryNumber: 7 },
      { MediumId: 5, InventoryNumber: 7 },
    );
    const withOtherOrder = { ...state, ancestors: [[COPY, "detail", { InventoryNumber: 7, MediumId: 5 }]] };
    expect(buildInvalidates(withOtherOrder as typeof state)).toEqual([
      [COPY, "detail", { InventoryNumber: 7, MediumId: 5 }],
      [COPY, "list"],
    ]);
  });
});
