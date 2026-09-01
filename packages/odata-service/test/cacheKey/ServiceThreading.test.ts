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

type TestEntityService = EntityTypeServiceV4<TestModel, EditableTestModel, QTest, "4.0">;

/**
 * A minimal `EntitySetServiceV4` around a given id function, built here rather than via the shared
 * `TestCollectionService`/`TestCollectionServiceWithAlternateKey` fixtures: neither fixture's constructor
 * forwards a `cacheKeyState`, and reshaping them to do so would touch fixtures other tests already rely on.
 * `createEntityService` just needs to hand the state to *some* entity-type service, so a bare
 * `EntityTypeServiceV4` does the job without a fixture-specific subclass.
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
    return new EntityTypeServiceV4(client, path, name, qTest, options, cacheKeyState);
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

    const state = service.byId({ mediumId: 5, inventoryNumber: 7 }).getCacheKeyState()!;
    expect(state.steps).toEqual(["detail", { MediumId: 5, InventoryNumber: 7 }]);
    expect(state.keyValues).toEqual({ MediumId: 5, InventoryNumber: 7 });
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
