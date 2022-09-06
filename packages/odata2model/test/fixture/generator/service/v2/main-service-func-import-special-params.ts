import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataModelResponseV2, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QBestBook } from "./QTester";
// @ts-ignore
import { BestBookParams, TestEntity } from "./TesterModel";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";
  private _qBestBook?: QBestBook;

  constructor(client: ClientType, basePath: string) {
    super(client, basePath);
  }

  private _getQBestBook() {
    if (!this._qBestBook) {
      this._qBestBook = new QBestBook(this.getPath());
    }

    return this._qBestBook;
  }

  public bestBook(
    params: BestBookParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<TestEntity>> {
    const url = this._getQBestBook().buildUrl(params);
    return this.client.get(url, requestConfig);
  }
}
