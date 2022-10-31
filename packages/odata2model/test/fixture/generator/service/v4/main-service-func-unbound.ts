import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QFirstBook, QGetBestsellers } from "./QTester";
// @ts-ignore
import { FirstBookParams, TestEntity } from "./TesterModel";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";
  private _qGetBestsellers?: QGetBestsellers;
  private _qFirstBook?: QFirstBook;

  public mostPop(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataCollectionResponseV4<TestEntity>> {
    if (!this._qGetBestsellers) {
      this._qGetBestsellers = new QGetBestsellers();
    }

    const url = this.addFullPath(this._qGetBestsellers.buildUrl());
    return this.client.get(url, requestConfig);
  }

  public bestBook(
    params: FirstBookParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<TestEntity>> {
    if (!this._qFirstBook) {
      this._qFirstBook = new QFirstBook();
    }

    const url = this.addFullPath(this._qFirstBook.buildUrl(params));
    return this.client.get(url, requestConfig);
  }
}
