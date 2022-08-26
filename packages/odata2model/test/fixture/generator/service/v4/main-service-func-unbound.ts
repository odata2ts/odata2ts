import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import {
  ODataService,
  ODataCollectionResponseV4,
  compileFunctionPathV4,
  ODataModelResponseV4,
} from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntity } from "./TesterModel";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";

  constructor(client: ClientType, basePath: string) {
    super(client, basePath);
  }

  public mostPop(): ODataResponse<ODataCollectionResponseV4<TestEntity>> {
    const url = compileFunctionPathV4(this.getPath(), "mostPop");
    return this.client.get(url);
  }

  public bestBook(params: {
    testString: string;
    testNumber?: number;
  }): ODataResponse<ODataModelResponseV4<TestEntity>> {
    const url = compileFunctionPathV4(this.getPath(), "bestBook", {
      testString: { isLiteral: false, value: params.testString },
      testNumber: { isLiteral: true, value: params.testNumber },
    });
    return this.client.get(url);
  }
}
