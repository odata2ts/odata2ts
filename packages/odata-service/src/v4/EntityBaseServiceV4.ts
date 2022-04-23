import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV4 } from "@odata2ts/odata-uri-builder";
import { ODataClient, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";

export abstract class EntityBaseServiceV4<T, Q extends QueryObject, QueryResponse> {
  protected constructor(protected client: ODataClient, protected path: string, protected qModel: Q) {}

  protected createBuilder(): ODataUriBuilderV4<Q> {
    return ODataUriBuilderV4.create(this.path, this.qModel);
  }

  public getPath() {
    return this.path;
  }

  public getQObject() {
    return this.qModel;
  }

  protected doPost(model: T): ODataResponse<ODataModelResponse<T>> {
    return this.client.post(this.path, model);
  }

  public doPatch(model: Partial<T>): ODataResponse<void> {
    return this.client.patch(this.path, model);
  }

  protected doPut(model: T): ODataResponse<void> {
    return this.client.put(this.path, model);
  }

  protected doDelete(): ODataResponse<void> {
    return this.client.delete(this.path);
  }

  protected doQuery(queryFn?: (builder: ODataUriBuilderV4<Q>, qObject: Q) => void): ODataResponse<QueryResponse> {
    let url = this.path;

    if (queryFn) {
      const builder = this.createBuilder();
      queryFn(builder, this.qModel);
      url = builder.build();
    }

    return this.client.get(url);
  }
}
