import { QFilterExpression, QOrderByExpression, QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder, EntityExtractor, ExpandingODataUriBuilderV4Model, ExpandType } from "../internal";

/**
 * Builder for expanded entities or entity collections.
 */
export class ExpandingODataUriBuilderV4<Q extends QueryObject> implements ExpandingODataUriBuilderV4Model<Q> {
  public static create<Q extends QueryObject>(property: string, qEntity: Q /*, config?: ODataUriBuilderConfig*/) {
    return new ExpandingODataUriBuilderV4<Q>(property, qEntity);
  }

  private builder: ODataUriBuilder<Q>;

  public constructor(property: string, qEntity: Q) {
    // must never be encoded, since it is part of $expand
    this.builder = new ODataUriBuilder(property, qEntity, { expandingBuilder: true });
  }

  public select(...props: Array<keyof Q | null | undefined>) {
    this.builder.select(props);
    return this;
  }

  public expand<Prop extends ExpandType<Q>>(...props: Array<Prop>) {
    this.builder.expand(props);
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
    this.builder.expanding(prop, builderFn);
    return this;
  }

  public filter(...expressions: Array<QFilterExpression>) {
    this.builder.filter(expressions);
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
   * Build the final URI string for this expanded entity or entity collection.
   * This method is called internally.
   *
   * @returns the query string for this expanded entity or entity collection
   */
  public build(): string {
    return this.builder.build();
  }
}
