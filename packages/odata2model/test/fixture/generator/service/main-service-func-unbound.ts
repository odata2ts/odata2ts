// @ts-nocheck
import { ODataClient, ODataResponse, ODataCollectionResponse, ODataModelResponse } from "@odata2ts/odata-client-api";
import { ODataService, compileFunctionPath } from "@odata2ts/odata-service";
import { TestEntity } from "./TesterModel";

export class TesterService extends ODataService {
  private name: string = "Tester";

  constructor(client: ODataClient<any>, basePath: string) {
    super(client, basePath);
  }

  public mostPop(): ODataResponse<ODataCollectionResponse<TestEntity>> {
    const url = compileFunctionPath(this.getPath(), "mostPop");
    return this.client.get(url);
  }

  public bestBook(params: { testString: string; testNumber?: number }): ODataResponse<ODataModelResponse<TestEntity>> {
    const url = compileFunctionPath(this.getPath(), "bestBook", {
      testString: { isLiteral: false, value: params.testString },
      testNumber: { isLiteral: true, value: params.testNumber },
    });
    return this.client.get(url);
  }
}
