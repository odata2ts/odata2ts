import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";

export class UrlBuilderRequestCmdV2<
  ClientType extends ODataHttpClient,
  ResponseStructure,
  Q extends QueryObjectModel,
> extends RequestCmd<ClientType, ResponseStructure> {
  constructor(
    protected client: ClientType,
    protected urlBuilder: ODataQueryBuilderV2<Q>,
    protected q: Q,
    protected options: RequestCmdOptions<ResponseStructure, undefined> = {},
  ) {
    super(client, ODataHttpMethods.Get, undefined, options);
  }

  public getUrl(): string {
    return this.urlBuilder.build();
  }

  /**
   * Allow for URL manipulation by creating an entirely new RequestCmd.
   *
   * @param modFunction the function to modify the URL
   */
  public addToQuery(modFunction: (urlBuilder: ODataQueryBuilderV2<Q>, q: Q) => ODataQueryBuilderV2<Q>) {
    if (!modFunction) {
      throw new Error("changeUrl requires the modification function as first argument!");
    }
    const builder = modFunction(this.urlBuilder.clone(), this.q);

    return new UrlBuilderRequestCmdV2(this.client, builder, this.q, this.options);
  }
}
