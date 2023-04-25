import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataCollectionResponseV4, ODataValueResponseV4 } from "@odata2ts/odata-core";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QPingCollection, QPingNumber, QPingString } from "./QTester";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _qPingString?: QPingString;
  private _qPingNumber?: QPingNumber;
  private _qPingCollection?: QPingCollection;

  public async pingString(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataValueResponseV4<string>> {
    if (!this._qPingString) {
      this._qPingString = new QPingString();
    }

    const url = this.addFullPath(this._qPingString.buildUrl());
    const response = await this.client.post(url, {}, requestConfig);
    return this._qPingString.convertResponse(response);
  }

  public async pingNumber(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataValueResponseV4<number>> {
    if (!this._qPingNumber) {
      this._qPingNumber = new QPingNumber();
    }

    const url = this.addFullPath(this._qPingNumber.buildUrl());
    const response = await this.client.post(url, {}, requestConfig);
    return this._qPingNumber.convertResponse(response);
  }

  public async pingCollection(
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<string>> {
    if (!this._qPingCollection) {
      this._qPingCollection = new QPingCollection();
    }

    const url = this.addFullPath(this._qPingCollection.buildUrl());
    const response = await this.client.post(url, {}, requestConfig);
    return this._qPingCollection.convertResponse(response);
  }
}
