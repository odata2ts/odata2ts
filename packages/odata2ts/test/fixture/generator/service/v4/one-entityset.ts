import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  PrimitiveTypeServiceV4,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QTestEntity } from "./QTester.js";
// @ts-ignore
import { qTestEntity, QTestEntityId } from "./QTester.js";
// @ts-ignore
import type { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel.js";

export class TesterService extends ODataService {
  public ents(): TestEntityCollectionService;
  public ents(id: TestEntityId): TestEntityService;
  public ents(id?: TestEntityId | undefined) {
    const fieldName = "Ents";
    const { client, path, options } = this.__base;
    const collection = new TestEntityCollectionService(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }
}

export class TestEntityService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  V
> {
  private _id?: PrimitiveTypeServiceV4<string, V>;
  private _age?: PrimitiveTypeServiceV4<number, V>;
  private _deceased?: PrimitiveTypeServiceV4<boolean, V>;
  private _desc?: PrimitiveTypeServiceV4<string, V>;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, options);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel, options } = this.__base;
      this._id = new PrimitiveTypeServiceV4(client, path, "id", qModel.id.converter, options);
    }

    return this._id;
  }

  public age() {
    if (!this._age) {
      const { client, path, qModel, options } = this.__base;
      this._age = new PrimitiveTypeServiceV4(client, path, "age", qModel.age.converter, options);
    }

    return this._age;
  }

  public deceased() {
    if (!this._deceased) {
      const { client, path, qModel, options } = this.__base;
      this._deceased = new PrimitiveTypeServiceV4(client, path, "deceased", qModel.deceased.converter, options);
    }

    return this._deceased;
  }

  public desc() {
    if (!this._desc) {
      const { client, path, qModel, options } = this.__base;
      this._desc = new PrimitiveTypeServiceV4(client, path, "desc", qModel.desc.converter, options);
    }

    return this._desc;
  }
}

export class TestEntityCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId,
  TestEntityService<V>,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
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
