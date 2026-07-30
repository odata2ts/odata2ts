import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataVersionV4 } from "@odata2ts/odata-core";
import { ODataServiceOptionsInternal } from "./ODataServiceOptions";
import { BIG_NUMBERS_HEADERS, DEFAULT_HEADERS, getODataVersionHeaders } from "./RequestHeaders.js";

export class ServiceStateHelper<out ClientType extends ODataHttpClient, V extends ODataVersionV4 = "4.0"> {
  public readonly path: string;

  public constructor(
    public readonly client: ClientType,
    public basePath: string,
    public name?: string,
    public options: ODataServiceOptionsInternal<V> = {},
  ) {
    this.path = basePath && name ? basePath + "/" + name : basePath ? basePath : name || "";
  }

  public addFullPath = (path?: string) => {
    return `${this.path ?? ""}${path ? "/" + path : ""}`;
  };

  public getDefaultHeaders = () => {
    return this.options.bigNumbersAsString ? BIG_NUMBERS_HEADERS : DEFAULT_HEADERS;
  };

  /**
   * Only to be added to requests carrying a body, see {@link getODataVersionHeaders}.
   */
  public getVersionHeaders = () => {
    return getODataVersionHeaders(this.options.odataVersionV4);
  };

  public isUrlNotEncoded = () => {
    return !!this.options.noUrlEncoding;
  };
}
