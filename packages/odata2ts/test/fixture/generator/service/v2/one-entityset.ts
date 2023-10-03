import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV2, EntityTypeServiceV2, ODataService, PrimitiveTypeServiceV2 } from "@odata2ts/odata-service";

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

export class TestEntityService<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  private _id?: PrimitiveTypeServiceV2<ClientType, string>;
  private _age?: PrimitiveTypeServiceV2<ClientType, number>;
  private _deceased?: PrimitiveTypeServiceV2<ClientType, boolean>;
  private _desc?: PrimitiveTypeServiceV2<ClientType, string>;
  private _dateAndTime?: PrimitiveTypeServiceV2<ClientType, string>;
  private _dateAndTimeAndOffset?: PrimitiveTypeServiceV2<ClientType, string>;
  private _time?: PrimitiveTypeServiceV2<ClientType, string>;
  private _test?: PrimitiveTypeServiceV2<ClientType, string>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel } = this.__base;
      this._id = new PrimitiveTypeServiceV2(client, path, "id", qModel.id.converter);
    }

    return this._id;
  }

  public age() {
    if (!this._age) {
      const { client, path, qModel } = this.__base;
      this._age = new PrimitiveTypeServiceV2(client, path, "age", qModel.age.converter);
    }

    return this._age;
  }

  public deceased() {
    if (!this._deceased) {
      const { client, path, qModel } = this.__base;
      this._deceased = new PrimitiveTypeServiceV2(client, path, "deceased", qModel.deceased.converter);
    }

    return this._deceased;
  }

  public desc() {
    if (!this._desc) {
      const { client, path, qModel } = this.__base;
      this._desc = new PrimitiveTypeServiceV2(client, path, "desc", qModel.desc.converter);
    }

    return this._desc;
  }

  public dateAndTime() {
    if (!this._dateAndTime) {
      const { client, path, qModel } = this.__base;
      this._dateAndTime = new PrimitiveTypeServiceV2(client, path, "dateAndTime", qModel.dateAndTime.converter);
    }

    return this._dateAndTime;
  }

  public dateAndTimeAndOffset() {
    if (!this._dateAndTimeAndOffset) {
      const { client, path, qModel } = this.__base;
      this._dateAndTimeAndOffset = new PrimitiveTypeServiceV2(
        client,
        path,
        "dateAndTimeAndOffset",
        qModel.dateAndTimeAndOffset.converter
      );
    }

    return this._dateAndTimeAndOffset;
  }

  public time() {
    if (!this._time) {
      const { client, path, qModel } = this.__base;
      this._time = new PrimitiveTypeServiceV2(client, path, "time", qModel.time.converter);
    }

    return this._time;
  }

  public test() {
    if (!this._test) {
      const { client, path, qModel } = this.__base;
      this._test = new PrimitiveTypeServiceV2(client, path, "test", qModel.test.converter);
    }

    return this._test;
  }
}

export class TestEntityCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
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
