import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataModelResponseV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QPing, QVote } from "./QTester";
// @ts-ignore
import { TestEntity, VoteParams } from "./TesterModel";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";
  private _qPing?: QPing;
  private _qVote?: QVote;

  public keepAlive(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<void>> {
    if (!this._qPing) {
      this._qPing = new QPing();
    }

    const url = this.addFullPath(this._qPing.buildUrl());
    return this.client.post(url, {}, requestConfig);
  }

  public doLike(
    params: VoteParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<TestEntity>> {
    if (!this._qVote) {
      this._qVote = new QVote();
    }

    const url = this.addFullPath(this._qVote.buildUrl());
    return this.client.post(url, params, requestConfig);
  }
}
