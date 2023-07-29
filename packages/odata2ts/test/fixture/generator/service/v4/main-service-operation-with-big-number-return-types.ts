import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataValueResponseV4 } from "@odata2ts/odata-core";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QPingBigNumber, QPingDecimal, QPingDecimalCollection } from "./QTester";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qPingBigNumber?: QPingBigNumber;
  private _qPingDecimal?: QPingDecimal;
  private _qPingDecimalCollection?: QPingDecimalCollection;

  constructor(client: ClientType, basePath: string) {
    super(client, basePath, true);
  }

  public async pingBigNumber(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataValueResponseV4<string>> {
    if (!this._qPingBigNumber) {
      this._qPingBigNumber = new QPingBigNumber();
    }

    const url = this.addFullPath(this._qPingBigNumber.buildUrl());
    const response = await this.client.post(url, {}, requestConfig);
    return this._qPingBigNumber.convertResponse(response);
  }

  public async pingDecimal(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataValueResponseV4<string>> {
    if (!this._qPingDecimal) {
      this._qPingDecimal = new QPingDecimal();
    }

    const url = this.addFullPath(this._qPingDecimal.buildUrl());
    const response = await this.client.post(url, {}, requestConfig);
    return this._qPingDecimal.convertResponse(response);
  }

  public async pingDecimalCollection(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<string>> {
    if (!this._qPingDecimalCollection) {
      this._qPingDecimalCollection = new QPingDecimalCollection();
    }

    const url = this.addFullPath(this._qPingDecimalCollection.buildUrl());
    const response = await this.client.post(url, {}, requestConfig);
    return this._qPingDecimalCollection.convertResponse(response);
  }
}
