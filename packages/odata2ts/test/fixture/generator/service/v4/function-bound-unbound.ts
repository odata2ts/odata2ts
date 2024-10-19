import type { HttpResponseModel, ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QTestEntity } from "./QTester";
// @ts-ignore
import { QFirstBook, QGetBestsellers, qTestEntity, QTestEntityId } from "./QTester";
// @ts-ignore
import type { EditableTestEntity, FirstBookParams, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qGetBestsellers?: QGetBestsellers;
  private _qFirstBook?: QFirstBook;

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
  ): Promise<HttpResponseModel<ODataCollectionResponseV4<TestEntity>>> {
    if (!this._qGetBestsellers) {
      this._qGetBestsellers = new QGetBestsellers();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qGetBestsellers.buildUrl(isUrlNotEncoded()));
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._qGetBestsellers.convertResponse(response);
  }

  public async bestBook(
    params: FirstBookParams,
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): Promise<HttpResponseModel<ODataModelResponseV4<TestEntity>>> {
    if (!this._qFirstBook) {
      this._qFirstBook = new QFirstBook();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qFirstBook.buildUrl(params, isUrlNotEncoded()));
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._qFirstBook.convertResponse(response);
  }
}

export class TestEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qTestEntity, options);
  }
}

export class TestEntityCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }
}
