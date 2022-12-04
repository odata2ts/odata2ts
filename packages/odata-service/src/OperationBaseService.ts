import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { QComplexParam, QueryObject } from "@odata2ts/odata-query-objects";

export abstract class OperationBaseService<Q extends QueryObject, UB extends { build: () => string }> {
  protected readonly qResponseType: QComplexParam<any, Q>;

  public constructor(
    protected client: ODataClient,
    protected basePath: string,
    protected name: string,
    protected qModel: Q
  ) {
    this.qResponseType = new QComplexParam("NONE", qModel);
  }

  protected abstract createBuilder(): UB;

  public getPath() {
    return this.basePath && this.name ? this.basePath + "/" + this.name : this.basePath ? this.basePath : this.name;
  }

  public getQObject() {
    return this.qModel;
  }

  protected doPost<DataResponse>(model: any, requestConfig?: unknown): ODataResponse<DataResponse> {
    return this.client.post(this.getPath(), model, requestConfig);
  }

  protected doPatch<DataResponse>(model: any, requestConfig?: unknown): ODataResponse<DataResponse> {
    return this.client.patch(this.getPath(), model, requestConfig);
  }

  protected doMerge<DataResponse>(model: any, requestConfig?: unknown): ODataResponse<DataResponse> {
    if (this.client.merge) {
      return this.client.merge(this.getPath(), model, requestConfig);
    } else {
      return this.doPatch(model, requestConfig);
    }
  }

  protected doPut<DataResponse>(model: any, requestConfig?: unknown): ODataResponse<DataResponse> {
    const oModel = model ? this.qModel.convertToOData(model) : model;
    return this.client.put(this.getPath(), oModel, requestConfig);
  }

  protected doDelete(requestConfig?: unknown): ODataResponse<void> {
    return this.client.delete(this.getPath(), requestConfig);
  }

  protected doQuery<DataResponse>(
    queryFn?: (builder: UB, qObject: Q) => void,
    requestConfig?: unknown
  ): ODataResponse<DataResponse> {
    let url = this.getPath();

    if (queryFn) {
      const builder = this.createBuilder();
      queryFn(builder, this.qModel);
      url = builder.build();
    }

    return this.client.get(url, requestConfig);
  }

  protected addFullPath(path?: string) {
    return `${this.getPath() ?? ""}${path ? "/" + path : ""}`;
  }
}
