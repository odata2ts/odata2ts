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
