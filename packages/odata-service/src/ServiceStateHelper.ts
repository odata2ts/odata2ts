import { ODataHttpClient } from "@odata2ts/http-client-api";

import { BIG_NUMBERS_HEADERS, DEFAULT_HEADERS } from "./RequestHeaders.js";

export class ServiceStateHelper<out ClientType extends ODataHttpClient> {
  public readonly path: string;

  public constructor(
    public readonly client: ClientType,
    basePath: string,
    public name?: string,
    public readonly bigNumbersAsString: boolean = false
  ) {
    this.path = basePath && name ? basePath + "/" + name : basePath ? basePath : name || "";
  }

  public addFullPath = (path?: string) => {
    return `${this.path ?? ""}${path ? "/" + path : ""}`;
  };

  public getDefaultHeaders = () => {
    return this.bigNumbersAsString ? BIG_NUMBERS_HEADERS : DEFAULT_HEADERS;
  };
}
