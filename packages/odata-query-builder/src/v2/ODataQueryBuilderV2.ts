import { QEntityPath, QFilterExpression, QOrderByExpression, QueryObject } from "@odata2ts/odata-query-objects";

import { ODataQueryBuilder } from "../ODataQueryBuilder";
import {
  ExpandType,
  ExpandingFunctionV2,
  NullableParam,
  NullableParamList,
  ODataQueryBuilderConfig,
  ODataQueryBuilderV2 as ODataQueryBuilderV2Model,
} from "../ODataQueryBuilderModel";
import { createExpandingQueryBuilderV2 } from "./ExpandingODataQueryBuilderV2";

/**
 * Create an QueryBuilder by passing in a query object, which already contains the base path
 * to the OData service & the given entity.
 *
 * Example:
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
export function createQueryBuilderV2<Q extends QueryObject>(
  path: string,
  qEntity: Q,
  config?: ODataQueryBuilderConfig
): ODataQueryBuilderV2<Q> {
  return new ODataQueryBuilderV2<Q>(path, qEntity, config);
}

/**
 * Create an OData URI string in a typesafe way by facilitating generated query objects.
 */
class ODataQueryBuilderV2<Q extends QueryObject> implements ODataQueryBuilderV2Model<Q> {
  private builder: ODataQueryBuilder<Q>;

  constructor(path: string, qEntity: Q, config?: ODataQueryBuilderConfig) {
    this.builder = new ODataQueryBuilder(path, qEntity, config);
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

  public expanding<Prop extends ExpandType<Q>>(prop: Prop, builderFn: ExpandingFunctionV2<Q[Prop]>) {
    if (!prop) {
      throw new Error("Expanding prop must be defined!");
    }
    if (!builderFn) {
      return this;
    }

    const entityProp = this.builder.getEntityProp<QEntityPath<any>>(prop);
    const entity = entityProp.getEntity();

    const expander = createExpandingQueryBuilderV2(entityProp.getPath(), entity);

    builderFn(expander, entity);

    const { selects, expands } = expander.build();
    if (selects.length) {
      this.builder.addSelects(...selects);
    }
    if (expands.length) {
      this.builder.addExpands(...expands);
    }

    return this;
  }

  public orderBy(...expressions: NullableParamList<QOrderByExpression>) {
    this.builder.orderBy(expressions);
    return this;
  }

  public count(doCount?: boolean) {
    this.builder.countV2(doCount);
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

  public build() {
    return this.builder.build();
  }
}
