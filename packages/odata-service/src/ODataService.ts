import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataVersionV4 } from "@odata2ts/odata-core";
import { ODataServiceOptionsInternal } from "./ODataServiceOptions";
import { ServiceStateHelper } from "./ServiceStateHelper.js";

/**
 * The base class for the main OData service client.
 */
export class ODataService<in out ClientType extends ODataHttpClient, V extends ODataVersionV4 = "4.0"> {
  protected readonly __base: ServiceStateHelper<any, V>;

  /**
   * Takes the internal options, so that generated main services can pass on what the generator decided,
   * e.g. the OData version. Users only get to see the public options via the generated service.
   */
  constructor(client: ClientType, basePath: string, options?: ODataServiceOptionsInternal<ODataVersionV4>) {
    if (!client) {
      throw new Error("[client] must be supplied to ODataService!");
    }
    if (!basePath || !basePath.trim()) {
      throw new Error("[basePath] must be supplied to ODataService!");
    }
    // the version is data at runtime; which one the types assume is decided by V, i.e. by the generator
    this.__base = new ServiceStateHelper(client, basePath, undefined, options as ODataServiceOptionsInternal<V>);
  }

  public getPath(): string {
    return this.__base.path;
  }
}
