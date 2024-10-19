import type { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  PrimitiveTypeServiceV4,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QTestEntity } from "./QTester";
// @ts-ignore
import { qTestEntity, QTestEntityId } from "./QTester";
// @ts-ignore
import type { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
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

export class TestEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  private _id?: PrimitiveTypeServiceV4<ClientType, string>;
  private _age?: PrimitiveTypeServiceV4<ClientType, number>;
  private _deceased?: PrimitiveTypeServiceV4<ClientType, boolean>;
  private _desc?: PrimitiveTypeServiceV4<ClientType, string>;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
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

export class TestEntityCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }
}
