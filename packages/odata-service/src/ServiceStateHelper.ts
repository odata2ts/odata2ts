import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataServiceOptionsInternal } from "./ODataServiceOptions";
import { BIG_NUMBERS_HEADERS, DEFAULT_HEADERS } from "./RequestHeaders.js";

export class ServiceStateHelper<out ClientType extends ODataHttpClient> {
  public readonly path: string;

  public constructor(
    public readonly client: ClientType,
    public basePath: string,
    public name?: string,
    public options: ODataServiceOptionsInternal = {},
  ) {
    this.path = basePath && name ? basePath + "/" + name : basePath ? basePath : name || "";
  }

  public addFullPath = (path?: string) => {
    return `${this.path ?? ""}${path ? "/" + path : ""}`;
  };

  public getDefaultHeaders = () => {
    return this.options.bigNumbersAsString ? BIG_NUMBERS_HEADERS : DEFAULT_HEADERS;
  };

  public isUrlNotEncoded = () => {
    return !!this.options.noUrlEncoding;
  };
}
