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
import type { QTestEntity } from "./QTester";
// @ts-ignore
import { QBestBook, qTestEntity, QTestEntityId } from "./QTester";
// @ts-ignore
import type { BestBookParams, EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qBestBook?: QBestBook;

  public tests(): TestEntityCollectionService<ClientType>;
  public tests(id: TestEntityId): TestEntityService<ClientType>;
  public tests(id?: TestEntityId | undefined) {
    const fieldName = "tests";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName, options)
      : new TestEntityService(client, path, new QTestEntityId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }

  public bestBook(params: BestBookParams) {
    if (!this._qBestBook) {
      this._qBestBook = new QBestBook();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qBestBook.buildUrl(params, isUrlNotEncoded()));

    return new UrlRequestCmd<ClientType, ODataCollectionResponseV2<TestEntity>>(
      client,
      ODataHttpMethods.Get,
      url,
      undefined,
      { headers: getDefaultHeaders(), mainResponseConverter: this._qBestBook.getResponseConverter() },
    );
  }
}

export class TestEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qTestEntity, options);
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
