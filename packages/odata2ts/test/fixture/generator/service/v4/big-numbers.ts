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
// @ts-ignore
import type { QTestEntity } from "./QTester.js";
// @ts-ignore
import { qTestEntity, QTestEntityId } from "./QTester.js";
// @ts-ignore
import type { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel.js";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  constructor(client: ClientType, basePath: string, options?: ODataServiceOptions) {
    super(client, basePath, { ...options, bigNumbersAsString: true });
  }

  public ents(): TestEntityCollectionService<ClientType>;
  public ents(id: TestEntityId): TestEntityService<ClientType>;
  public ents(id?: TestEntityId | undefined) {
    const fieldName = "Ents";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName, options)
      : new TestEntityService(client, path, new QTestEntityId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class TestEntityService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntityTypeServiceV4<ClientType, TestEntity, EditableTestEntity, QTestEntity, V> {
  private _bigNumberCollection?: CollectionServiceV4<
    ClientType,
    StringCollection,
    QBigNumberCollection,
    PrimitiveExtractor<StringCollection>,
    V
  >;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
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

export class TestEntityCollectionService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntitySetServiceV4<ClientType, TestEntity, EditableTestEntity, QTestEntity, TestEntityId, V> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }
}
