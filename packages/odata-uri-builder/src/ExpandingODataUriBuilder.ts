import { ODataUriBuilderBase, ODataUriBuilderConfig } from "./internal";

/**
 * Builder for expanded entities or entity collections.
 */
export class ExpandingODataUriBuilder<Q> extends ODataUriBuilderBase<Q> {
  public static create<Q>(property: string, qEntity: Q, config?: ODataUriBuilderConfig) {
    return new ExpandingODataUriBuilder<Q>(property, qEntity, config);
  }

  private constructor(path: string, qEntity: Q, config?: ODataUriBuilderConfig) {
    super(path, qEntity, config);
  }

  /**
   * Build the final URI string for this expanded entity or entity collection.
   * This method is called internally.
   *
   * @returns the query string for this expanded entity or entity collection
   */
  public build(): string {
    const params = this.buildQuery(this.param);

    return this.path + (params.length ? `(${params.join(";")})` : "");
  }
}
