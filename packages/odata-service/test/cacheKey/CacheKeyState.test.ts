import { describe, expect, test } from "vitest";
import { hopState, ownFqNameOf, reRootToEntity, rootState, withKey, withParams } from "../../src/cacheKey";

const MEDIUM = "Library.Catalog.Medium";
const COPY = "Library.Circulation.Copy";
const CHAPTER = "Library.Catalog.AudiobookChapter";

describe("CacheKeyState", () => {
  test("a root is the entity set's type plus a kind marker", () => {
    expect(rootState(MEDIUM, "list")).toEqual({
      typeName: MEDIUM,
      steps: ["list"],
      kindIndex: 0,
      navHops: {},
      resourceType: MEDIUM,
    });
  });

  test("withKey rewrites the trailing kind marker and appends the typed key", () => {
    const state = withKey(rootState(MEDIUM, "list"), 5, { Id: 5 });
    expect(state.steps).toEqual(["detail", 5]);
    expect(state.keyValues).toEqual({ Id: 5 });
  });

  test("withKey on a composite key appends the object", () => {
    const key = { MediumId: 5, InventoryNumber: 7 };
    const state = withKey(rootState(COPY, "list"), key, key);
    expect(state.steps).toEqual(["detail", key]);
  });

  test("withKey pushes no ancestor - it refines the resource, it does not leave it", () => {
    expect(withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }).ancestors).toBeUndefined();
  });

  test("withKey drops a derived filter, since the key supersedes it", () => {
    const flattened = withParams(rootState(COPY, "list"), { filter: { MediumId: 5 } });
    const state = withKey(flattened, { MediumId: 5, InventoryNumber: 7 }, { MediumId: 5, InventoryNumber: 7 });
    expect(state.params).toBeUndefined();
  });

  test("withParams merges into the resource's own params and pushes no ancestor", () => {
    const state = withParams(rootState(MEDIUM, "list"), { cast: "Library.Catalog.Book" });
    expect(state.params).toEqual({ cast: "Library.Catalog.Book" });
    expect(state.ancestors).toBeUndefined();
  });

  test("a hierarchical hop appends and pushes the resource it leaves as an ancestor", () => {
    const parent = withKey(rootState(MEDIUM, "list"), 5, { Id: 5 });
    const state = hopState(parent, { typeName: COPY, kind: "list", name: "Copies", entitySetType: COPY });

    expect(state.typeName).toBe(MEDIUM);
    expect(state.steps).toEqual(["detail", 5, COPY, "list", "Copies"]);
    expect(state.ancestors).toEqual([[MEDIUM, "detail", 5]]);
    expect(state.resourceType).toBe(COPY);
    expect(state.keyValues).toBeUndefined();
  });

  test("an ancestor is pushed without its params object", () => {
    const parent = withParams(withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }), { cast: "Library.Catalog.Book" });
    const state = hopState(parent, { typeName: COPY, kind: "list", name: "Copies", entitySetType: COPY });
    expect(state.ancestors).toEqual([[MEDIUM, "detail", 5]]);
  });

  test("a re-rooted hop resets type, steps and params but keeps ancestors", () => {
    const parent = withKey(rootState(MEDIUM, "list"), 5, { Id: 5 });
    const state = hopState(parent, {
      typeName: COPY,
      kind: "list",
      name: "Copies",
      entitySetType: COPY,
      reRoot: { typeName: COPY, filter: { MediumId: 5 } },
    });

    expect(state.typeName).toBe(COPY);
    expect(state.steps).toEqual(["list"]);
    expect(state.params).toEqual({ filter: { MediumId: 5 } });
    expect(state.ancestors).toEqual([[MEDIUM, "detail", 5]]);
  });

  test("a re-rooted hop carries a cast where the nav property is narrower than its entity set", () => {
    const parent = withKey(rootState("PublisherRegistry.Publisher", "list"), 7, { Id: 7 });
    const state = hopState(parent, {
      typeName: "Library.Catalog.Book",
      kind: "list",
      name: "Books",
      entitySetType: MEDIUM,
      reRoot: { typeName: MEDIUM, filter: { "Publisher/Id": 7 }, cast: "Library.Catalog.Book" },
    });

    expect(state.typeName).toBe(MEDIUM);
    expect(state.params).toEqual({ filter: { "Publisher/Id": 7 }, cast: "Library.Catalog.Book" });
  });

  test("a contained hop has no entity set, so resourceType stays undefined", () => {
    const parent = withKey(rootState(MEDIUM, "list"), 1, { Id: 1 });
    const state = hopState(parent, { typeName: CHAPTER, kind: "list", name: "Chapters" });
    expect(state.resourceType).toBeUndefined();
  });

  test("a route may re-root, then continue hierarchically", () => {
    const medium = withKey(rootState(MEDIUM, "list"), 5, { Id: 5 });
    const copies = hopState(medium, {
      typeName: COPY,
      kind: "list",
      name: "Copies",
      entitySetType: COPY,
      reRoot: { typeName: COPY, filter: { MediumId: 5 } },
    });
    const copy = withKey(copies, { MediumId: 5, InventoryNumber: 7 }, { MediumId: 5, InventoryNumber: 7 });
    const condition = hopState(copy, {
      typeName: "Library.Catalog.AvailabilityStatus",
      kind: "detail",
      name: "Condition",
    });

    expect(condition.typeName).toBe(COPY);
    expect(condition.steps).toEqual([
      "detail",
      { MediumId: 5, InventoryNumber: 7 },
      "Library.Catalog.AvailabilityStatus",
      "detail",
      "Condition",
    ]);
    expect(condition.ancestors).toEqual([
      [MEDIUM, "detail", 5],
      [COPY, "detail", { MediumId: 5, InventoryNumber: 7 }],
    ]);
  });

  test("reRootToEntity re-roots at a fully known target key, not at a filtered collection", () => {
    const copy = withKey(
      rootState(COPY, "list"),
      { MediumId: 5, InventoryNumber: 7 },
      { MediumId: 5, InventoryNumber: 7 },
    );
    const state = reRootToEntity(copy, MEDIUM, { Id: 5 });

    expect(state.typeName).toBe(MEDIUM);
    expect(state.steps).toEqual(["detail", 5]);
    expect(state.keyValues).toEqual({ Id: 5 });
    expect(state.params).toBeUndefined();
    expect(state.resourceType).toBe(MEDIUM);
  });

  test("reRootToEntity keeps ancestors and pushes the resource it leaves", () => {
    const copy = withKey(
      rootState(COPY, "list"),
      { MediumId: 5, InventoryNumber: 7 },
      { MediumId: 5, InventoryNumber: 7 },
    );
    const state = reRootToEntity(copy, MEDIUM, { Id: 5 });
    expect(state.ancestors).toEqual([[COPY, "detail", { MediumId: 5, InventoryNumber: 7 }]]);
  });

  test("reRootToEntity wraps a composite target key as an object", () => {
    const loan = withKey(rootState("Library.Circulation.Loan", "list"), 1, { Id: 1 });
    const state = reRootToEntity(loan, COPY, { MediumId: 5, InventoryNumber: 7 });
    expect(state.steps).toEqual(["detail", { MediumId: 5, InventoryNumber: 7 }]);
  });

  test("a primitive hop is the bare name", () => {
    const parent = withKey(rootState("Library.Circulation.IdDocument", "list"), "x", { Id: "x" });
    const state = hopState(parent, { name: "Scan" });
    expect(state.steps).toEqual(["detail", "x", "Scan"]);
  });

  test("a stream value appends $value", () => {
    const parent = withKey(rootState("Library.Circulation.IdDocument", "list"), "x", { Id: "x" });
    const state = hopState(hopState(parent, { name: "Scan" }), { name: "$value" });
    expect(state.steps).toEqual(["detail", "x", "Scan", "$value"]);
  });

  test("withKey after a hierarchical hop keeps the navigation property name", () => {
    const parent = withKey(rootState(MEDIUM, "list"), 5, { Id: 5 });
    const copies = hopState(parent, { typeName: COPY, kind: "list", name: "Copies", entitySetType: COPY });
    const state = withKey(copies, 7, { InventoryNumber: 7 });
    expect(state.steps).toEqual(["detail", 5, COPY, "detail", "Copies", 7]);
  });

  test("two sibling navigations of the same target type do not collide", () => {
    const parent = withKey(rootState(MEDIUM, "list"), 5, { Id: 5 });
    const primary = withKey(
      hopState(parent, { typeName: COPY, kind: "list", name: "Copies", entitySetType: COPY }),
      3,
      { InventoryNumber: 3 },
    );
    const backup = withKey(
      hopState(parent, { typeName: COPY, kind: "list", name: "BackupCopies", entitySetType: COPY }),
      3,
      { InventoryNumber: 3 },
    );
    expect(primary.steps).not.toEqual(backup.steps);
  });

  test("a route that re-roots and then takes a key still puts the marker at 0", () => {
    const parent = withKey(rootState(MEDIUM, "list"), 5, { Id: 5 });
    const copies = hopState(parent, {
      typeName: COPY,
      kind: "list",
      name: "Copies",
      entitySetType: COPY,
      reRoot: { typeName: COPY, filter: { MediumId: 5 } },
    });
    const copy = withKey(copies, { MediumId: 5, InventoryNumber: 7 }, { MediumId: 5, InventoryNumber: 7 });
    expect(copy.steps).toEqual(["detail", { MediumId: 5, InventoryNumber: 7 }]);
  });

  test("a primitive hop does not move the kind index", () => {
    const parent = withKey(rootState("Library.Circulation.IdDocument", "list"), "x", { Id: "x" });
    const state = hopState(parent, { name: "Scan" });
    expect(state.kindIndex).toBe(parent.kindIndex);
  });

  test("withKey drops a derived filter but keeps a sibling params entry", () => {
    const flattened = withParams(rootState(COPY, "list"), {
      filter: { MediumId: 5 },
      cast: "Library.Catalog.Book",
    });
    const state = withKey(flattened, { MediumId: 5, InventoryNumber: 7 }, { MediumId: 5, InventoryNumber: 7 });
    expect(state.params).toEqual({ cast: "Library.Catalog.Book" });
  });
});

describe("navHops", () => {
  const HOPS = { [MEDIUM]: { copies: [COPY, "list", "Copies"] as const } };

  test("rootState defaults navHops to an empty table", () => {
    expect(rootState(MEDIUM, "list").navHops).toEqual({});
  });

  test("rootState carries the given table", () => {
    expect(rootState(MEDIUM, "list", { navHops: HOPS }).navHops).toBe(HOPS);
  });

  test("withKey and withParams carry it forward unchanged", () => {
    const root = rootState(MEDIUM, "list", { navHops: HOPS });
    expect(withKey(root, 5, { Id: 5 }).navHops).toBe(HOPS);
    expect(withParams(root, { cast: "x" }).navHops).toBe(HOPS);
  });

  test("hopState carries it forward, both the plain-hop and the re-rooted branch", () => {
    const root = rootState(MEDIUM, "list", { navHops: HOPS });
    const plainHop = hopState(withKey(root, 5, { Id: 5 }), { typeName: COPY, kind: "list", name: "Copies" });
    expect(plainHop.navHops).toBe(HOPS);

    const reRootedHop = hopState(withKey(root, 5, { Id: 5 }), {
      typeName: COPY,
      kind: "list",
      name: "Copies",
      reRoot: { typeName: COPY, filter: { MediumId: 5 } },
    });
    expect(reRootedHop.navHops).toBe(HOPS);
  });

  test("reRootToEntity carries it forward", () => {
    const root = rootState(COPY, "list", { navHops: HOPS });
    const state = withKey(root, { MediumId: 5, InventoryNumber: 7 }, { MediumId: 5, InventoryNumber: 7 });
    expect(reRootToEntity(state, MEDIUM, { Id: 5 }).navHops).toBe(HOPS);
  });
});

describe("ownFqNameOf", () => {
  test("at the root, the type name is already correct", () => {
    expect(ownFqNameOf(rootState(MEDIUM, "list"))).toBe(MEDIUM);
  });

  test("a cast wins over everything else", () => {
    const state = withParams(rootState(MEDIUM, "list"), { cast: "Library.Catalog.Book" });
    expect(ownFqNameOf(state)).toBe("Library.Catalog.Book");
  });

  test("after a hierarchical hop, the hop's own type wins - not the route's root", () => {
    const state = hopState(withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }), {
      typeName: COPY,
      kind: "list",
      name: "Copies",
      entitySetType: COPY,
    });
    expect(ownFqNameOf(state)).toBe(COPY);
  });

  test("after a re-root, the new type name is already correct", () => {
    const state = hopState(withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }), {
      typeName: COPY,
      kind: "list",
      name: "Copies",
      reRoot: { typeName: COPY, filter: { MediumId: 5 } },
    });
    expect(ownFqNameOf(state)).toBe(COPY);
  });

  test("a hop to a contained entity has no resourceType, but its own type is still findable", () => {
    const state = hopState(withKey(rootState(MEDIUM, "list"), 1, { Id: 1 }), {
      typeName: CHAPTER,
      kind: "list",
      name: "Chapters",
    });
    expect(state.resourceType).toBeUndefined();
    expect(ownFqNameOf(state)).toBe(CHAPTER);
  });
});
