import { BatchFormat } from "@odata2ts/http-client-api";
import { ODataVersionV4 } from "@odata2ts/odata-core";

export interface ODataServiceOptions {
  /**
   * By default, the required parts of the URL are automatically encoded by odata2ts.
   * However, there exist servers which cannot handle URL encoding (see issue #324) and this
   * option allows to switch off URL encoding entirely.
   * Of course, it's super handy for tests as well.
   */
  noUrlEncoding?: boolean;
  /**
   * How the service's `$batch` requests are sent, decided by the application in `odata2ts.config.ts`.
   * The whole feature lives on the generated main service's {@link ODataService.batch}.
   */
  batch?: BatchOptions;
}

/**
 * The `$batch` options, written by the generator into every generated main service's options.
 *
 * - `format` - the wire format for the batch as a whole. Defaults to `"multipart"`, which works for every
 *   OData version a generated service can address. `"json"` is the richer format and the one a server is
 *   most likely to accept - but only where its `$batch` actually speaks it, and a V2 service never does, so
 *   on one `format: "json"` is refused (see {@link ODataService.batch}).
 * - `disabled` - turns the feature off for this service: `batch()` throws rather than building a request.
 */
export interface BatchOptions {
  format?: BatchFormat;
  disabled?: boolean;
}

export interface ODataServiceOptionsInternal<V extends ODataVersionV4 = "4.0"> extends ODataServiceOptions {
  /**
   * On the one hand it is only needed for v4. On the other hand this must be set internally
   * as it plays together with converters, which are handled by the generator, not at runtime.
   */
  bigNumbersAsString?: boolean;
  /**s
   * Marks service as subtype service.
   */
  subtype?: boolean;
  /**
   * The OData version to declare on requests carrying a body and to use for control information in
   * request payloads. Only relevant for V4, defaults to 4.0.
   *
   * Just like bigNumbersAsString this is set internally, since it is decided by the generator.
   */
  odataVersionV4?: V;
  /**
   * Modifying this resource requires an ETag: the service states `Core.OptimisticConcurrency` for the
   * entity set or singleton exposing this type - or, in V2, a `ConcurrencyMode="Fixed"` property.
   *
   * Set by the generator per entity type, hence internal: it is a statement about the service, not
   * something an application chooses.
   */
  concurrencyControlled?: boolean;
  /**
   * The OData version this service addresses, as decided by the generator - hence internal, and set only
   * for V2. It is the one thing nothing else at runtime can say: whether a `format: "json"` batch is
   * refused for this service, since V2 has no JSON `$batch` (see {@link ODataService.batch}).
   */
  odataVersion?: "2.0" | "4.0" | "4.01";
}

export interface ODataServiceOptionsInternalV2<AsV4 extends boolean = false> extends ODataServiceOptions {
  /**
   * Reshapes every response of this V2 service as its V4 equivalent - see {@link EntityResponseConverterV2},
   * {@link CollectionResponseConverterV2}, {@link ComplexResponseConverterV2} and
   * {@link ValueResponseConverterV2}, which all take the very same flag.
   *
   * Set internally, since it is decided by the generator: the response types every V2 service class is
   * generic over (`AsV4`) are baked in at generation time and must agree with this runtime flag, which is
   * what actually picks the converter behaviour.
   */
  v2ResponseAsV4?: AsV4;
  /**
   * Modifying this resource requires an ETag: the service states `Core.OptimisticConcurrency` for the
   * entity set or singleton exposing this type - or, in V2, a `ConcurrencyMode="Fixed"` property.
   *
   * Set by the generator per entity type, hence internal: it is a statement about the service, not
   * something an application chooses.
   */
  concurrencyControlled?: boolean;
}
