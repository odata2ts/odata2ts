import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { CollectionQueryBuilderV4, ModelQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { RequestCmdOptions } from "./RequestCmd";
import { UrlBuilderRequestCmdV4 } from "./UrlBuilderRequestCmdV4";

/**
 * A V4 request which modifies the resource its query builder addresses - `create`, `update` and `patch`.
 *
 * Reads and writes share {@link UrlBuilderRequestCmdV4}, so the two controls over optimistic concurrency
 * live here rather than there: they mean nothing on a `query`.
 */
export class UrlBuilderWriteRequestCmdV4<
  ResponseStructure,
  Q extends QueryObjectModel,
  Builder extends ModelQueryBuilderV4<Q> = CollectionQueryBuilderV4<Q>,
  DataStructure = undefined,
> extends UrlBuilderRequestCmdV4<ResponseStructure, Q, Builder, DataStructure> {
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
   * Write regardless of who else changed the resource, by sending `If-Match: *` (OData V4.01 Part 1,
   * §8.2.1). Services may reject it.
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

    const clone = new UrlBuilderWriteRequestCmdV4<ResponseStructure, Q, Builder, DataStructure>(
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
