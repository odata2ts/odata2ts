import { ODataHttpClient, ODataResponse } from "@odata2ts/http-client-api";
import { ODataQueryBuilderV2, createQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QComplexParam, QueryObject } from "@odata2ts/odata-query-objects";

import { DEFAULT_HEADERS } from "../RequestHeaders";

export class ServiceBaseV2<T, Q extends QueryObject> {
  protected readonly qResponseType: QComplexParam<any, Q>;

  public constructor(
    protected client: ODataHttpClient,
    protected basePath: string,
    protected name: string,
    protected qModel: Q
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
    return DEFAULT_HEADERS;
  }

  protected doQuery<DataResponse>(
    queryFn?: (builder: ODataQueryBuilderV2<Q>, qObject: Q) => void,
    requestConfig?: unknown
  ): ODataResponse<DataResponse> {
    let url = this.getPath();

    if (queryFn) {
      const builder = createQueryBuilderV2(this.getPath(), this.qModel);
      queryFn(builder, this.qModel);
      url = builder.build();
    }

    return this.client.get(url, requestConfig, this.getDefaultHeaders());
  }
}
