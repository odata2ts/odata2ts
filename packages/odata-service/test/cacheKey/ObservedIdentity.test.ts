import { QBinding, QEntityCollectionPath, QId, QNumberParam, QueryObject } from "@odata2ts/odata-query-objects";
import { describe, expect, test } from "vitest";
import { CacheKeyState, recordObservedIdentities, resolveCrossRouteInvalidates, rootState } from "../../src/cacheKey";
import { MockResourceIdentityHandler } from "../mock/MockClient";

class QCopyId extends QId<any> {
  getParams() {
    return [new QNumberParam("Id", "id")];
  }
}
class QMediumId extends QId<any> {
  getParams() {
    return [new QNumberParam("Id", "id")];
  }
}

class QCopy extends QueryObject {}
class QMedium extends QueryObject {
  public readonly copies = new QEntityCollectionPath(
    this.withPrefix("Copies"),
    () => QCopy,
    new QBinding(() => new QCopyId("Copies"), "4.0"),
  );
}

/** A contained nav property has no QBinding, so no entity set and no canonical id of its own. */
class QChapter extends QueryObject {}
class QMediumWithContainedChapters extends QueryObject {
  public readonly chapters = new QEntityCollectionPath(this.withPrefix("Chapters"), () => QChapter);
}

function mediaState(overrides: Partial<CacheKeyState> = {}): CacheKeyState {
  return {
    ...rootState("Media", "detail", {
      entitySetName: "Media",
      canonicalIdFn: (entity) => new QMediumId("Media").buildCanonicalId(entity),
      qEntityFn: () => QMedium as any,
    }),
    ...overrides,
  };
}

describe("recordObservedIdentities", () => {
  test("no resourceIdentity: harmless", () => {
    expect(() => recordObservedIdentities(undefined, ["Media", "detail", 5], mediaState(), { id: 5 })).not.toThrow();
  });

  test("no hierarchical key (e.g. cacheKeys off): nothing recorded", () => {
    const handler = new MockResourceIdentityHandler();
    recordObservedIdentities(handler, undefined, mediaState(), { id: 5 });
    expect(handler.store.size).toBe(0);
  });

  test("records the directly addressed resource itself", () => {
    const handler = new MockResourceIdentityHandler();
    const key = ["Media", "detail", 5];
    recordObservedIdentities(handler, key, mediaState(), { id: 5, title: "The Trial" });
    expect(handler.resolve("Media(5)")).toEqual([key]);
  });

  test("records every row of a list response, against the same key", () => {
    // a real V4/V2 collection response is `{value: [...]}`, never a bare array itself
    const handler = new MockResourceIdentityHandler();
    const key = ["Media", "list"];
    recordObservedIdentities(handler, key, mediaState({ entitySetName: "Media" }), {
      value: [{ id: 1 }, { id: 2 }],
    });
    expect(handler.resolve("Media(1)")).toEqual([key]);
    expect(handler.resolve("Media(2)")).toEqual([key]);
  });

  test("records every row of a V2-wrapped list response too (`{d: {results: [...]}}`)", () => {
    const handler = new MockResourceIdentityHandler();
    const key = ["Media", "list"];
    recordObservedIdentities(handler, key, mediaState({ entitySetName: "Media" }), {
      d: { results: [{ id: 1 }, { id: 2 }] },
    });
    expect(handler.resolve("Media(1)")).toEqual([key]);
    expect(handler.resolve("Media(2)")).toEqual([key]);
  });

  test("records every row of a `{results: [...]}` list response too (V2 with the `d` envelope already stripped)", () => {
    const handler = new MockResourceIdentityHandler();
    const key = ["Media", "list"];
    recordObservedIdentities(handler, key, mediaState({ entitySetName: "Media" }), {
      results: [{ id: 1 }],
    });
    expect(handler.resolve("Media(1)")).toEqual([key]);
  });

  test("records every $expand'd entity too, at the same outer key - not a synthesized one", () => {
    const handler = new MockResourceIdentityHandler();
    const key = ["Media", "detail", 5, { expand: [["copies", "list"]] }];
    recordObservedIdentities(handler, key, mediaState(), { id: 5, copies: [{ id: 1 }, { id: 2 }] });
    expect(handler.resolve("Media(5)")).toEqual([key]);
    expect(handler.resolve("Copies(1)")).toEqual([key]);
    expect(handler.resolve("Copies(2)")).toEqual([key]);
  });

  test("a contained resource is never recorded - no canonicalIdFn, nothing to record against", () => {
    const handler = new MockResourceIdentityHandler();
    const state = mediaState({ qEntityFn: () => QMediumWithContainedChapters as any });
    recordObservedIdentities(handler, ["Media", "detail", 5, "chapters", "list"], state, {
      chapters: [{ id: 1 }],
    });
    expect(handler.store.size).toBe(0);
  });

  test("a row missing its key property is not recorded", () => {
    const handler = new MockResourceIdentityHandler();
    recordObservedIdentities(handler, ["Media", "detail", 5], mediaState(), { title: "no id here" });
    expect(handler.store.size).toBe(0);
  });
});

describe("resolveCrossRouteInvalidates", () => {
  test("no resourceIdentity: nothing to resolve", () => {
    expect(resolveCrossRouteInvalidates(undefined, mediaState(), { id: 5 })).toEqual([]);
  });

  test("no canonicalIdFn (a contained resource): nothing to resolve", () => {
    const handler = new MockResourceIdentityHandler();
    const state: CacheKeyState = { ...mediaState(), canonicalIdFn: undefined };
    expect(resolveCrossRouteInvalidates(handler, state, { id: 5 })).toEqual([]);
  });

  test("uses state.key when present - a PATCH/DELETE with no response body still resolves", () => {
    const handler = new MockResourceIdentityHandler();
    const otherRoute = ["SomeOther", "detail", 9, "media", "detail", 5];
    handler.record("Media(5)", otherRoute);

    const state = mediaState({ key: 5 });
    expect(resolveCrossRouteInvalidates(handler, state, undefined)).toEqual([otherRoute]);
  });

  test("falls back to the response body when state.key is absent - a POST's server-assigned id", () => {
    const handler = new MockResourceIdentityHandler();
    const otherRoute = ["SomeOther", "detail", 9, "media", "detail", 5];
    handler.record("Media(5)", otherRoute);

    const state = mediaState();
    expect(resolveCrossRouteInvalidates(handler, state, { id: 5, title: "The Trial" })).toEqual([otherRoute]);
  });

  test("unwraps a V2 `{d: {...}}` envelope before reading the response body's server-assigned id", () => {
    const handler = new MockResourceIdentityHandler();
    const otherRoute = ["SomeOther", "detail", 9, "media", "detail", 5];
    handler.record("Media(5)", otherRoute);

    const state = mediaState();
    expect(resolveCrossRouteInvalidates(handler, state, { d: { id: 5, title: "The Trial" } })).toEqual([
      otherRoute,
    ]);
  });

  test("state.key wins over the response body when both are present", () => {
    const handler = new MockResourceIdentityHandler();
    const otherRoute = ["SomeOther", "detail", 9, "media", "detail", 5];
    handler.record("Media(5)", otherRoute);

    const state = mediaState({ key: 5 });
    // the response body names a different id entirely - state.key must be what actually gets resolved
    expect(resolveCrossRouteInvalidates(handler, state, { id: 999 })).toEqual([otherRoute]);
  });

  test("a list body resolves nothing - a collection response names no single resource", () => {
    const handler = new MockResourceIdentityHandler();
    handler.record("Media(5)", ["SomeOther", "detail", 9]);

    const state = mediaState();
    expect(resolveCrossRouteInvalidates(handler, state, [{ id: 5 }])).toEqual([]);
  });

  test("nothing recorded for this canonical id yet: an empty array, not undefined", () => {
    const handler = new MockResourceIdentityHandler();
    expect(resolveCrossRouteInvalidates(handler, mediaState({ key: 5 }), undefined)).toEqual([]);
  });
});
