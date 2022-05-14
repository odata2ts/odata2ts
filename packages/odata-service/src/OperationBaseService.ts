import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";

export abstract class OperationBaseService<T, Q extends QueryObject, ModelResponse, UB extends ODataUriBuilder<Q>> {
  public constructor(protected client: ODataClient, protected path: string, protected qModel: Q) {}

  protected abstract createBuilder(): UB;

  public getPath() {
    return this.path;
  }

  public getQObject() {
    return this.qModel;
  }

  protected doPost<S>(model: S): ODataResponse<ModelResponse> {
    return this.client.post(this.path, model);
  }

  protected doPatch<S>(model: S): ODataResponse<void> {
    return this.client.patch(this.path, model);
  }

  protected doMerge<S>(model: S): ODataResponse<void> {
    if (this.client.merge) {
      return this.client.merge(this.path, model);
    } else {
      return this.doPatch(model);
    }
  }

  protected doPut<S>(model: S): ODataResponse<void> {
    return this.client.put(this.path, model);
  }

  protected doDelete(): ODataResponse<void> {
    return this.client.delete(this.path);
  }

  protected doQuery<QR>(queryFn?: (builder: UB, qObject: Q) => void): ODataResponse<QR> {
    let url = this.path;

    if (queryFn) {
      const builder = this.createBuilder();
      queryFn(builder, this.qModel);
      url = builder.build();
    }

    return this.client.get(url);
  }
}
