import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataHttpMethods } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV2 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV2,
  EntityTypeServiceV2,
  ODataService,
  ODataServiceOptions,
  UrlRequestCmd,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QTestEntity } from "./QTester.js";
// @ts-ignore
import { QBestBook, qTestEntity, QTestEntityId } from "./QTester.js";
// @ts-ignore
import type { BestBookParams, EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel.js";

export class TesterService extends ODataService {
  private _qBestBook?: QBestBook;

  public tests(): TestEntityCollectionService;
  public tests(id: TestEntityId): TestEntityService;
  public tests(id?: TestEntityId | undefined) {
    const fieldName = "tests";
    const { client, path, options } = this.__base;
    const collection = new TestEntityCollectionService(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }

  public bestBook(params: BestBookParams) {
    if (!this._qBestBook) {
      this._qBestBook = new QBestBook();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qBestBook.buildUrl(params, isUrlNotEncoded()));

    return new UrlRequestCmd<ODataCollectionResponseV2<TestEntity>>(client, ODataHttpMethods.Get, url, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._qBestBook.getResponseConverter(),
    });
  }
}

export class TestEntityService extends EntityTypeServiceV2<TestEntity, EditableTestEntity, QTestEntity> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qTestEntity, options);
  }
}

export class TestEntityCollectionService extends EntitySetServiceV2<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId,
  TestEntityService
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptions | undefined,
  ) {
    return new TestEntityService(client, path, name, options);
  }
}
