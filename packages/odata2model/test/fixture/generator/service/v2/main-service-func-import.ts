import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataCollectionResponseV2, ODataModelResponseV2, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QBestBook, QMostPop, QPostBestBook } from "./QTester";
// @ts-ignore
import { BestBookParams, PostBestBookParams, TestEntity } from "./TesterModel";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";
  private _qMostPop?: QMostPop;
  private _qBestBook?: QBestBook;
  private _qPostBestBook?: QPostBestBook;

  public mostPop(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataCollectionResponseV2<TestEntity>> {
    if (!this._qMostPop) {
      this._qMostPop = new QMostPop();
    }

    const url = this.addFullPath(this._qMostPop.buildUrl());
    return this.client.get(url, requestConfig);
  }

  public bestBook(
    params: BestBookParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<TestEntity>> {
    if (!this._qBestBook) {
      this._qBestBook = new QBestBook();
    }

    const url = this.addFullPath(this._qBestBook.buildUrl(params));
    return this.client.get(url, requestConfig);
  }

  public postBestBook(
    params: PostBestBookParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<TestEntity>> {
    if (!this._qPostBestBook) {
      this._qPostBestBook = new QPostBestBook();
    }

    const url = this.addFullPath(this._qPostBestBook.buildUrl(params));
    return this.client.post(url, undefined, requestConfig);
  }
}
