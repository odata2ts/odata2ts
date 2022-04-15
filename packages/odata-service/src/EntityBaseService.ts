import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { ODataClient } from "@odata2ts/odata-client-api";

export abstract class EntityBaseService<Q extends QueryObject> {
  protected constructor(protected client: ODataClient, protected path: string, protected qModel: Q) {}

  protected createBuilder(): ODataUriBuilder<Q> {
    return ODataUriBuilder.create(this.path, this.qModel);
  }

  public getPath() {
    return this.path;
  }

  public getQObject() {
    return this.qModel;
  }

  protected getQueryUrl(queryFn?: (builder: ODataUriBuilder<Q>, qObject: Q) => void): string {
    let url = this.path;

    if (queryFn) {
      const builder = this.createBuilder();
      queryFn(builder, this.qModel);
      url = builder.build();
    }

    return url;
  }
}
