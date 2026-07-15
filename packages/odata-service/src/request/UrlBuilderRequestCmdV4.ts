import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";
import { GetToPostConverter } from "./RequestHelper";

export type UrlBuilderRequestCmdOptions<ResponseStructure> = Omit<
  RequestCmdOptions<ResponseStructure, undefined>,
  "mainRequestConverter"
>;

export class UrlBuilderRequestCmdV4<
  ClientType extends ODataHttpClient,
  ResponseStructure,
  Q extends QueryObjectModel,
> extends RequestCmd<ClientType, ResponseStructure> {
  constructor(
    protected client: ClientType,
    protected urlBuilder: ODataQueryBuilderV4<Q>,
    protected q: Q,
    protected options: UrlBuilderRequestCmdOptions<ResponseStructure> = {},
  ) {
    super(client, ODataHttpMethods.Get, undefined, options);
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
  public addToQuery(modFunction: (urlBuilder: ODataQueryBuilderV4<Q>, q: Q) => ODataQueryBuilderV4<Q>) {
    if (!modFunction) {
      throw new Error("changeUrl requires the modification function as first argument!");
    }
    const builder = modFunction(this.urlBuilder.clone(), this.q);

    return new UrlBuilderRequestCmdV4(this.client, builder, this.q, this.options);
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
