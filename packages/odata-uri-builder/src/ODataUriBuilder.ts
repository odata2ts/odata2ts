import { QEntityModel } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderBase, ODataUriBuilderConfig } from "./internal";

/**
 * Create an OData URI string in a typesafe way by facilitating generated query objects.
 */
export class ODataUriBuilder<T> extends ODataUriBuilderBase<T> {
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
  static create<T>(path: string, qEntity: QEntityModel<T>, config?: ODataUriBuilderConfig) {
    return new ODataUriBuilder<T>(path, qEntity, config);
  }

  protected readonly entity: QEntityModel<T>;

  private constructor(path: string, qEntity: QEntityModel<T>, config?: ODataUriBuilderConfig) {
    super(path, qEntity, config);
    this.entity = qEntity;
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
   * Build the final URI string.
   *
   * @returns the query string including the base service & collection path
   */
  public build(): string {
    const paramFn = this.unencoded ? this.param : this.paramEncoded;
    const params = this.buildQuery(paramFn);

    return this.path + (params.length ? `?${params.join("&")}` : "");
  }
}
