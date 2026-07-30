import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QTestEntity } from "./QTester.js";
// @ts-ignore
import { qTestEntity, QTestEntityId } from "./QTester.js";
// @ts-ignore
import type { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel.js";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _currentUser?: TestEntityService<ClientType>;

  public currentUser() {
    if (!this._currentUser) {
      const { client, path, options } = this.__base;
      this._currentUser = new TestEntityService(client, path, "CURRENT_USER", options);
    }

    return this._currentUser;
  }
}

export class TestEntityService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntityTypeServiceV4<ClientType, TestEntity, EditableTestEntity, QTestEntity, V> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, options);
  }
}

export class TestEntityCollectionService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntitySetServiceV4<ClientType, TestEntity, EditableTestEntity, QTestEntity, TestEntityId, V> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }
}
