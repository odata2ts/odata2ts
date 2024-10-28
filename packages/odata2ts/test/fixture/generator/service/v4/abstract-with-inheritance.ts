import type { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QAbstractEntity, QTestEntity } from "./QTester";
// @ts-ignore
import { qAbstractEntity, QAbstractEntityId, qTestEntity } from "./QTester";
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
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName, options)
      : new TestEntityService(client, path, new QAbstractEntityId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class AbstractEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  AbstractEntity,
  EditableAbstractEntity,
  QAbstractEntity
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qAbstractEntity, options);
  }

  public asTestEntityService() {
    const { client, path, options } = this.__base;
    options.subtype = true;
    return new TestEntityService(client, path, "Tester.TestEntity", options);
  }
}

export class AbstractEntityCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  AbstractEntity,
  EditableAbstractEntity,
  QAbstractEntity,
  AbstractEntityId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qAbstractEntity, new QAbstractEntityId(name), options);
  }

  public asTestEntityCollectionService() {
    const { client, path, options } = this.__base;
    options.subtype = true;
    return new TestEntityCollectionService(client, path, "Tester.TestEntity", options);
  }
}

export class TestEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qTestEntity, options);
  }
}

export class TestEntityCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  AbstractEntityId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qTestEntity, new QAbstractEntityId(name), options);
  }
}
