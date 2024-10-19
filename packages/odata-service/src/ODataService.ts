import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ServiceStateHelper } from "./ServiceStateHelper.js";

export interface ODataServiceOptions {
  /**
   * By default, specific parts of the URL are encoded by odata2ts.
   * However, there exist servers which cannot handle URL encoding (see issue #324) and this
   * option allows to switch off URL encoding entirely.
   */
  noUrlEncoding?: boolean;
}

/**
 * Extra interface for the bigNumbersAsString option.
 * On the one hand it is only needed for v4. On the other hand this must be set internally
 * as it plays together with converters, which are handled by the generator, not at runtime.
 */
export interface ODataServiceOptionsInternal extends ODataServiceOptions {
  bigNumbersAsString?: boolean;
}

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
