import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { CollectionQueryBuilderV4, ModelQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";
import { GetToPostConverter } from "./RequestHelper";

export class UrlBuilderRequestCmdV4<
  ClientType extends ODataHttpClient,
  ResponseStructure,
  Q extends QueryObjectModel,
  Builder extends ModelQueryBuilderV4<Q> = CollectionQueryBuilderV4<Q>,
  DataStructure = undefined,
> extends RequestCmd<ClientType, ResponseStructure, DataStructure> {
  constructor(
    protected client: ClientType,
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
      this.method,
      builder,
      this.q,
      this.data,
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
