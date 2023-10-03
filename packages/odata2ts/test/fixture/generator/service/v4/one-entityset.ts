import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService, PrimitiveTypeServiceV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QTestEntity, QTestEntityId, qTestEntity } from "./QTester";
// @ts-ignore
import { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
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
  private _id?: PrimitiveTypeServiceV4<ClientType, string>;
  private _age?: PrimitiveTypeServiceV4<ClientType, number>;
  private _deceased?: PrimitiveTypeServiceV4<ClientType, boolean>;
  private _desc?: PrimitiveTypeServiceV4<ClientType, string>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel } = this.__base;
      this._id = new PrimitiveTypeServiceV4(client, path, "id", qModel.id.converter);
    }

    return this._id;
  }

  public age() {
    if (!this._age) {
      const { client, path, qModel } = this.__base;
      this._age = new PrimitiveTypeServiceV4(client, path, "age", qModel.age.converter);
    }

    return this._age;
  }

  public deceased() {
    if (!this._deceased) {
      const { client, path, qModel } = this.__base;
      this._deceased = new PrimitiveTypeServiceV4(client, path, "deceased", qModel.deceased.converter);
    }

    return this._deceased;
  }

  public desc() {
    if (!this._desc) {
      const { client, path, qModel } = this.__base;
      this._desc = new PrimitiveTypeServiceV4(client, path, "desc", qModel.desc.converter);
    }

    return this._desc;
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
    super(client, basePath, name, qTestEntity, new QTestEntityId(name));
  }
}
