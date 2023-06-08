import { QFilterExpression, QOrderByExpression, QSearchTerm, QueryObject } from "@odata2ts/odata-query-objects";

import { ODataQueryBuilder } from "../ODataQueryBuilder";
import {
  ExpandType,
  ExpandingFunction,
  NullableParam,
  NullableParamList,
  ODataQueryBuilderConfig,
  ODataQueryBuilderV4 as ODataQueryBuilderV4Model,
} from "../ODataQueryBuilderModel";
import { createExpandingQueryBuilderV4 } from "./ExpandingODataQueryBuilderV4";

/**
 * Create an QueryBuilder by passing in a path and a query object.
 *
 * Example for a query on a entity collection:
 * ODataQueryBuilder.create("people", qPerson)
 *   .select(...)
 *   .filter(qPerson.age.greaterThan(...))
 *   ...
 *   .build()
 *
 * @param path base path to
 * @param qEntity the query object
 * @param config optionally pass a configuration
 * @returns a QueryBuilder
 */
export function createQueryBuilderV4<Q extends QueryObject>(
  path: string,
  qEntity: Q,
  config?: ODataQueryBuilderConfig
): ODataQueryBuilderV4Model<Q> {
  return new ODataQueryBuilderV4<Q>(path, qEntity, config);
}

/**
 * Create an OData URI string in a typesafe way by facilitating generated query objects.
 */
class ODataQueryBuilderV4<Q extends QueryObject> implements ODataQueryBuilderV4Model<Q> {
  private builder: ODataQueryBuilder<Q>;

  constructor(path: string, qEntity: Q, config?: ODataQueryBuilderConfig) {
    this.builder = new ODataQueryBuilder(path, qEntity, config);
  }

  public count(doCount?: boolean) {
    this.builder.count(doCount);
    return this;
  }

  public select(...props: NullableParamList<keyof Q>) {
    this.builder.select(props);
    return this;
  }

  public filter(...expressions: NullableParamList<QFilterExpression>) {
    this.builder.filter(expressions);
    return this;
  }

  public expand<Prop extends ExpandType<Q>>(...props: NullableParamList<Prop>) {
    this.builder.expand(props);
    return this;
  }

  public expanding<Prop extends ExpandType<Q>>(prop: Prop, builderFn: ExpandingFunction<Q[Prop]>) {
    if (!prop) {
      throw new Error("Expanding prop must be defined!");
    }

    if (builderFn) {
      this.builder.expanding(createExpandingQueryBuilderV4, prop, builderFn);
    }
    return this;
  }

  public groupBy(...props: NullableParamList<keyof Q>) {
    this.builder.groupBy(props);
    return this;
  }

  public orderBy(...expressions: NullableParamList<QOrderByExpression>) {
    this.builder.orderBy(expressions);
    return this;
  }

  public top(itemsTop: NullableParam<number>) {
    this.builder.top(itemsTop);
    return this;
  }

  public skip(itemsToSkip: NullableParam<number>) {
    this.builder.skip(itemsToSkip);
    return this;
  }

  public search(...term: NullableParamList<string | QSearchTerm>) {
    this.builder.search(term);
    return this;
  }

  public build() {
    return this.builder.build();
  }
}
