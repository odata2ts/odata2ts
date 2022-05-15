import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import {
  ODataService,
  ODataCollectionResponseV4,
  compileFunctionPath,
  ODataModelResponseV4,
} from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntity } from "./TesterModel";

export class TesterService extends ODataService {
  private name: string = "Tester";

  constructor(client: ODataClient<any>, basePath: string) {
    super(client, basePath);
  }

  public mostPop(): ODataResponse<ODataCollectionResponseV4<TestEntity>> {
    const url = compileFunctionPath(this.getPath(), "mostPop");
    return this.client.get(url);
  }

  public bestBook(params: {
    testString: string;
    testNumber?: number;
  }): ODataResponse<ODataModelResponseV4<TestEntity>> {
    const url = compileFunctionPath(this.getPath(), "bestBook", {
      testString: { isLiteral: false, value: params.testString },
      testNumber: { isLiteral: true, value: params.testNumber },
    });
    return this.client.get(url);
  }
}
