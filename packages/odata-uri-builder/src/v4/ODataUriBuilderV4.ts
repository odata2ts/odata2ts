import { ODataUriBuilderConfig } from "../internal";
import { ODataUriBuilderV4Base } from "./ODataUriBuilderV4Base";
import { QPath, QueryObject } from "@odata2ts/odata-query-objects";

/**
 * Create an OData URI string in a typesafe way by facilitating generated query objects.
 */
export class ODataUriBuilderV4<Q extends QueryObject> extends ODataUriBuilderV4Base<Q> {
  /**
   * Create an UriBuilder by passing in a query object, which already contains the base path
   * to the OData service & the given entity.
   *
   * Example:
   * ODataUriBuilder.create("people", qPerson)
   *   .select(...)
   *   .filter(qPerson.age.greaterThan(...))
   *   ...
   *   .build()
   *
   * @param path base path to
   * @param qEntity the query object
   * @param config optionally pass a configuration
   * @returns a UriBuilder
   */
  static create<Q extends QueryObject>(path: string, qEntity: Q, config?: ODataUriBuilderConfig) {
    return new ODataUriBuilderV4<Q>(path, qEntity, config);
  }

  /**
   * Add the count to the response.
   *
   * @param doCount explicitly specify if counting should be done
   * @returns this query builder
   */
  public count(doCount?: boolean) {
    this.itemsCount = doCount === undefined || doCount;
    return this;
  }

  /**
   * Group by clause for properties.
   * Uses system query option $apply.
   *
   * It's okay to pass null or undefined, these values are automatically filtered.
   *
   * @param props
   */
  public groupBy(...props: Array<keyof Q | null | undefined>) {
    if (props && props.length) {
      this.groupBys.push(
        ...props
          .filter((p): p is keyof Q => !!p)
          .map((p) => {
            return (this.entity[p] as unknown as QPath).getPath();
          })
      );
    }
    return this;
  }

  /**
   * V4 free text search option, where the server decides how to apply the search value.
   * Uses system query option $search.
   *
   * @param term
   */
  public search(term: string | undefined | null) {
    this.searchTerm = term || undefined;

    return this;
  }

  protected getSearchResult(): string | undefined {
    const term = this.searchTerm?.trim();
    // single word is a term (literal value), multiple terms are a phrase (quoted value with double quotes)
    return !term ? undefined : term.indexOf(" ") > -1 ? `"${this.searchTerm}"` : this.searchTerm;
  }
}
