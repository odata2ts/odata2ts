import {
  EntityExtractor,
  ExpandingODataUriBuilderV4,
  ExpandType,
  ODataOperators,
  ODataUriBuilder,
  ODataUriBuilderBase,
  ODataUriBuilderConfig,
  ODataUriBuilderV4Model,
} from "../internal";
import {
  QComplexPath,
  QFilterExpression,
  QOrderByExpression,
  QPath,
  QPathModel,
  QueryObject,
} from "@odata2ts/odata-query-objects";

/**
 * Create an OData URI string in a typesafe way by facilitating generated query objects.
 */
export class ODataUriBuilderV4<Q extends QueryObject> implements ODataUriBuilderV4Model<Q> {
  private builder: ODataUriBuilderBase<Q>;

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

  private constructor(path: string, qEntity: Q, config?: ODataUriBuilderConfig) {
    this.builder = new ODataUriBuilderBase(path, qEntity, config);
  }

  public count(doCount?: boolean) {
    this.builder.count(ODataOperators.COUNT, String(doCount === undefined || doCount));
    return this;
  }

  public select(...props: Array<keyof Q | null | undefined>) {
    this.builder.select(props);
    return this;
  }

  public filter(...expressions: Array<QFilterExpression>) {
    this.builder.filter(expressions);
    return this;
  }

  public expand<Prop extends ExpandType<Q>>(...props: Array<Prop>) {
    this.builder.expand(ExpandingODataUriBuilderV4, props);
    return this;
  }

  /**
   * Expand a given entity and receive an own builder for it to further select, filter, expand, etc.
   *
   * This method can be called multiple times.
   *
   * Example:
   * .expanding("addresses", (addressBuilder, qAddress) => {
   *   addressBuilder
   *     .select(...)
   *     .filter(qAddress.street.startsWith(...))
   * })
   *
   * @param prop the name of the property which should be expanded
   * @param builderFn function which receives an entity specific builder as first & the appropriate query object as second argument
   * @returns this query builder
   */
  public expanding<Prop extends ExpandType<Q>>(
    prop: Prop,
    builderFn: (
      builder: ExpandingODataUriBuilderV4<EntityExtractor<Q[Prop]>>,
      qObject: EntityExtractor<Q[Prop]>
    ) => void
  ) {
    this.builder.expanding(ExpandingODataUriBuilderV4, prop, builderFn);
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
    this.builder.groupBy(props);
    return this;
  }

  public orderBy(...expressions: Array<QOrderByExpression>) {
    this.builder.orderBy(expressions);
    return this;
  }

  public top(itemsTop: number) {
    this.builder.top(itemsTop);
    return this;
  }

  public skip(itemsToSkip: number) {
    this.builder.skip(itemsToSkip);
    return this;
  }

  /**
   * V4 free text search option, where the server decides how to apply the search value.
   * Uses system query option $search.
   *
   * @param term
   */
  public search(term: string | undefined | null) {
    this.builder.search(term);
    return this;
  }

  public build() {
    return this.builder.build();
  }
}
