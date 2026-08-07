import { ODataVersionV4 } from "@odata2ts/odata-core";

export interface ODataServiceOptions {
  /**
   * By default, the required parts of the URL are automatically encoded by odata2ts.
   * However, there exist servers which cannot handle URL encoding (see issue #324) and this
   * option allows to switch off URL encoding entirely.
   * Of course, it's super handy for tests as well.
   */
  noUrlEncoding?: boolean;
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
}
