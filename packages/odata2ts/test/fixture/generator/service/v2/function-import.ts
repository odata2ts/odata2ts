import type { HttpResponseModel, ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV2, ODataModelResponseV2 } from "@odata2ts/odata-core";
import { EntitySetServiceV2, EntityTypeServiceV2, ODataService, ODataServiceOptions } from "@odata2ts/odata-service";
// @ts-ignore
import type { QTestEntity } from "./QTester";
// @ts-ignore
import { QBestBook, QMostPop, QPostBestBook, qTestEntity, QTestEntityId } from "./QTester";
// @ts-ignore
import type { BestBookParams, EditableTestEntity, PostBestBookParams, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qMostPop?: QMostPop;
  private _qBestBook?: QBestBook;
  private _qPostBestBook?: QPostBestBook;

  public tests(): TestEntityCollectionService<ClientType>;
  public tests(id: TestEntityId): TestEntityService<ClientType>;
  public tests(id?: TestEntityId | undefined) {
    const fieldName = "tests";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName, options)
      : new TestEntityService(client, path, new QTestEntityId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }

  public async mostPop(
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): Promise<HttpResponseModel<ODataCollectionResponseV2<TestEntity>>> {
    if (!this._qMostPop) {
      this._qMostPop = new QMostPop();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qMostPop.buildUrl(isUrlNotEncoded()));
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._qMostPop.convertResponse(response);
  }

  public async bestBook(
    params: BestBookParams,
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): Promise<HttpResponseModel<ODataModelResponseV2<TestEntity>>> {
    if (!this._qBestBook) {
      this._qBestBook = new QBestBook();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qBestBook.buildUrl(params, isUrlNotEncoded()));
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._qBestBook.convertResponse(response);
  }

  public async postBestBook(
    params: PostBestBookParams,
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): Promise<HttpResponseModel<ODataModelResponseV2<TestEntity>>> {
    if (!this._qPostBestBook) {
      this._qPostBestBook = new QPostBestBook();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qPostBestBook.buildUrl(params, isUrlNotEncoded()));
    const response = await client.post(url, undefined, requestConfig, getDefaultHeaders());
    return this._qPostBestBook.convertResponse(response);
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
