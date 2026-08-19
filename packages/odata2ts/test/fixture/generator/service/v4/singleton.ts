import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
import type { QTestEntity } from "./QTester.js";
import { qTestEntity, QTestEntityId } from "./QTester.js";
import type { EditableTestEntity, TestEntity, TestEntityId, UpdatableTestEntity } from "./TesterModel.js";

export class TesterService extends ODataService {
  private _currentUser?: TestEntityService;

  public currentUser() {
    if (!this._currentUser) {
      const { client, path, options } = this.__base;
      this._currentUser = new TestEntityService(client, path, "CURRENT_USER", options);
    }

    return this._currentUser;
  }
}

export class TestEntityService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  TestEntity,
  UpdatableTestEntity,
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
  TestEntityId,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }
}
