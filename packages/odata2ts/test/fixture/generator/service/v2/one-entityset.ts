import type { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  EntitySetServiceV2,
  EntityTypeServiceV2,
  ODataService,
  ODataServiceOptions,
  PrimitiveTypeServiceV2,
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

export class TestEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
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

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qTestEntity, options);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel, options } = this.__base;
      this._id = new PrimitiveTypeServiceV2(client, path, "id", qModel.id.converter, undefined, options);
    }

    return this._id;
  }

  public age() {
    if (!this._age) {
      const { client, path, qModel, options } = this.__base;
      this._age = new PrimitiveTypeServiceV2(client, path, "age", qModel.age.converter, undefined, options);
    }

    return this._age;
  }

  public deceased() {
    if (!this._deceased) {
      const { client, path, qModel, options } = this.__base;
      this._deceased = new PrimitiveTypeServiceV2(
        client,
        path,
        "deceased",
        qModel.deceased.converter,
        undefined,
        options,
      );
    }

    return this._deceased;
  }

  public desc() {
    if (!this._desc) {
      const { client, path, qModel, options } = this.__base;
      this._desc = new PrimitiveTypeServiceV2(client, path, "desc", qModel.desc.converter, undefined, options);
    }

    return this._desc;
  }

  public dateAndTime() {
    if (!this._dateAndTime) {
      const { client, path, qModel, options } = this.__base;
      this._dateAndTime = new PrimitiveTypeServiceV2(
        client,
        path,
        "dateAndTime",
        qModel.dateAndTime.converter,
        undefined,
        options,
      );
    }

    return this._dateAndTime;
  }

  public dateAndTimeAndOffset() {
    if (!this._dateAndTimeAndOffset) {
      const { client, path, qModel, options } = this.__base;
      this._dateAndTimeAndOffset = new PrimitiveTypeServiceV2(
        client,
        path,
        "dateAndTimeAndOffset",
        qModel.dateAndTimeAndOffset.converter,
        undefined,
        options,
      );
    }

    return this._dateAndTimeAndOffset;
  }

  public time() {
    if (!this._time) {
      const { client, path, qModel, options } = this.__base;
      this._time = new PrimitiveTypeServiceV2(client, path, "time", qModel.time.converter, undefined, options);
    }

    return this._time;
  }

  public test() {
    if (!this._test) {
      const { client, path, qModel, options } = this.__base;
      this._test = new PrimitiveTypeServiceV2(client, path, "test", qModel.test.converter, undefined, options);
    }

    return this._test;
  }
}

export class TestEntityCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }
}
