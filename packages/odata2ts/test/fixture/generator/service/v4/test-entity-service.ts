import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, PrimitiveTypeServiceV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QTestEntity, QTestEntityId, qTestEntity } from "../QTester";
// @ts-ignore
import { EditableTestEntity, TestEntity, TestEntityId } from "../TesterModel";

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
      this._id = new PrimitiveTypeServiceV4(this.client, this.getPath(), "id");
    }

    return this._id;
  }

  public age() {
    if (!this._age) {
      this._age = new PrimitiveTypeServiceV4(this.client, this.getPath(), "age");
    }

    return this._age;
  }

  public deceased() {
    if (!this._deceased) {
      this._deceased = new PrimitiveTypeServiceV4(this.client, this.getPath(), "deceased");
    }

    return this._deceased;
  }

  public desc() {
    if (!this._desc) {
      this._desc = new PrimitiveTypeServiceV4(this.client, this.getPath(), "desc");
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
