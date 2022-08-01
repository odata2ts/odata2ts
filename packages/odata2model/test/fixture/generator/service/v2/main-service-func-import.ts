import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import {
  ODataService,
  ODataCollectionResponseV2,
  compileFunctionPathV2,
  ODataModelResponseV2,
} from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntity } from "./TesterModel";

export class TesterService extends ODataService {
  private _name: string = "Tester";

  constructor(client: ODataClient<any>, basePath: string) {
    super(client, basePath);
  }

  public mostPop(): ODataResponse<ODataCollectionResponseV2<TestEntity>> {
    const url = compileFunctionPathV2(this.getPath(), "mostPop");
    return this.client.get(url);
  }

  public bestBook(params: {
    testString: string;
    testNumber?: number;
  }): ODataResponse<ODataModelResponseV2<TestEntity>> {
    const url = compileFunctionPathV2(this.getPath(), "bestBook", {
      testString: { isLiteral: false, value: params.testString },
      testNumber: { isLiteral: true, value: params.testNumber },
    });
    return this.client.get(url);
  }
}
