import { QFilterExpression, QOrderByExpression, QueryObject } from "@odata2ts/odata-query-objects";

import { ODataUriBuilder } from "../ODataUriBuilder";
import {
  ExpandType,
  ExpandingFunction,
  NullableParam,
  NullableParamList,
  ODataUriBuilderConfig,
  ODataUriBuilderV4 as ODataUriBuilderV4Model,
} from "../ODataUriBuilderModel";
import { createExpandingUriBuilderV4 } from "./ExpandingODataUriBuilderV4";

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
    if (builderFn) {
      this.builder.expanding(createExpandingUriBuilderV4, prop, builderFn);
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

  public search(term: NullableParam<string>) {
    this.builder.search(term);
    return this;
  }

  public build() {
    return this.builder.build();
  }
}
