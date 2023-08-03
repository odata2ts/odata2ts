import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2, ODataModelResponseV2 } from "@odata2ts/odata-core";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QBestBook, QMostPop, QPostBestBook } from "./QTester";
// @ts-ignore
import { BestBookParams, PostBestBookParams, TestEntity } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qMostPop?: QMostPop;
  private _qBestBook?: QBestBook;
  private _qPostBestBook?: QPostBestBook;

  public async mostPop(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV2<TestEntity>> {
    if (!this._qMostPop) {
      this._qMostPop = new QMostPop();
    }

    const url = this.addFullPath(this._qMostPop.buildUrl());
    const response = await this.client.get(url, requestConfig, this.getDefaultHeaders());
    return this._qMostPop.convertResponse(response);
  }

  public async bestBook(
    params: BestBookParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<TestEntity>> {
    if (!this._qBestBook) {
      this._qBestBook = new QBestBook();
    }

    const url = this.addFullPath(this._qBestBook.buildUrl(params));
    const response = await this.client.get(url, requestConfig, this.getDefaultHeaders());
    return this._qBestBook.convertResponse(response);
  }

  public async postBestBook(
    params: PostBestBookParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<TestEntity>> {
    if (!this._qPostBestBook) {
      this._qPostBestBook = new QPostBestBook();
    }

    const url = this.addFullPath(this._qPostBestBook.buildUrl(params));
    const response = await this.client.post(url, undefined, requestConfig, this.getDefaultHeaders());
    return this._qPostBestBook.convertResponse(response);
  }
}
