import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataService, ODataModelResponseV4, compileActionPath } from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntity } from "./TesterModel";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";

  constructor(client: ClientType, basePath: string) {
    super(client, basePath);
  }

  public keepAlive(): ODataResponse<ODataModelResponseV4<void>> {
    const url = compileActionPath(this.getPath(), "keepAlive");
    return this.client.post(url, {});
  }

  public doLike(params: { rating: number; comment?: string }): ODataResponse<ODataModelResponseV4<TestEntity>> {
    const url = compileActionPath(this.getPath(), "DoLike");
    return this.client.post(url, params);
  }
}
