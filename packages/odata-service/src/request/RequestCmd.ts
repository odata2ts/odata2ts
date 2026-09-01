import { HttpResponseModel, ODataHttpClient, ODataHttpMethods, ODataRequestConfig } from "@odata2ts/http-client-api";
import { MainResponseConverter } from "@odata2ts/odata-query-objects";
import { buildCacheKey, buildInvalidates, CacheKeyState } from "../cacheKey/index.js";
import { getHeaderETag } from "../ETagExtraction";
import { ODataConcurrencyError } from "../ODataConcurrencyError";
import { ODataResponseModel } from "../ODataResponseModel";
import { MainRequestConverter, RequestConverter } from "./converter/RequestConverter";
import { RequestConverterChain } from "./converter/RequestConverterChain";
import { ResponseConverter } from "./converter/ResponseConverter";
import { ResponseConverterChain } from "./converter/ResponseConverterChain";
import { NoInferConfig } from "./NoInferConfig";
import { RequestInfo } from "./RequestInfo";

/**
 * What a command needs in order to take part in optimistic concurrency control.
 *
 * Filled in by the service which creates the command, because only that service knows which resource is
 * addressed, whether it is under concurrency control, and how to read an ETag out of a response body of
 * its own OData version.
 */
export interface ConcurrencyOptions {
  /** The resource this command addresses; the key its ETag is stored under. */
  key: string;
  /** Whether the service states `Core.OptimisticConcurrency` for this resource. */
  controlled: boolean;
  /**
   * Every (key, ETag) pair the response body yields: at most one for an entity, one per row for a
   * collection. Left out where the body cannot carry one.
   */
  harvest?: (data: any) => Array<[string, string]>;
}

export interface RequestCmdOptions<ResponseStructure, DataStructure> {
  /**
   * Set headers for the request.
   */
  headers?: Record<string, string>;
  /**
   * Optimistic concurrency control for this request - see {@link ConcurrencyOptions}.
   */
  concurrency?: ConcurrencyOptions;
  /**
   * Sets the main request converter which converts from the user facing model
   * to the OData facing model.
   */
  mainRequestConverter?: MainRequestConverter<DataStructure, any>;
  /**
   * Sets the main response converter which converts from the OData facing model
   * to the user facing model.
   */
  mainResponseConverter?: MainResponseConverter<ResponseStructure, any>;
  /**
   * What resource this request addresses - see {@link CacheKeyState}. Absent where the client was
   * generated without `cacheKeys`, which is what makes {@link RequestCmd.cacheKey} optional.
   */
  cacheKeyState?: CacheKeyState;
  /**
   * The query's own restrictions, snapshotted off the query builder rather than parsed back out of the
   * URL. Set only by a read: these are what the *query* restricts the resource by, so a read is keyed
   * by them, while a write's builder - where it has one at all - only shapes the response it asks back,
   * never the identity of the resource it changes. `buildInvalidates` strips a resource's own params from
   * its key for the same reason, so a write folding its `$select`/`$expand` in here would buy nothing but
   * a mismatch between two identical writes that differ only in what they ask back.
   */
  queryParams?: Record<string, unknown>;
}

/**
 * Encapsulates an HTTP request to the OData server. Follows the Command Pattern.
 */
export abstract class RequestCmd<
  ResponseStructure,
  DataStructure = undefined,
  FinalResponseStructure = ResponseStructure,
> {
  private readonly requestConverter: RequestConverterChain<DataStructure>;
  private readonly responseConverter: ResponseConverterChain<ResponseStructure, FinalResponseStructure>;

  /**
   * An ETag the caller stated, or `"*"` where the caller chose to write past whatever is current. Set
   * through the write command classes; when present it wins over the store.
   */
  protected etagOverride?: string;

  private cachedCacheKey?: ReadonlyArray<unknown>;
  private cacheKeyComputed = false;

  public constructor(
    protected client: ODataHttpClient,
    protected method: ODataHttpMethods,
    protected data?: DataStructure,
    protected options: RequestCmdOptions<ResponseStructure, DataStructure> = {},
  ) {
    const { mainRequestConverter, mainResponseConverter } = options;

    this.requestConverter = new RequestConverterChain(mainRequestConverter);
    this.responseConverter = new ResponseConverterChain(mainResponseConverter);
  }

  /**
   * The unchanging URL of this command object.
   */
  public abstract getUrl(): string;

  /**
   * Get information about the request.
   * The data (if any) is presented with user facing typings.
   */
  public getInfo(): RequestInfo<DataStructure> {
    const { headers, cacheKeyState } = this.options;

    return new RequestInfo<DataStructure>(this.method, this.getUrl(), headers, this.data, cacheKeyState);
  }

  /**
   * Get base information about the request.
   * All request converters get applied.
   *
   * With regard to data (if any), it gets converted from the user facing model
   * to the OData facing model, for which we don't have any typings, so we use `any`.
   *
   */
  public getInfoConverted(): RequestInfo<any> {
    const request = this.getInfo();
    const converter = this.requestConverter;

    // no converters => no conversion
    if (!converter) {
      return request;
    }

    return converter.convert(request);
  }

  /**
   * The key this request's resource should be cached under - available before the request goes out, which
   * is when a cache needs it.
   *
   * Read through the converter chain, so any converter's effect on the resource identity is visible
   * without a second call. Lazy is required rather than stylistic: `getUrl()` cannot run from the base
   * constructor, because subclasses overriding it read parameter-property fields TypeScript assigns only
   * after `super()` returns.
   *
   * `undefined` means this client was not generated with `cacheKeys` - which a consuming application has
   * to handle anyway when it is shared across services.
   */
  public get cacheKey(): ReadonlyArray<unknown> | undefined {
    if (!this.cacheKeyComputed) {
      const state = this.getInfoConverted().cacheKeyState;
      this.cachedCacheKey = state && buildCacheKey(state, this.options.queryParams);
      this.cacheKeyComputed = true;
    }
    return this.cachedCacheKey;
  }

  /**
   * Add a new request converter at the beginning of the converter chain.
   * This converter can then handle the user facing data structures.
   *
   * @param converter
   * @returns itself in builder fashion
   */
  public prependRequestConverter(converter: RequestConverter<DataStructure>) {
    this.requestConverter.prependConverter(converter);

    return this;
  }

  /**
   * Add a new request converter at the end of the converter chain.
   * This converter can then handle the OData facing data structures.
   * Since we don't have any typings for this we use `any`.
   *
   * @param converter
   * @returns itself in builder fashion
   */
  public appendRequestConverter(converter: RequestConverter<any>) {
    this.requestConverter.appendConverter(converter);

    return this;
  }

  /**
   * Add a response converter to the beginning of the converter chain.
   * This converter can then handle the data structures as they are returned from OData.
   * Since we don't have any typings for this we use `any`.
   *
   * @param converter
   * @returns itself in builder fashion
   */
  public prependResponseConverter(converter: ResponseConverter<any, any>) {
    this.responseConverter.prependConverter(converter);

    return this;
  }

  /**
   * Add a response converter to the end of the converter chain.
   * This converter can then handle the data structures as they are returned for the user,
   * so with mapped property names and converted types.
   *
   * As the appended converter changes the final response structure, it is essential that
   * you follow the builder pattern to maintain the correct typings.
   *
   * @param converter
   * @returns itself in builder fashion
   */
  public appendResponseConverter<NewRespStructure>(
    converter: ResponseConverter<FinalResponseStructure, NewRespStructure>,
  ) {
    this.responseConverter.appendConverter<NewRespStructure>(converter);

    return this as unknown as RequestCmd<ResponseStructure, DataStructure, NewRespStructure>;
  }

  /**
   * Main method of this command object: Executes the request.
   *
   * The config type defaults to what every HTTP client understands - headers and URL params. Anything a
   * specific client adds on top of that is opted into by naming its config type, e.g.
   * `execute<FetchRequestConfig>({ credentials: "include" })`.
   *
   * @param requestConfig optional configuration
   */
  public async execute<RequestConfig extends ODataRequestConfig = ODataRequestConfig>(
    requestConfig?: NoInferConfig<RequestConfig>,
  ): Promise<ODataResponseModel<FinalResponseStructure>> {
    // apply request converters
    const request = this.applyConcurrency(this.getInfoConverted());

    // execute the request
    const response = await this.sendRequest(request, requestConfig);

    // apply response converters
    const converted = this.convertResponse(response);

    // harvest afterwards, deliberately: the property names a collection service builds its keys from are
    // the mapped, user-facing ones, which only exist once the converters have run
    this.updateConcurrency(response);

    return this.withInvalidates(converted, request.cacheKeyState);
  }

  /**
   * Attaches what this write makes stale - from the very same state the key is built from, so key and
   * invalidation set cannot drift apart. A read adds nothing: what it should be stored under is
   * {@link cacheKey}.
   */
  private withInvalidates(
    response: HttpResponseModel<FinalResponseStructure>,
    state: CacheKeyState | undefined,
  ): ODataResponseModel<FinalResponseStructure> {
    if (!state || this.method === ODataHttpMethods.Get) {
      return response;
    }
    return { ...response, invalidates: buildInvalidates(state) };
  }

  /**
   * Adds the `If-Match` header a write to a concurrency-controlled resource requires (OData V4.01 Part 1,
   * §8.3.1), or refuses the write where nothing is known: the service would answer `428` and change
   * nothing, so there is nothing to gain from sending it.
   */
  private applyConcurrency(request: RequestInfo<any>): RequestInfo<any> {
    const { concurrency } = this.options;
    if (!concurrency || this.method === ODataHttpMethods.Get) {
      return request;
    }

    // the store is consulted only where the service says an ETag is required. An ETag alone is no licence
    // to send `If-Match` - §11.4.1.1 is explicit that a service may hand one out purely for caching, and
    // sending it anyway would turn writes that succeed today into 412s. An ETag the caller stated is a
    // different matter: that is a decision, and it is honoured whatever the metadata says.
    const etag =
      this.etagOverride ?? (concurrency.controlled ? this.client.concurrency?.resolve(concurrency.key) : undefined);
    if (!etag) {
      if (concurrency.controlled) {
        throw new ODataConcurrencyError(concurrency.key);
      }
      return request;
    }

    return new RequestInfo(
      request.method,
      request.url,
      { ...request.headers, "If-Match": etag },
      request.data,
      request.cacheKeyState,
    );
  }

  /**
   * Keeps the ETag store in step with what the service just said.
   *
   * A read stores what it learned. A write takes the new ETag where the service handed one back and
   * forgets the old one otherwise - keeping it would fail the next write with a `412` although nobody
   * else had touched the resource. A delete forgets it either way.
   */
  private updateConcurrency(response: HttpResponseModel<any>): void {
    const { concurrency } = this.options;
    const handler = this.client.concurrency;
    if (!concurrency || !handler) {
      return;
    }

    if (this.method === ODataHttpMethods.Delete) {
      handler.evict(concurrency.key);
      return;
    }

    const headerETag = getHeaderETag(response.headers);
    if (headerETag) {
      handler.set(concurrency.key, headerETag);
    } else if (this.method !== ODataHttpMethods.Get) {
      handler.evict(concurrency.key);
    }

    // the body may say more than the header does - a collection states one ETag per row
    for (const [key, etag] of concurrency.harvest?.(response.data) ?? []) {
      handler.set(key, etag);
    }
  }

  /**
   * Hands the prepared request over to the HTTP client.
   *
   * Overridden by commands whose payload cannot travel the generic JSON path: binary data needs the
   * client's dedicated blob operations, which pass the body through untouched and read the response as
   * binary instead of parsing it as JSON.
   *
   * @param request the request with all request converters applied
   * @param requestConfig optional configuration
   */
  protected sendRequest(
    request: RequestInfo<any>,
    requestConfig?: ODataRequestConfig,
  ): Promise<HttpResponseModel<any>> {
    return this.client.request<ResponseStructure>(
      request.url,
      request.method,
      request.data,
      requestConfig,
      request.headers,
    );
  }

  private convertResponse(response: HttpResponseModel<any>) {
    const converter = this.responseConverter;
    if (!converter) {
      return response as HttpResponseModel<FinalResponseStructure>;
    }

    return converter.convert(response);
  }
}
