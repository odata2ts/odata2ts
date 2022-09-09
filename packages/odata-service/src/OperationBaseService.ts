import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";

export abstract class OperationBaseService<Q extends QueryObject, ModelResponse, UB extends { build: () => string }> {
  public constructor(
    protected client: ODataClient,
    protected basePath: string,
    protected name: string,
    protected qModel: Q
  ) {}

  protected abstract createBuilder(): UB;

  public getPath() {
    return this.basePath && this.name ? this.basePath + "/" + this.name : this.basePath ? this.basePath : this.name;
  }

  public getQObject() {
    return this.qModel;
  }

  protected doPost<S>(model: S, requestConfig?: unknown): ODataResponse<ModelResponse> {
    return this.client.post(this.getPath(), model, requestConfig);
  }

  protected doPatch<S>(model: S, requestConfig?: unknown): ODataResponse<void> {
    return this.client.patch(this.getPath(), model, requestConfig);
  }

  protected doMerge<S>(model: S, requestConfig?: unknown): ODataResponse<void> {
    if (this.client.merge) {
      return this.client.merge(this.getPath(), model, requestConfig);
    } else {
      return this.doPatch(model, requestConfig);
    }
  }

  protected doPut<S>(model: S, requestConfig?: unknown): ODataResponse<void> {
    return this.client.put(this.getPath(), model, requestConfig);
  }

  protected doDelete(requestConfig?: unknown): ODataResponse<void> {
    return this.client.delete(this.getPath(), requestConfig);
  }

  protected doQuery<QR>(queryFn?: (builder: UB, qObject: Q) => void, requestConfig?: unknown): ODataResponse<QR> {
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
