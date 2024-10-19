import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataServiceOptions } from "./ODataServiceOptions";
import { ServiceStateHelper } from "./ServiceStateHelper.js";

/**
 * The base class for the main OData service client.
 */
export class ODataService<in out ClientType extends ODataHttpClient> {
  protected readonly __base: ServiceStateHelper<any>;

  constructor(client: ClientType, basePath: string, options?: ODataServiceOptions) {
    if (!client) {
      throw new Error("[client] must be supplied to ODataService!");
    }
    if (!basePath || !basePath.trim()) {
      throw new Error("[basePath] must be supplied to ODataService!");
    }
    this.__base = new ServiceStateHelper(client, basePath, undefined, options);
  }

  public getPath(): string {
    return this.__base.path;
  }
}
