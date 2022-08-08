import { QFilterExpression, QOrderByExpression, QueryObject } from "@odata2ts/odata-query-objects";
import {
  EntityExtractor,
  ExpandingODataUriBuilderV4,
  ExpandType,
  ODataUriBuilder,
  ODataUriBuilderConfig,
  ODataUriBuilderV4 as ODataUriBuilderV4Model,
} from "../internal";

/**
 * Create an UriBuilder by passing in a path and a query object.
 *
 * Example for a query on a entity collection:
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
export function createUriBuilderV4<Q extends QueryObject>(
  path: string,
  qEntity: Q,
  config?: ODataUriBuilderConfig
): ODataUriBuilderV4Model<Q> {
  return new ODataUriBuilderV4<Q>(path, qEntity, config);
}

/**
 * Create an OData URI string in a typesafe way by facilitating generated query objects.
 */
class ODataUriBuilderV4<Q extends QueryObject> implements ODataUriBuilderV4Model<Q> {
  private builder: ODataUriBuilder<Q>;

  constructor(path: string, qEntity: Q, config?: ODataUriBuilderConfig) {
    this.builder = new ODataUriBuilder(path, qEntity, config);
  }

  public count(doCount?: boolean) {
    this.builder.count(doCount);
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
    this.builder.expand(props);
    return this;
  }

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

  public search(term: string | undefined | null) {
    this.builder.search(term);
    return this;
  }

  public build() {
    return this.builder.build();
  }
}
