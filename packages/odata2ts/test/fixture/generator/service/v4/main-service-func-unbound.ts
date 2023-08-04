import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QFirstBook, QGetBestsellers } from "./QTester";
// @ts-ignore
import { FirstBookParams, TestEntity } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qGetBestsellers?: QGetBestsellers;
  private _qFirstBook?: QFirstBook;

  public async mostPop(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<TestEntity>> {
    if (!this._qGetBestsellers) {
      this._qGetBestsellers = new QGetBestsellers();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qGetBestsellers.buildUrl());
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._qGetBestsellers.convertResponse(response);
  }

  public async bestBook(
    params: FirstBookParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<TestEntity>> {
    if (!this._qFirstBook) {
      this._qFirstBook = new QFirstBook();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qFirstBook.buildUrl(params));
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._qFirstBook.convertResponse(response);
  }
}
