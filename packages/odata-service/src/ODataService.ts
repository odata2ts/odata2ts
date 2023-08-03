import { ODataHttpClient } from "@odata2ts/http-client-api";

import { BIG_NUMBERS_HEADERS, DEFAULT_HEADERS } from "./RequestHeaders";

export class ODataService<ClientType extends ODataHttpClient> {
  constructor(protected client: ClientType, protected basePath: string, protected bigNumbersAsString: boolean = false) {
    if (!client) {
      throw new Error("[client] must be supplied to ODataService!");
    }
    if (!basePath || !basePath.trim()) {
      throw new Error("[basePath] must be supplied to ODataService!");
    }
  }

  public getPath(): string {
    return this.basePath;
  }

  protected addFullPath(path?: string) {
    return `${this.getPath()}${path ? "/" + path : ""}`;
  }

  protected getDefaultHeaders() {
    return this.bigNumbersAsString ? BIG_NUMBERS_HEADERS : DEFAULT_HEADERS;
  }
}
