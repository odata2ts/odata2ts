import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataVersionV4 } from "@odata2ts/odata-core";
import { CacheKeyState } from "./cacheKey/index.js";
import { ODataServiceOptionsInternal } from "./ODataServiceOptions";
import { BIG_NUMBERS_HEADERS, DEFAULT_HEADERS, getODataVersionHeaders } from "./RequestHeaders.js";

export class ServiceStateHelper<V extends ODataVersionV4 = "4.0"> {
  public readonly path: string;

  public constructor(
    public readonly client: ODataHttpClient,
    public basePath: string,
    public name?: string,
    public options: ODataServiceOptionsInternal<V> = {},
    /**
     * What resource this service addresses, in the form a cache key is built from.
     *
     * Stored verbatim; nothing is computed from it here, and it is never derived from `name` or `path`:
     * `name` for a `byId`-created service is the rendered key predicate, which must not appear in a key.
     */
    public readonly cacheKeyState?: CacheKeyState,
  ) {
    this.path = basePath && name ? basePath + "/" + name : basePath ? basePath : name || "";
  }

  public addFullPath = (path?: string) => {
    return `${this.path ?? ""}${path ? "/" + path : ""}`;
  };

  public getDefaultHeaders = () => {
    const base = this.options.bigNumbersAsString ? BIG_NUMBERS_HEADERS : DEFAULT_HEADERS;
    // An explicitly configured version is announced on every request, reads included: it governs how the
    // service answers just as much as how it reads a payload, and a response in the other version's shape
    // is precisely what the generated response models cannot describe.
    //
    // Only when it was configured, though. This helper is shared with V2, where the option is never set and
    // an `OData-Version: 4.x` header would be plainly wrong - and it cannot tell that case apart from a V4
    // service left on the 4.0 default, since the generator writes the option only for 4.01.
    return this.options.odataVersionV4 ? { ...base, ...getODataVersionHeaders(this.options.odataVersionV4) } : base;
  };

  /**
   * The version declared on requests which carry a body, where it governs how the service reads the payload
   * - see {@link getODataVersionHeaders}. Unlike {@link getDefaultHeaders} this falls back to 4.0, so a V4
   * request with a body always states a version.
   */
  public getVersionHeaders = () => {
    return getODataVersionHeaders(this.options.odataVersionV4);
  };

  public isUrlNotEncoded = () => {
    return !!this.options.noUrlEncoding;
  };

  /**
   * Whether modifying this resource requires an ETag - the generator writes the flag into the options of
   * a service whose entity set states `Core.OptimisticConcurrency`.
   */
  public isConcurrencyControlled = () => {
    return !!this.options.concurrencyControlled;
  };
}
