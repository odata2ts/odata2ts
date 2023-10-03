import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QTestEntity, QTestEntityId, qTestEntity } from "./QTester";
// @ts-ignore
import { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _currentUser?: TestEntityService<ClientType>;

  public currentUser() {
    if (!this._currentUser) {
      const { client, path } = this.__base;
      this._currentUser = new TestEntityService(client, path, "CURRENT_USER");
    }

    return this._currentUser;
  }
}

export class TestEntityService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity);
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
