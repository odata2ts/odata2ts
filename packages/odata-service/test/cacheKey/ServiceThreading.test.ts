import { ODataHttpClient } from "@odata2ts/http-client-api";
import { QId, QNumberParam } from "@odata2ts/odata-query-objects";
import { describe, expect, test } from "vitest";
import { CacheKeyState, EntitySetServiceV4, EntityTypeServiceV4, ODataServiceOptionsInternal } from "../../src";
import { rootState } from "../../src/cacheKey/index.js";
import {
  EditableTestModel,
  qTest,
  QTest,
  QTestIdFunction,
  QTestIdWithAlternateKeyFunction,
  TestModel,
  TestModelId,
  TestModelIdWithAlternateKey,
} from "../fixture/v4/TypingModelService";
import { MockClient } from "../mock/MockClient";

const MEDIUM = "Library.Catalog.Medium";
const COPY = "Library.Catalog.Copy";

/**
 * The real, published `EntityTypeServiceV4` no longer exposes its `CacheKeyState` (see the removed
 * `getCacheKeyState()`, replaced by the narrow `getEntitySetName()`) - `steps`/`key` are internal wiring,
 * asserted on here the same way `ServiceStateHelper`'s own tests reach protected internals: a test-local
 * subclass, never shipped, with its own accessor onto `__base`.
 */
class TestEntityService extends EntityTypeServiceV4<TestModel, EditableTestModel, QTest, "4.0"> {
  public getCacheKeyState() {
    return this.__base.cacheKeyState;
  }
}

/**
 * A minimal `EntitySetServiceV4` around a given id function, built here rather than via the shared
 * `TestCollectionService`/`TestCollectionServiceWithAlternateKey` fixtures: neither fixture's constructor
 * forwards a `cacheKeyState`, and reshaping them to do so would touch fixtures other tests already rely on.
 * `createEntityService` just needs to hand the state to *some* entity-type service, so `TestEntityService`
 * does the job.
 */
class TestSetService<EIdType> extends EntitySetServiceV4<
  TestModel,
  EditableTestModel,
  QTest,
  EIdType,
  TestEntityService
> {
  constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    idFunction: QId<EIdType>,
    cacheKeyState?: CacheKeyState,
  ) {
    super(client, basePath, name, qTest, idFunction, undefined, cacheKeyState);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<"4.0"> | undefined,
    cacheKeyState?: CacheKeyState,
  ): TestEntityService {
    return new TestEntityService(client, path, name, qTest, options, cacheKeyState);
  }
}

/**
 * A composite primary key, constructed here rather than borrowed from a shared fixture: no fixture in
 * this package declares a multi-property primary key.
 */
type CompositeId = { mediumId: number; inventoryNumber: number };

class QCompositeIdFunction extends QId<CompositeId> {
  getParams() {
    return [new QNumberParam("MediumId", "mediumId"), new QNumberParam("InventoryNumber", "inventoryNumber")];
  }
}

describe("byId produces the typed key, not the rendered predicate", () => {
  const client = new MockClient(false);

  test("a single key travels bare", () => {
    const service = new TestSetService<TestModelId>(
      client,
      "/root",
      "Media",
      new QTestIdFunction("Media"),
      rootState(MEDIUM, "list"),
    );

    expect(service.byId("5").getCacheKeyState()!.steps).toEqual(["detail", 5]);
  });

  test("a composite key travels as an object of OData names", () => {
    const service = new TestSetService<CompositeId>(
      client,
      "/root",
      "Copies",
      new QCompositeIdFunction("Copies"),
      rootState(COPY, "list"),
    );

    const id = { mediumId: 5, inventoryNumber: 7 };
    const state = service.byId(id).getCacheKeyState()!;
    expect(state.steps).toEqual(["detail", { MediumId: 5, InventoryNumber: 7 }]);
    // .key stores the id exactly as byId received it - mapped names, for canonical-id purposes - not the
    // OData-named form .steps carries
    expect(state.key).toBe(id);
  });

  test("an alternate key travels as its own object", () => {
    const service = new TestSetService<TestModelIdWithAlternateKey>(
      client,
      "/root",
      "Media",
      new QTestIdWithAlternateKeyFunction("Media"),
      rootState(MEDIUM, "list"),
    );

    const state = service.byId({ name: "978-3" }).getCacheKeyState()!;
    expect(state.steps).toEqual(["detail", { NAME: "978-3" }]);
  });
});

describe("getEntitySetName - the one narrow accessor a generated service exposes publicly", () => {
  const client = new MockClient(false);

  test("reflects the root's own entity set", () => {
    const service = new TestSetService<TestModelId>(
      client,
      "/root",
      "Media",
      new QTestIdFunction("Media"),
      rootState(MEDIUM, "list", { entitySetName: "Media" }),
    );

    expect(service.getEntitySetName()).toBe("Media");
  });

  test("is undefined where the route was never threaded with cache-key state at all", () => {
    const service = new TestSetService<TestModelId>(client, "/root", "Media", new QTestIdFunction("Media"));

    expect(service.getEntitySetName()).toBeUndefined();
  });

  test("survives byId() unchanged - narrowing to one entity does not leave its entity set", () => {
    const service = new TestSetService<TestModelId>(
      client,
      "/root",
      "Media",
      new QTestIdFunction("Media"),
      rootState(MEDIUM, "list", { entitySetName: "Media" }),
    );

    expect(service.byId("5").getEntitySetName()).toBe("Media");
  });
});
