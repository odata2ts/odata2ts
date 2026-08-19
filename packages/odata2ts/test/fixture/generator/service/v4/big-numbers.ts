import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import type { StringCollection } from "@odata2ts/odata-query-objects";
import { QBigNumberCollection } from "@odata2ts/odata-query-objects";
import {
  CollectionServiceV4,
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptions,
  ODataServiceOptionsInternal,
  PrimitiveExtractor,
} from "@odata2ts/odata-service";
import type { QTestEntity } from "./QTester.js";
import { qTestEntity, QTestEntityId } from "./QTester.js";
import type { EditableTestEntity, TestEntity, TestEntityId, UpdatableTestEntity } from "./TesterModel.js";

export class TesterService extends ODataService {
  constructor(client: ODataHttpClient, basePath: string, options?: ODataServiceOptions) {
    super(client, basePath, { ...options, bigNumbersAsString: true });
  }

  public ents(): TestEntityCollectionService;
  public ents(id: TestEntityId): TestEntityService;
  public ents(id?: TestEntityId | undefined) {
    const fieldName = "Ents";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName, options)
      : new TestEntityService(client, path, new QTestEntityId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class TestEntityService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  TestEntity,
  UpdatableTestEntity,
  QTestEntity,
  V
> {
  private _bigNumberCollection?: CollectionServiceV4<
    StringCollection,
    QBigNumberCollection,
    PrimitiveExtractor<StringCollection>,
    V
  >;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, options);
  }

  public bigNumberCollection() {
    if (!this._bigNumberCollection) {
      const { client, path, options } = this.__base;
      this._bigNumberCollection = new CollectionServiceV4(
        client,
        path,
        "bigNumberCollection",
        new QBigNumberCollection(),
        options,
      );
    }

    return this._bigNumberCollection;
  }
}

export class TestEntityCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }
}
