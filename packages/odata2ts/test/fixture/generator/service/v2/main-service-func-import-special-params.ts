import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2 } from "@odata2ts/odata-core";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QBestBook } from "./QTester";
// @ts-ignore
import { BestBookParams, TestEntity } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qBestBook?: QBestBook;

  public async bestBook(
    params: BestBookParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV2<TestEntity>> {
    if (!this._qBestBook) {
      this._qBestBook = new QBestBook();
    }

    const url = this.addFullPath(this._qBestBook.buildUrl(params));
    const response = await this.client.get(url, requestConfig);
    return this._qBestBook.convertResponse(response);
  }
}
