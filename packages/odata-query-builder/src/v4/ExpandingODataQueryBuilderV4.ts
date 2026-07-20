import {
  QFilterExpression,
  QOrderByExpression,
  QSearchTerm,
  QSelectExpression,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { ODataQueryBuilder } from "../ODataQueryBuilder";
import {
  ExpandingFunction,
  ExpandingCollectionQueryBuilderV4 as ExpandingODataQueryBuilderV4Model,
  ExpandType,
  NestingType,
  NullableParam,
  NullableParamList,
} from "../ODataQueryBuilderModel";

export function createExpandingQueryBuilderV4<Q extends QueryObjectModel>(
  property: string,
  qEntity: Q,
): ExpandingODataQueryBuilderV4Model<Q> & { getEngine(): unknown } {
  return new ExpandingODataQueryBuilderV4<Q>(property, qEntity);
}

/**
 * Builder for expanded entities/entity collections and, via `expanding()`, deep-selected complex/complex
 * collection properties (the engine decides dynamically which one applies per property, see
 * `ODataQueryBuilder.expanding()`).
 */
class ExpandingODataQueryBuilderV4<Q extends QueryObjectModel> implements ExpandingODataQueryBuilderV4Model<Q> {
  private builder: ODataQueryBuilder<Q>;

  public constructor(property: string, qEntity: Q) {
    // must never be encoded, since it is part of $expand/$select
    this.builder = new ODataQueryBuilder(property, qEntity, { expandingBuilder: true });
  }

  /**
   * Internal-only accessor used by `ODataQueryBuilder.expanding()` to resolve `$expand` vs `$select` placement
   * and to hoist any `expand`/`expanding` calls made from within a complex-typed context. Not part of the
   * public `ExpandingCollectionQueryBuilderV4`/`ExpandingModelQueryBuilderV4` contract.
   */
  public getEngine(): unknown {
    return this.builder;
  }

  public select(...props: NullableParamList<keyof Q | QSelectExpression>) {
    this.builder.select(props);
    return this;
  }

  public expand<Prop extends ExpandType<Q>>(...props: NullableParamList<Prop | QSelectExpression>) {
    this.builder.expand(props);
    return this;
  }

  public expanding<Prop extends NestingType<Q>>(prop: Prop, builderFn: ExpandingFunction<Q[Prop]>) {
    if (builderFn) {
      this.builder.expanding(createExpandingQueryBuilderV4, prop, builderFn);
    }
    return this;
  }

  public filter(...expressions: NullableParamList<QFilterExpression>) {
    this.builder.filter(expressions);
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

  public count(doCount = true) {
    this.builder.count(doCount);
    return this;
  }

  public search(...terms: NullableParamList<string | QSearchTerm>) {
    this.builder.search(terms);
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
