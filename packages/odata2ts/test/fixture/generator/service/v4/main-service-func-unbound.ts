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

    const url = this.addFullPath(this._qGetBestsellers.buildUrl());
    const response = await this.client.get(url, requestConfig);
    return this._qGetBestsellers.convertResponse(response);
  }

  public async bestBook(
    params: FirstBookParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<TestEntity>> {
    if (!this._qFirstBook) {
      this._qFirstBook = new QFirstBook();
    }

    const url = this.addFullPath(this._qFirstBook.buildUrl(params));
    const response = await this.client.get(url, requestConfig);
    return this._qFirstBook.convertResponse(response);
  }
}
