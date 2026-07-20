import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { CollectionQueryBuilderV2, ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";

export interface UrlBuilderRequestCmdOptionsV2<ResponseStructure, DataStructure = undefined>
  extends RequestCmdOptions<ResponseStructure, DataStructure> {
  /**
   * HTTP method for this request. Defaults to GET, the only method relevant for plain `.query()` use.
   * Write operations (create/update/patch/add) that also shape their response via $select/$expand
   * supply PUT/PATCH/POST here.
   */
  method?: ODataHttpMethods;
  /**
   * Request payload, e.g. the entity being created or updated. Irrelevant for GET.
   */
  data?: DataStructure;
}

export class UrlBuilderRequestCmdV2<
  ClientType extends ODataHttpClient,
  ResponseStructure,
  Q extends QueryObjectModel,
  Builder extends ModelQueryBuilderV2<Q> = CollectionQueryBuilderV2<Q>,
  DataStructure = undefined,
> extends RequestCmd<ClientType, ResponseStructure, DataStructure> {
  constructor(
    protected client: ClientType,
    protected urlBuilder: Builder,
    protected q: Q,
    protected options: UrlBuilderRequestCmdOptionsV2<ResponseStructure, DataStructure> = {},
  ) {
    super(client, options.method ?? ODataHttpMethods.Get, options.data, options);
  }

  public getUrl(): string {
    return this.urlBuilder.build();
  }

  /**
   * Allow for URL manipulation by creating an entirely new RequestCmd.
   *
   * @param modFunction the function to modify the URL
   */
  public addToQuery(modFunction: (urlBuilder: Builder, q: Q) => Builder) {
    if (!modFunction) {
      throw new Error("changeUrl requires the modification function as first argument!");
    }
    const builder = modFunction(this.urlBuilder.clone() as Builder, this.q);

    return new UrlBuilderRequestCmdV2<ClientType, ResponseStructure, Q, Builder, DataStructure>(
      this.client,
      builder,
      this.q,
      this.options,
    );
  }
}
