import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { RequestCmdOptions } from "./RequestCmd";
import { GetToPostConverter } from "./RequestHelper";
import { UrlRequestCmd } from "./UrlRequestCmd";

export class UrlGetRequestCmd<ResponseStructure> extends UrlRequestCmd<ResponseStructure> {
  constructor(
    protected client: ODataHttpClient,
    protected url: string,
    protected options: RequestCmdOptions<ResponseStructure, undefined> = {},
  ) {
    super(client, ODataHttpMethods.Get, url, undefined, options);
  }

  /**
   * Transform this GET request into a POST request by appending a special request converter:
   * - GET => POST
   * - url?params => url/$request
   * - data: undefined => data: ?params
   * - headers => add: content-type = text plain
   */
  public asPostRequest() {
    if (this.url.indexOf("?") > -1) {
      this.appendRequestConverter(GetToPostConverter);
    }

    return this;
  }
}
