import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";

export class UrlRequestCmd<ResponseStructure, DataStructure = undefined> extends RequestCmd<
  ResponseStructure,
  DataStructure
> {
  constructor(
    client: ODataHttpClient,
    method: ODataHttpMethods,
    protected url: string,
    data?: DataStructure,
    options: RequestCmdOptions<ResponseStructure, DataStructure> = {},
  ) {
    super(client, method, data, options);
  }

  public getUrl(): string {
    return this.url;
  }

  /**
   * Allow for URL manipulation by creating an entirely new RequestCmd.
   *
   * @param url the new URL
   */
  public withUrl(url: string) {
    if (!url || !url.trim()) {
      throw new Error("withUrl requires a new URL!");
    }

    return new UrlRequestCmd<ResponseStructure, DataStructure>(this.client, this.method, url, this.data, this.options);
  }
}
