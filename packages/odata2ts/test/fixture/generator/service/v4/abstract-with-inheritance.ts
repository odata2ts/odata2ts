import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QAbstractEntity, QTestEntity } from "./QTester.js";
// @ts-ignore
import { qAbstractEntity, QAbstractEntityId, qTestEntity } from "./QTester.js";
import type {
  AbstractEntity,
  AbstractEntityId,
  EditableAbstractEntity,
  EditableTestEntity,
  TestEntity,
  // @ts-ignore
} from "./TesterModel.js";

export class TesterService extends ODataService {
  public testing(): TestEntityCollectionService;
  public testing(id: AbstractEntityId): TestEntityService;
  public testing(id?: AbstractEntityId | undefined) {
    const fieldName = "Testing";
    const { client, path, options } = this.__base;
    const collection = new TestEntityCollectionService(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }
}

export class AbstractEntityService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  AbstractEntity,
  EditableAbstractEntity,
  QAbstractEntity,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qAbstractEntity, options);
  }

  public asTestEntityService() {
    const { client, path, options } = this.__base;
    return new TestEntityService(client, path, "Tester.TestEntity", { ...options, subtype: true });
  }
}

export class AbstractEntityCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  AbstractEntity,
  EditableAbstractEntity,
  QAbstractEntity,
  AbstractEntityId,
  AbstractEntityService<V>,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qAbstractEntity, new QAbstractEntityId(name), options);
  }

  public asTestEntityCollectionService() {
    const { client, path, options } = this.__base;
    return new TestEntityCollectionService(client, path, "Tester.TestEntity", { ...options, subtype: true });
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ) {
    return new AbstractEntityService<V>(client, path, name, options);
  }
}

export class TestEntityService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, options);
  }
}

export class TestEntityCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  AbstractEntityId,
  TestEntityService<V>,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, new QAbstractEntityId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ) {
    return new TestEntityService<V>(client, path, name, options);
  }
}
