import { ODataHttpClient, ODataResponse } from "@odata2ts/http-client-api";
import { ODataQueryBuilderV4, createQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QComplexParam, QueryObject } from "@odata2ts/odata-query-objects";

import { BIG_NUMBERS_HEADERS, DEFAULT_HEADERS } from "../RequestHeaders";

export class ServiceBaseV4<T, Q extends QueryObject> {
  protected readonly qResponseType: QComplexParam<any, Q>;

  public constructor(
    protected client: ODataHttpClient,
    protected basePath: string,
    protected name: string,
    protected qModel: Q,
    protected bigNumbersAsString: boolean = false
  ) {
    this.qResponseType = new QComplexParam("NONE", qModel);
  }

  public getPath() {
    return this.basePath && this.name ? this.basePath + "/" + this.name : this.basePath ? this.basePath : this.name;
  }

  public getQObject() {
    return this.qModel;
  }

  protected addFullPath(path?: string) {
    return `${this.getPath() ?? ""}${path ? "/" + path : ""}`;
  }

  protected getDefaultHeaders() {
    return this.bigNumbersAsString ? BIG_NUMBERS_HEADERS : DEFAULT_HEADERS;
  }

  protected doQuery<DataResponse>(
    queryFn?: (builder: ODataQueryBuilderV4<Q>, qObject: Q) => void,
    requestConfig?: unknown
  ): ODataResponse<DataResponse> {
    let url = this.getPath();

    if (queryFn) {
      const builder = createQueryBuilderV4(this.getPath(), this.qModel);
      queryFn(builder, this.qModel);
      url = builder.build();
    }

    return this.client.get(url, requestConfig, this.getDefaultHeaders());
  }
}
