import { describe, expect, test } from "vitest";
import { CanonicalIdFn, hopState, QEntityFn, rootState, withKey, withParams } from "../../src/cacheKey";

const MEDIA = "Media";
const COPIES = "Copies";
const CHAPTERS = "chapters";

// a stand-in for a real Q-object factory: CacheKeyState never inspects its contents, only threads it
// forward, so identity comparison (toBe) is all any test here needs
const qMedium = (() => class {}) as unknown as QEntityFn;
const qCopy = (() => class {}) as unknown as QEntityFn;

// a stand-in for a generated `(key) => new QMediumId("Media").buildUrl(key)` closure
const canonicalIdOfMedia: CanonicalIdFn = (key) => `Media(${key.Id})`;
const canonicalIdOfCopies: CanonicalIdFn = (key) => `Copies(${key.Id})`;

describe("CacheKeyState", () => {
  test("a bare root has no entity set and no Q-object factory of its own - the singleton shape", () => {
    expect(rootState(MEDIA, "list")).toEqual({
      name: MEDIA,
      steps: ["list"],
      kindIndex: 0,
    });
  });

  test("a root carries the entity set name, canonical id builder and Q-object factory it is given", () => {
    expect(
      rootState(MEDIA, "list", { entitySetName: MEDIA, canonicalIdFn: canonicalIdOfMedia, qEntityFn: qMedium }),
    ).toEqual({
      name: MEDIA,
      steps: ["list"],
      kindIndex: 0,
      entitySetName: MEDIA,
      canonicalIdFn: canonicalIdOfMedia,
      qEntityFn: qMedium,
    });
  });

  test("a root carries params where given", () => {
    const state = rootState(MEDIA, "detail", { params: { singleton: "MainBranch" } });
    expect(state.params).toEqual({ singleton: "MainBranch" });
  });

  test("withKey rewrites the trailing kind marker, appends the typed key, and stores the given id for canonical-id purposes", () => {
    const state = withKey(rootState(MEDIA, "list"), 5, 5);
    expect(state.steps).toEqual(["detail", 5]);
    expect(state.key).toBe(5);
  });

  test("withKey on a composite key appends the object and stores it as the id too", () => {
    const key = { mediumId: 5, inventoryNumber: 7 };
    const state = withKey(rootState(COPIES, "list"), key, key);
    expect(state.steps).toEqual(["detail", key]);
    expect(state.key).toBe(key);
  });

  test("withKey pushes no ancestor - it refines the resource, it does not leave it", () => {
    expect(withKey(rootState(MEDIA, "list"), 5, { Id: 5 }).ancestors).toBeUndefined();
  });

  test("withKey carries params forward unchanged - there is no derived filter to drop any more", () => {
    const cast = withParams(rootState(COPIES, "list"), { cast: "Library.Catalog.Book" });
    const state = withKey(cast, { MediumId: 5, InventoryNumber: 7 }, { MediumId: 5, InventoryNumber: 7 });
    expect(state.params).toEqual({ cast: "Library.Catalog.Book" });
  });

  test("withParams merges into the resource's own params and pushes no ancestor", () => {
    const state = withParams(rootState(MEDIA, "list"), { cast: "Library.Catalog.Book" });
    expect(state.params).toEqual({ cast: "Library.Catalog.Book" });
    expect(state.ancestors).toBeUndefined();
  });

  test("a hop appends its own name and kind, and pushes the resource it leaves as an ancestor", () => {
    const parent = withKey(rootState(MEDIA, "list"), 5, { Id: 5 });
    const state = hopState(parent, {
      name: COPIES.toLowerCase(),
      kind: "list",
      entitySetName: COPIES,
      canonicalIdFn: canonicalIdOfCopies,
      qEntityFn: qCopy,
    });

    expect(state.name).toBe(MEDIA);
    expect(state.steps).toEqual(["detail", 5, "copies", "list"]);
    expect(state.ancestors).toEqual([[MEDIA, "detail", 5]]);
    expect(state.entitySetName).toBe(COPIES);
    expect(state.canonicalIdFn).toBe(canonicalIdOfCopies);
    expect(state.qEntityFn).toBe(qCopy);
    expect(state.key).toBeUndefined();
  });

  test("an ancestor is pushed without its params object", () => {
    const parent = withParams(withKey(rootState(MEDIA, "list"), 5, { Id: 5 }), { cast: "Library.Catalog.Book" });
    const state = hopState(parent, { name: "copies", kind: "list", entitySetName: COPIES });
    expect(state.ancestors).toEqual([[MEDIA, "detail", 5]]);
  });

  test("a hop to a contained property has no entity set, so entitySetName and canonicalIdFn stay undefined", () => {
    const parent = withKey(rootState(MEDIA, "list"), 1, { Id: 1 });
    const state = hopState(parent, { name: CHAPTERS, kind: "list" });
    expect(state.entitySetName).toBeUndefined();
    expect(state.canonicalIdFn).toBeUndefined();
  });

  test("a hop without a Q-object factory carries the parent's forward - it stays inert unless something reads it", () => {
    const parent = withKey(rootState(MEDIA, "list", { qEntityFn: qMedium }), 5, { Id: 5 });
    const state = hopState(parent, { name: "details", kind: "detail" });
    expect(state.qEntityFn).toBe(qMedium);
  });

  test("a hop's own Q-object factory replaces the parent's", () => {
    const parent = withKey(rootState(MEDIA, "list", { qEntityFn: qMedium }), 5, { Id: 5 });
    const state = hopState(parent, { name: "copies", kind: "list", qEntityFn: qCopy });
    expect(state.qEntityFn).toBe(qCopy);
  });

  test("a route continues hierarchically through several hops", () => {
    const media = withKey(rootState(MEDIA, "list"), 5, { Id: 5 });
    const copies = hopState(media, { name: "copies", kind: "list", entitySetName: COPIES });
    const copy = withKey(copies, { MediumId: 5, InventoryNumber: 7 }, { MediumId: 5, InventoryNumber: 7 });
    const condition = hopState(copy, { name: "condition", kind: "detail" });

    expect(condition.name).toBe(MEDIA);
    expect(condition.steps).toEqual([
      "detail",
      5,
      "copies",
      "detail",
      { MediumId: 5, InventoryNumber: 7 },
      "condition",
      "detail",
    ]);
    expect(condition.ancestors).toEqual([
      [MEDIA, "detail", 5],
      [MEDIA, "detail", 5, "copies", "detail", { MediumId: 5, InventoryNumber: 7 }],
    ]);
  });

  test("a primitive hop is the bare name, with no kind", () => {
    const parent = withKey(rootState("IdDocuments", "list"), "x", { Id: "x" });
    const state = hopState(parent, { name: "scan" });
    expect(state.steps).toEqual(["detail", "x", "scan"]);
  });

  test("a stream value appends $value", () => {
    const parent = withKey(rootState("IdDocuments", "list"), "x", { Id: "x" });
    const state = hopState(hopState(parent, { name: "scan" }), { name: "$value" });
    expect(state.steps).toEqual(["detail", "x", "scan", "$value"]);
  });

  test("withKey after a hop keeps the navigation property's own name", () => {
    const parent = withKey(rootState(MEDIA, "list"), 5, { Id: 5 });
    const copies = hopState(parent, { name: "copies", kind: "list", entitySetName: COPIES });
    const state = withKey(copies, 7, { InventoryNumber: 7 });
    expect(state.steps).toEqual(["detail", 5, "copies", "detail", 7]);
  });

  test("two sibling navigations of the same target entity set do not collide - each keeps its own name", () => {
    const parent = withKey(rootState(MEDIA, "list"), 5, { Id: 5 });
    const primary = withKey(hopState(parent, { name: "copies", kind: "list", entitySetName: COPIES }), 3, {
      InventoryNumber: 3,
    });
    const backup = withKey(hopState(parent, { name: "backupCopies", kind: "list", entitySetName: COPIES }), 3, {
      InventoryNumber: 3,
    });
    expect(primary.steps).not.toEqual(backup.steps);
  });

  test("a primitive hop does not move the kind index", () => {
    const parent = withKey(rootState("IdDocuments", "list"), "x", { Id: "x" });
    const state = hopState(parent, { name: "scan" });
    expect(state.kindIndex).toBe(parent.kindIndex);
  });

  test("a structured hop puts the kind index at the end, not two-from-the-end - there is no name slot after it any more", () => {
    const parent = withKey(rootState(MEDIA, "list"), 5, { Id: 5 });
    const state = hopState(parent, { name: "copies", kind: "list", entitySetName: COPIES });
    expect(state.kindIndex).toBe(state.steps.length - 1);
    expect(state.steps[state.kindIndex]).toBe("list");
  });
});
