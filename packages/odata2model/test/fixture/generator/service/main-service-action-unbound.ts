// @ts-nocheck
import { ODataClient, ODataResponse, ODataModelResponse } from "@odata2ts/odata-client-api";
import { ODataService, compileActionPath } from "@odata2ts/odata-service";
import { TestEntity } from "./TesterModel";

export class TesterService extends ODataService {
  private name: string = "Tester";

  constructor(client: ODataClient<any>, basePath: string) {
    super(client, basePath);
  }

  public keepAlive(): ODataResponse<ODataModelResponse<void>> {
    const url = compileActionPath(this.getPath(), "keepAlive");
    return this.client.post(url, {});
  }

  public doLike(params: { rating: number; comment?: string }): ODataResponse<ODataModelResponse<TestEntity>> {
    const url = compileActionPath(this.getPath(), "DoLike");
    return this.client.post(url, params);
  }
}
