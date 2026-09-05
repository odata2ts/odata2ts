import { describe, expect, test } from "vitest";
import { buildCacheKey, buildInvalidates, hopState, rootState, withKey, withParams } from "../../src/cacheKey";

const MEDIA = "Media";
const COPIES = "Copies";
const MEMBERS = "Members";
const RESERVATIONS = "Reservations";
const LOANS = "Loans";

describe("buildCacheKey", () => {
  test("an entity set collection", () => {
    expect(buildCacheKey(rootState(MEDIA, "list"))).toEqual([MEDIA, "list"]);
  });

  test("query params become the trailing object", () => {
    expect(buildCacheKey(rootState(MEDIA, "list"), { top: 10, select: ["Title"] })).toEqual([
      MEDIA,
      "list",
      { top: 10, select: ["Title"] },
    ]);
  });

  test("an empty params object is dropped entirely", () => {
    expect(buildCacheKey(rootState(MEDIA, "list"), {})).toEqual([MEDIA, "list"]);
    expect(buildCacheKey(rootState(MEDIA, "list"), undefined)).toEqual([MEDIA, "list"]);
  });

  test("an entity by key", () => {
    expect(buildCacheKey(withKey(rootState(MEDIA, "list"), 5, { Id: 5 }))).toEqual([MEDIA, "detail", 5]);
  });

  test("a composite key travels as an object", () => {
    const key = { MediumId: 5, InventoryNumber: 7 };
    expect(buildCacheKey(withKey(rootState(COPIES, "list"), key, key))).toEqual([COPIES, "detail", key]);
  });

  test("a singleton - its own name is the root directly, no params marker needed", () => {
    expect(buildCacheKey(rootState("MainBranch", "detail"))).toEqual(["MainBranch", "detail"]);
  });

  test("a cast is a params entry - the one place a type still legitimately appears, since it is a real URL segment", () => {
    const state = withParams(rootState(MEDIA, "list"), { cast: "Library.Catalog.Book" });
    expect(buildCacheKey(state)).toEqual([MEDIA, "list", { cast: "Library.Catalog.Book" }]);
  });

  test("a navigation hop is named by the property's own OData name, never a type", () => {
    const state = hopState(withKey(rootState(MEDIA, "list"), 5, { Id: 5 }), {
      name: "copies",
      kind: "list",
      entitySetName: COPIES,
    });
    expect(buildCacheKey(state)).toEqual([MEDIA, "detail", 5, "copies", "list"]);
  });

  test("the state's own params and the query params merge", () => {
    const state = withParams(rootState(MEDIA, "list"), { cast: "Library.Catalog.Book" });
    expect(buildCacheKey(state, { top: 10 })).toEqual([MEDIA, "list", { cast: "Library.Catalog.Book", top: 10 }]);
  });

  test("an unbound operation with no result entity set is rooted at the import's own name, never a type", () => {
    const key = buildCacheKey(rootState("TotalMediaCount", "detail"));
    expect(key).toEqual(["TotalMediaCount", "detail"]);
  });

  test("an unbound operation still carries its invocation params, nested under their own key", () => {
    const key = buildCacheKey(rootState("Search", "list", { params: { params: { term: "Kafka" } } }));
    expect(key).toEqual(["Search", "list", { params: { term: "Kafka" } }]);
  });
});

describe("buildInvalidates", () => {
  test("a write to a root entity: own key and own entity set, coarsest first", () => {
    const state = withKey(rootState(MEDIA, "list", { entitySetName: MEDIA }), 5, { Id: 5 });
    expect(buildInvalidates(state)).toEqual([
      [MEDIA, "detail", 5],
      [MEDIA, "list"],
    ]);
  });

  test("the own key is taken without its params object", () => {
    const state = withParams(withKey(rootState(MEDIA, "list", { entitySetName: MEDIA }), 5, { Id: 5 }), {
      cast: "Library.Catalog.Book",
    });
    expect(buildInvalidates(state)).toContainEqual([MEDIA, "detail", 5]);
  });

  test("a hierarchical write's own key is a prefix-redundant with its ancestor, and drops out - the ancestor and the entity-set list entry are what remain", () => {
    const copies = hopState(withKey(rootState(MEDIA, "list", { entitySetName: MEDIA }), 5, { Id: 5 }), {
      name: "copies",
      kind: "list",
      entitySetName: COPIES,
    });
    const key = { MediumId: 5, InventoryNumber: 7 };
    expect(buildInvalidates(withKey(copies, key, key))).toEqual([
      [MEDIA, "detail", 5],
      [COPIES, "list"],
    ]);
  });

  test("a POST to a hierarchical collection: the own key without a key value is the ancestor plus the entity-set list", () => {
    const copies = hopState(withKey(rootState(MEDIA, "list", { entitySetName: MEDIA }), 5, { Id: 5 }), {
      name: "copies",
      kind: "list",
      entitySetName: COPIES,
    });
    expect(buildInvalidates(copies)).toEqual([
      [MEDIA, "detail", 5],
      [COPIES, "list"],
    ]);
  });

  test("an entry another entry is a prefix of is dropped", () => {
    const reservations = hopState(withKey(rootState(MEMBERS, "list", { entitySetName: MEMBERS }), 42, { Id: 42 }), {
      name: "reservations",
      kind: "list",
      entitySetName: RESERVATIONS,
    });
    expect(buildInvalidates(withKey(reservations, 9, { Id: 9 }))).toEqual([
      [MEMBERS, "detail", 42],
      [RESERVATIONS, "list"],
    ]);
  });

  test("a contained resource contributes no entity-set entry", () => {
    const chapters = hopState(withKey(rootState(MEDIA, "list", { entitySetName: MEDIA }), 1, { Id: 1 }), {
      name: "chapters",
      kind: "list",
    });
    expect(buildInvalidates(withKey(chapters, 3, { Id: 3 }))).toEqual([[MEDIA, "detail", 1]]);
  });

  test("two structurally equal key objects built independently compare as one entry", () => {
    // the prefix/dedup rule compares key elements by value, not by reference - two objects with the
    // same entries in a different insertion order are the same key
    const state = withKey(
      rootState(COPIES, "list", { entitySetName: COPIES }),
      { MediumId: 5, InventoryNumber: 7 },
      { MediumId: 5, InventoryNumber: 7 },
    );
    const withOtherOrder = { ...state, ancestors: [[COPIES, "detail", { InventoryNumber: 7, MediumId: 5 }]] };
    expect(buildInvalidates(withOtherOrder as typeof state)).toEqual([
      [COPIES, "detail", { InventoryNumber: 7, MediumId: 5 }],
      [COPIES, "list"],
    ]);
  });

  test("deepEdit params contribute an additional bare entity-set entry per deep-inserted set", () => {
    const state = withParams(rootState(MEMBERS, "list", { entitySetName: MEMBERS }), {
      deepEdit: [LOANS],
    });
    expect(buildInvalidates(state)).toEqual([
      [MEMBERS, "list"],
      [LOANS, "list"],
    ]);
  });

  test("a deepEdit hop matching the write's own entity set collapses via the existing redundancy pass", () => {
    const state = withParams(rootState(MEMBERS, "list", { entitySetName: MEMBERS }), {
      deepEdit: [MEMBERS],
    });
    expect(buildInvalidates(state)).toEqual([[MEMBERS, "list"]]);
  });

  test("multiple different deepEdit hops each contribute their own entry", () => {
    expect(
      buildInvalidates(
        withParams(rootState(MEMBERS, "list", { entitySetName: MEMBERS }), {
          deepEdit: [LOANS, RESERVATIONS],
        }),
      ),
    ).toEqual([
      [MEMBERS, "list"],
      [LOANS, "list"],
      [RESERVATIONS, "list"],
    ]);
  });

  test("crossRouteKeys - a route to this same resource resolved via ResourceIdentityHandler - are added alongside the route-derived entries", () => {
    const state = withKey(rootState(MEDIA, "list", { entitySetName: MEDIA }), 5, { Id: 5 });
    const crossRoute = ["Library.Circulation.Loan", "detail", 1, "medium", "detail", 5];
    expect(buildInvalidates(state, [crossRoute])).toEqual([[MEDIA, "detail", 5], [MEDIA, "list"], crossRoute]);
  });

  test("a crossRouteKey identical to an already-listed entry collapses via the same redundancy pass", () => {
    const state = withKey(rootState(MEDIA, "list", { entitySetName: MEDIA }), 5, { Id: 5 });
    expect(buildInvalidates(state, [[MEDIA, "list"]])).toEqual([
      [MEDIA, "detail", 5],
      [MEDIA, "list"],
    ]);
  });

  test("no crossRouteKeys given: behaves exactly as before", () => {
    const state = withKey(rootState(MEDIA, "list", { entitySetName: MEDIA }), 5, { Id: 5 });
    expect(buildInvalidates(state)).toEqual(buildInvalidates(state, []));
  });
});
