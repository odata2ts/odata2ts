import { ODataHttpClient } from "@odata2ts/http-client-api";

import { ServiceStateHelper } from "./ServiceStateHelper";

export class ODataService<ClientType extends ODataHttpClient> {
  protected readonly __base: ServiceStateHelper<any>;

  constructor(client: ClientType, basePath: string, bigNumbersAsString: boolean = false) {
    if (!client) {
      throw new Error("[client] must be supplied to ODataService!");
    }
    if (!basePath || !basePath.trim()) {
      throw new Error("[basePath] must be supplied to ODataService!");
    }
    this.__base = new ServiceStateHelper(client, basePath, undefined, bigNumbersAsString);
  }

  public getPath(): string {
    return this.__base.path;
  }
}
