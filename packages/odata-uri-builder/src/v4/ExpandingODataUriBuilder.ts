import { ODataUriBuilderV4Base } from "./ODataUriBuilderV4Base";
import { QueryObject } from "@odata2ts/odata-query-objects";

/**
 * Builder for expanded entities or entity collections.
 */
export class ExpandingODataUriBuilder<Q extends QueryObject> extends ODataUriBuilderV4Base<Q> {
  public static create<Q extends QueryObject>(property: string, qEntity: Q /*, config?: ODataUriBuilderConfig*/) {
    // must never be encoded, since it is part of $expand
    return new ExpandingODataUriBuilder<Q>(property, qEntity, { unencoded: true });
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

  protected getSearchResult(): string | undefined {
    return undefined;
  }
}
