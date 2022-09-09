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

  private _getQMostPop() {
    if (!this._qMostPop) {
      this._qMostPop = new QMostPop();
    }

    return this._qMostPop;
  }

  public mostPop(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataCollectionResponseV2<TestEntity>> {
    const url = this.addFullPath(this._getQMostPop().buildUrl());
    return this.client.get(url, requestConfig);
  }

  private _getQBestBook() {
    if (!this._qBestBook) {
      this._qBestBook = new QBestBook();
    }

    return this._qBestBook;
  }

  public bestBook(
    params: BestBookParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<TestEntity>> {
    const url = this.addFullPath(this._getQBestBook().buildUrl(params));
    return this.client.get(url, requestConfig);
  }

  private _getQPostBestBook() {
    if (!this._qPostBestBook) {
      this._qPostBestBook = new QPostBestBook();
    }

    return this._qPostBestBook;
  }

  public postBestBook(
    params: PostBestBookParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<TestEntity>> {
    const url = this.addFullPath(this._getQPostBestBook().buildUrl(params));
    return this.client.post(url, undefined, requestConfig);
  }
}
