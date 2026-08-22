import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { CollectionQueryBuilderV2, ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { RequestCmdOptions } from "./RequestCmd";
import { UrlBuilderRequestCmdV2 } from "./UrlBuilderRequestCmdV2";

/**
 * A V2 request which modifies the resource its query builder addresses - the V2 counterpart of
 * {@link UrlBuilderWriteRequestCmdV4}. V2 updates travel as MERGE, and the `If-Match` header rides
 * alongside the `X-Http-Method` one.
 */
export class UrlBuilderWriteRequestCmdV2<
  ResponseStructure,
  Q extends QueryObjectModel,
  Builder extends ModelQueryBuilderV2<Q> = CollectionQueryBuilderV2<Q>,
  DataStructure = undefined,
> extends UrlBuilderRequestCmdV2<ResponseStructure, Q, Builder, DataStructure> {
  constructor(
    client: ODataHttpClient,
    method: ODataHttpMethods,
    urlBuilder: Builder,
    q: Q,
    data?: DataStructure,
    options: RequestCmdOptions<ResponseStructure, DataStructure> = {},
  ) {
    super(client, method, urlBuilder, q, data, options);
  }

  /**
   * State the ETag to write against, instead of letting odata2ts look it up - see
   * {@link UrlWriteRequestCmd.withETag}.
   */
  public withETag(etag: string) {
    this.etagOverride = etag;
    return this;
  }

  /**
   * Write regardless of who else changed the resource, by sending `If-Match: *`. V2 states the same rule
   * as V4 here - see [OData V2, Operations](https://www.odata.org/documentation/odata-version-2-0/operations/).
   */
  public ignoreETag() {
    this.etagOverride = "*";
    return this;
  }

  /**
   * Overridden so the clone is a write command too: the inherited version names its own class, and would
   * hand back a command that has silently forgotten the ETag just stated on this one.
   */
  public addToQuery(modFunction: (urlBuilder: Builder, q: Q) => Builder) {
    if (!modFunction) {
      throw new Error("changeUrl requires the modification function as first argument!");
    }
    const builder = modFunction(this.urlBuilder.clone() as Builder, this.q);

    const clone = new UrlBuilderWriteRequestCmdV2<ResponseStructure, Q, Builder, DataStructure>(
      this.client,
      this.method,
      builder,
      this.q,
      this.data,
      this.options,
    );
    clone.etagOverride = this.etagOverride;
    return clone;
  }
}
