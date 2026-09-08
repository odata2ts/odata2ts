import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { CollectionQueryBuilderV2, ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";

export class UrlBuilderRequestCmdV2<
  ResponseStructure,
  Q extends QueryObjectModel,
  Builder extends ModelQueryBuilderV2<Q> = CollectionQueryBuilderV2<Q>,
  DataStructure = undefined,
> extends RequestCmd<ResponseStructure, DataStructure> {
  constructor(
    protected client: ODataHttpClient,
    method: ODataHttpMethods,
    protected urlBuilder: Builder,
    protected q: Q,
    data?: DataStructure,
    protected options: RequestCmdOptions<ResponseStructure, DataStructure> = {},
  ) {
    super(client, method, data, options);
  }

  public getUrl(): string {
    return this.urlBuilder.build();
  }

  /**
   * Allow for URL manipulation by creating an entirely new RequestCmd.
   *
   * `queryParams` is re-snapshotted off the resulting builder rather than carried over from `this.options`:
   * it was itself only ever a snapshot of the builder at construction time (see the service methods that
   * set it), so carrying the old one forward here would leave the new command's cache key blind to whatever
   * `modFunction` just changed - a stale `$select`/`$expand` restriction next to a URL that no longer
   * matches it.
   *
   * @param modFunction the function to modify the URL
   */
  public addToQuery(modFunction: (urlBuilder: Builder, q: Q) => Builder) {
    if (!modFunction) {
      throw new Error("changeUrl requires the modification function as first argument!");
    }
    const builder = modFunction(this.urlBuilder.clone() as Builder, this.q);

    return new UrlBuilderRequestCmdV2<ResponseStructure, Q, Builder, DataStructure>(
      this.client,
      this.method,
      builder,
      this.q,
      this.data,
      { ...this.options, queryParams: builder.getCacheKeyParams() },
    );
  }
}
