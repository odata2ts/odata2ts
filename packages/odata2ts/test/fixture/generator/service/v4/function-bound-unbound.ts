import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4, ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  UrlGetRequestCmd,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QTestEntity } from "./QTester.js";
// @ts-ignore
import { QFirstBook, QGetBestsellers, qTestEntity, QTestEntityId } from "./QTester.js";
// @ts-ignore
import type { EditableTestEntity, FirstBookParams, TestEntity, TestEntityId } from "./TesterModel.js";

export class TesterService extends ODataService {
  private _qGetBestsellers?: QGetBestsellers;
  private _qFirstBook?: QFirstBook;

  public tests(): TestEntityCollectionService;
  public tests(id: TestEntityId): TestEntityService;
  public tests(id?: TestEntityId | undefined) {
    const fieldName = "tests";
    const { client, path, options } = this.__base;
    const collection = new TestEntityCollectionService(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }

  public mostPop() {
    if (!this._qGetBestsellers) {
      this._qGetBestsellers = new QGetBestsellers();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qGetBestsellers.buildUrl(isUrlNotEncoded()));

    return new UrlGetRequestCmd<ODataCollectionResponseV4<TestEntity>>(client, url, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._qGetBestsellers.getResponseConverter(),
    });
  }

  public bestBook(params: FirstBookParams) {
    if (!this._qFirstBook) {
      this._qFirstBook = new QFirstBook();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qFirstBook.buildUrl(params, isUrlNotEncoded()));

    return new UrlGetRequestCmd<ODataModelResponseV4<TestEntity>>(client, url, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._qFirstBook.getResponseConverter(),
    });
  }
}

export class TestEntityService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  TestEntity,
  EditableTestEntity,
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
  TestEntityService<V>,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ) {
    return new TestEntityService<V>(client, path, name, options);
  }
}
