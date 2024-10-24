import type { HttpResponseModel, ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import type { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { ODataService } from "@odata2ts/odata-service";
// @ts-ignore
import { QBestReview } from "./QTester";
// @ts-ignore
import type { BestReviewParams } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qBestReview?: QBestReview;

  public async bestReview(
    params?: BestReviewParams,
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): Promise<HttpResponseModel<ODataValueResponseV4<string>>> {
    if (!this._qBestReview) {
      this._qBestReview = new QBestReview();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qBestReview.buildUrl(params, isUrlNotEncoded()));
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._qBestReview.convertResponse(response);
  }
}
