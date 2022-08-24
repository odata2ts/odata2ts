import { QFilterExpression, QOrderByExpression, QueryObject } from "@odata2ts/odata-query-objects";
import {
  ODataUriBuilder,
  EntityExtractor,
  ExpandingODataUriBuilderV4 as ExpandingODataUriBuilderV4Model,
  ExpandType,
  NullableParamList,
  ExpandingFunction,
  NullableParam,
} from "../internal";

export function createExpandingUriBuilderV4<Q extends QueryObject>(
  property: string,
  qEntity: Q
): ExpandingODataUriBuilderV4Model<Q> {
  return new ExpandingODataUriBuilderV4<Q>(property, qEntity);
}

/**
 * Builder for expanded entities or entity collections.
 */
class ExpandingODataUriBuilderV4<Q extends QueryObject> implements ExpandingODataUriBuilderV4Model<Q> {
  private builder: ODataUriBuilder<Q>;

  public constructor(property: string, qEntity: Q) {
    // must never be encoded, since it is part of $expand
    this.builder = new ODataUriBuilder(property, qEntity, { expandingBuilder: true });
  }

  public select(...props: NullableParamList<keyof Q>) {
    this.builder.select(props);
    return this;
  }

  public expand<Prop extends ExpandType<Q>>(...props: NullableParamList<Prop>) {
    this.builder.expand(props);
    return this;
  }

  public expanding<Prop extends ExpandType<Q>>(prop: Prop, builderFn: ExpandingFunction<Q[Prop]>) {
    if (builderFn) {
      this.builder.expanding(prop, builderFn);
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
