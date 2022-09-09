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

  constructor(client: ClientType, basePath: string) {
    super(client, basePath);
  }

  private _getQPing() {
    if (!this._qPing) {
      this._qPing = new QPing();
    }

    return this._qPing;
  }

  public keepAlive(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<void>> {
    const url = this.addFullPath(this._getQPing().buildUrl());
    return this.client.post(url, {}, requestConfig);
  }

  private _getQVote() {
    if (!this._qVote) {
      this._qVote = new QVote();
    }

    return this._qVote;
  }

  public doLike(
    params: VoteParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<TestEntity>> {
    const url = this.addFullPath(this._getQVote().buildUrl());
    return this.client.post(url, params, requestConfig);
  }
}
