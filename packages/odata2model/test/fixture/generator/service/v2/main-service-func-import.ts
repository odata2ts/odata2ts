import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import {
  ODataService,
  ODataCollectionResponseV2,
  compileFunctionPathV2,
  ODataModelResponseV2,
} from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntity } from "./TesterModel";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";

  constructor(client: ClientType, basePath: string) {
    super(client, basePath);
  }

  public mostPop(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataCollectionResponseV2<TestEntity>> {
    const url = compileFunctionPathV2(this.getPath(), "MostPop");
    return this.client.get(url, requestConfig);
  }

  public bestBook(
    params: { TestString: string; TEST_NUMBER?: number },
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<TestEntity>> {
    const url = compileFunctionPathV2(this.getPath(), "BEST_BOOK", {
      TestString: { isLiteral: false, value: params.TestString },
      TEST_NUMBER: { isLiteral: true, value: params.TEST_NUMBER },
    });
    return this.client.get(url, requestConfig);
  }

  public postBestBook(
    params: { TestString: string; TEST_NUMBER?: number },
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<TestEntity>> {
    const url = compileFunctionPathV2(this.getPath(), "postBestBook", {
      TestString: { isLiteral: false, value: params.TestString },
      TEST_NUMBER: { isLiteral: true, value: params.TEST_NUMBER },
    });
    return this.client.post(url, undefined, requestConfig);
  }
}
