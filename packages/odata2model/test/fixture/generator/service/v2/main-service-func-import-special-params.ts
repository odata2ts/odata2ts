import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataService, ODataModelResponseV2, compileFunctionPathV2 } from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntity } from "./TesterModel";

export class TesterService extends ODataService {
  private _name: string = "Tester";

  constructor(client: ODataClient<any>, basePath: string) {
    super(client, basePath);
  }

  public bestBook(params: {
    testGuid: string;
    testDateTime?: string;
    testDateTimeOffset?: string;
    testTime?: string;
  }): ODataResponse<ODataModelResponseV2<TestEntity>> {
    const url = compileFunctionPathV2(this.getPath(), "bestBook", {
      testGuid: { isLiteral: false, typePrefix: "guid", value: params.testGuid },
      testDateTime: { isLiteral: false, typePrefix: "datetime", value: params.testDateTime },
      testDateTimeOffset: { isLiteral: false, typePrefix: "datetimeoffset", value: params.testDateTimeOffset },
      testTime: { isLiteral: false, typePrefix: "time", value: params.testTime },
    });
    return this.client.get(url);
  }
}
