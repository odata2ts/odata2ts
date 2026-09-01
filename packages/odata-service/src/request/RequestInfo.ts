import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { CacheKeyState } from "../cacheKey/CacheKeyState";

export class RequestInfo<DataStructure = undefined> {
  public constructor(
    readonly method: ODataHttpMethods,
    readonly url: string,
    readonly headers?: Record<string, string>,
    readonly data?: DataStructure,
    /**
     * What resource this request addresses, in the form a cache key is built from.
     *
     * Carried on the request rather than beside it, deliberately: a request converter must be able to
     * change the resource identity in the *same* immutable step that rewrites `url`, `method` and `data`,
     * so composition falls out of the converter chain's existing `reduce`. No mutator, no escape hatch.
     */
    readonly cacheKeyState?: CacheKeyState,
  ) {}

  public withData<NewDataStructure = DataStructure>(data: NewDataStructure) {
    return new RequestInfo(this.method, this.url, this.headers, data, this.cacheKeyState);
  }
}
