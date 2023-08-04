import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV2, EntityTypeServiceV2, PrimitiveTypeServiceV2 } from "@odata2ts/odata-service";

// @ts-ignore
import { QTestEntity, QTestEntityId, qTestEntity } from "../QTester";
// @ts-ignore
import { EditableTestEntity, TestEntity, TestEntityId } from "../TesterModel";

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
      this._id = new PrimitiveTypeServiceV2(this.client, this.getPath(), "id");
    }

    return this._id;
  }

  public age() {
    if (!this._age) {
      this._age = new PrimitiveTypeServiceV2(this.client, this.getPath(), "age");
    }

    return this._age;
  }

  public deceased() {
    if (!this._deceased) {
      this._deceased = new PrimitiveTypeServiceV2(this.client, this.getPath(), "deceased");
    }

    return this._deceased;
  }

  public desc() {
    if (!this._desc) {
      this._desc = new PrimitiveTypeServiceV2(this.client, this.getPath(), "desc");
    }

    return this._desc;
  }

  public dateAndTime() {
    if (!this._dateAndTime) {
      this._dateAndTime = new PrimitiveTypeServiceV2(this.client, this.getPath(), "dateAndTime");
    }

    return this._dateAndTime;
  }

  public dateAndTimeAndOffset() {
    if (!this._dateAndTimeAndOffset) {
      this._dateAndTimeAndOffset = new PrimitiveTypeServiceV2(this.client, this.getPath(), "dateAndTimeAndOffset");
    }

    return this._dateAndTimeAndOffset;
  }

  public time() {
    if (!this._time) {
      this._time = new PrimitiveTypeServiceV2(this.client, this.getPath(), "time");
    }

    return this._time;
  }

  public test() {
    if (!this._test) {
      this._test = new PrimitiveTypeServiceV2(this.client, this.getPath(), "test");
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
