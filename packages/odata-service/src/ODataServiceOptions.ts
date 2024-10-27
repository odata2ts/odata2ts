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
  subtype?: boolean;
}
