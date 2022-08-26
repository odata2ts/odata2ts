import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";

export abstract class OperationBaseService<Q extends QueryObject, ModelResponse, UB extends { build: () => string }> {
  public constructor(protected client: ODataClient, protected path: string, protected qModel: Q) {}

  protected abstract createBuilder(): UB;

  public getPath() {
    return this.path;
  }

  public getQObject() {
    return this.qModel;
  }

  protected doPost<S>(model: S, requestConfig?: unknown): ODataResponse<ModelResponse> {
    return this.client.post(this.path, model, requestConfig);
  }

  protected doPatch<S>(model: S, requestConfig?: unknown): ODataResponse<void> {
    return this.client.patch(this.path, model, requestConfig);
  }

  protected doMerge<S>(model: S, requestConfig?: unknown): ODataResponse<void> {
    if (this.client.merge) {
      return this.client.merge(this.path, model, requestConfig);
    } else {
      return this.doPatch(model, requestConfig);
    }
  }

  protected doPut<S>(model: S, requestConfig?: unknown): ODataResponse<void> {
    return this.client.put(this.path, model, requestConfig);
  }

  protected doDelete(requestConfig?: unknown): ODataResponse<void> {
    return this.client.delete(this.path, requestConfig);
  }

  protected doQuery<QR>(queryFn?: (builder: UB, qObject: Q) => void, requestConfig?: unknown): ODataResponse<QR> {
    let url = this.path;

    if (queryFn) {
      const builder = this.createBuilder();
      queryFn(builder, this.qModel);
      url = builder.build();
    }

    return this.client.get(url, requestConfig);
  }
}
