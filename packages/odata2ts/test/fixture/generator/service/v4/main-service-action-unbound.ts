import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QPing, QVote } from "./QTester";
// @ts-ignore
import { TestEntity, VoteParams } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qPing?: QPing;
  private _qVote?: QVote;

  public async keepAlive(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<void>> {
    if (!this._qPing) {
      this._qPing = new QPing();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPing.buildUrl());
    return client.post(url, {}, requestConfig, getDefaultHeaders());
  }

  public async doLike(
    params: VoteParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<TestEntity>> {
    if (!this._qVote) {
      this._qVote = new QVote();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qVote.buildUrl());
    const response = await client.post(url, this._qVote.convertUserParams(params), requestConfig, getDefaultHeaders());
    return this._qVote.convertResponse(response);
  }
}
