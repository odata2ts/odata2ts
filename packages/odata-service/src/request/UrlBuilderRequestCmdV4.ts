import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { CollectionQueryBuilderV4, ModelQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";
import { GetToPostConverter } from "./RequestHelper";

export interface UrlBuilderRequestCmdOptions<ResponseStructure, DataStructure = undefined>
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

export class UrlBuilderRequestCmdV4<
  ClientType extends ODataHttpClient,
  ResponseStructure,
  Q extends QueryObjectModel,
  Builder extends ModelQueryBuilderV4<Q> = CollectionQueryBuilderV4<Q>,
  DataStructure = undefined,
> extends RequestCmd<ClientType, ResponseStructure, DataStructure> {
  constructor(
    protected client: ClientType,
    protected urlBuilder: Builder,
    protected q: Q,
    protected options: UrlBuilderRequestCmdOptions<ResponseStructure, DataStructure> = {},
  ) {
    super(client, options.method ?? ODataHttpMethods.Get, options.data, options);
  }

  public getUrl(): string {
    return this.urlBuilder.build();
  }

  /**
   * Add to the existing query builder, thereby creating a clone.
   *
   * @param modFunction the function to modify the URL
   * @returns
   */
  public addToQuery(modFunction: (urlBuilder: Builder, q: Q) => Builder) {
    if (!modFunction) {
      throw new Error("changeUrl requires the modification function as first argument!");
    }
    const builder = modFunction(this.urlBuilder.clone() as Builder, this.q);

    return new UrlBuilderRequestCmdV4<ClientType, ResponseStructure, Q, Builder, DataStructure>(
      this.client,
      builder,
      this.q,
      this.options,
    );
  }

  /**
   * Transform this GET request into a POST request by appending a special request converter:
   * - GET => POST
   * - url?params => url/$request
   * - data: undefined => data: ?params
   * - headers => add: content-type = text plain
   */
  public asPostRequest() {
    if (this.getUrl().indexOf("?") > -1) {
      this.appendRequestConverter(GetToPostConverter);
    }

    return this;
  }
}
