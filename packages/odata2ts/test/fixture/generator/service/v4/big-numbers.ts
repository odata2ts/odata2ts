import { ODataHttpClient } from "@odata2ts/http-client-api";
import { QBigNumberCollection, StringCollection, qBigNumberCollection } from "@odata2ts/odata-query-objects";
import { CollectionServiceV4, EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QTestEntity, QTestEntityId, qTestEntity } from "./QTester";
// @ts-ignore
import { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  constructor(client: ClientType, basePath: string) {
    super(client, basePath, true);
  }

  public ents(): TestEntityCollectionService<ClientType>;
  public ents(id: TestEntityId): TestEntityService<ClientType>;
  public ents(id?: TestEntityId | undefined) {
    const fieldName = "Ents";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName)
      : new TestEntityService(client, path, new QTestEntityId(fieldName).buildUrl(id));
  }
}

export class TestEntityService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  private _bigNumberCollection?: CollectionServiceV4<ClientType, StringCollection, QBigNumberCollection>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity, true);
  }

  public bigNumberCollection() {
    if (!this._bigNumberCollection) {
      const { client, path } = this.__base;
      this._bigNumberCollection = new CollectionServiceV4(
        client,
        path,
        "bigNumberCollection",
        qBigNumberCollection,
        true
      );
    }

    return this._bigNumberCollection;
  }
}

export class TestEntityCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), true);
  }
}
