import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QAbstractEntityId, QTestEntity, qTestEntity } from "./QTester";
// @ts-ignore
import { AbstractEntityId, EditableTestEntity, TestEntity } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public testing(): TestEntityCollectionService<ClientType>;
  public testing(id: AbstractEntityId): TestEntityService<ClientType>;
  public testing(id?: AbstractEntityId | undefined) {
    const fieldName = "Testing";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName)
      : new TestEntityService(client, path, new QAbstractEntityId(fieldName).buildUrl(id));
  }
}

export class TestEntityService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity);
  }
}

export class TestEntityCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  AbstractEntityId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity, new QAbstractEntityId(name));
  }
}
