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

  constructor(client: ClientType, basePath: string) {
    super(client, basePath);
  }

  private _getQGetBestsellers() {
    if (!this._qGetBestsellers) {
      this._qGetBestsellers = new QGetBestsellers(this.getPath());
    }

    return this._qGetBestsellers;
  }

  public mostPop(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataCollectionResponseV4<TestEntity>> {
    const url = this._getQGetBestsellers().buildUrl();
    return this.client.get(url, requestConfig);
  }

  private _getQFirstBook() {
    if (!this._qFirstBook) {
      this._qFirstBook = new QFirstBook(this.getPath());
    }

    return this._qFirstBook;
  }

  public bestBook(
    params: FirstBookParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<TestEntity>> {
    const url = this._getQFirstBook().buildUrl(params);
    return this.client.get(url, requestConfig);
  }
}
