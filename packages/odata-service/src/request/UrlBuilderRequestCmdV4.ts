import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";

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
   * Allow for URL manipulation by creating a new RequestCmd.
   *
   * @param modFunction the function to modify the URL
   */
  public withNewUrl(modFunction: (urlBuilder: ODataQueryBuilderV4<Q>, q: Q) => ODataQueryBuilderV4<Q>) {
    if (!modFunction) {
      throw new Error("changeUrl requires the modification function as first argument!");
    }
    const builder = modFunction(this.urlBuilder.clone(), this.q);

    return new UrlBuilderRequestCmdV4(this.client, builder, this.q, this.options);
  }
}
