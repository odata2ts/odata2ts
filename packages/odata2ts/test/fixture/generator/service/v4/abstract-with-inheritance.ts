import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QAbstractEntity, QAbstractEntityId, QTestEntity, qAbstractEntity, qTestEntity } from "./QTester";
import type {
  AbstractEntity,
  AbstractEntityId,
  EditableAbstractEntity,
  EditableTestEntity,
  TestEntity,
  // @ts-ignore
} from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
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

export class AbstractEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  AbstractEntity,
  EditableAbstractEntity,
  QAbstractEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qAbstractEntity);
  }
}

export class AbstractEntityCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  AbstractEntity,
  EditableAbstractEntity,
  QAbstractEntity,
  AbstractEntityId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qAbstractEntity, new QAbstractEntityId(name));
  }
}

export class TestEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity);
  }
}

export class TestEntityCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
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
