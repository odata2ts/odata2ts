import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { ODataService, UrlGetRequestCmd } from "@odata2ts/odata-service";
// @ts-ignore
import { QBestReview } from "./QTester";
// @ts-ignore
import type { BestReviewParams } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qBestReview?: QBestReview;

  public bestReview(params: BestReviewParams) {
    if (!this._qBestReview) {
      this._qBestReview = new QBestReview();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qBestReview.buildUrl(params, isUrlNotEncoded()));

    return new UrlGetRequestCmd<ClientType, ODataValueResponseV4<string>>(client, url, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._qBestReview.getResponseConverter(),
    });
  }
}
