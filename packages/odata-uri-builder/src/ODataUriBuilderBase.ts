import {
  QCollectionPath,
  QEntityCollectionPath,
  QEntityModel,
  QEntityPath,
  QFilterExpression,
  QOrderByExpression,
  QPropContainer,
} from "@odata2ts/odata-query-objects";
import { ExpandingODataUriBuilder } from "./internal";
import { ODataOperators } from "./internal";

export interface ODataUriBuilderConfig {
  unencoded?: boolean;
}

type EntityExtractor<T> = T extends QEntityPath<infer E> ? E : T extends QEntityCollectionPath<infer E> ? E : never;
type ExtractPropertyNamesOfType<T, S> = { [K in keyof T]: T[K] extends S ? K : never }[keyof T];
type ExpandType<T> = ExtractPropertyNamesOfType<
  QEntityModel<T>,
  QEntityPath<any> | QEntityCollectionPath<any, any> | QCollectionPath<any>
>;

export abstract class ODataUriBuilderBase<T> {
  protected path: string;
  protected entity: QEntityModel<T>;

  protected unencoded: boolean;
  protected config?: ODataUriBuilderConfig;

  protected selects: Array<string> = [];
  protected itemsToSkip?: number;
  protected itemsTop?: number;
  protected itemsCount?: boolean;
  protected expands: Array<ExpandingODataUriBuilder<any>> = [];
  protected filters: Array<QFilterExpression> = [];
  protected orderBys: Array<QOrderByExpression> = [];

  protected constructor(path: string, qEntity: QEntityModel<T>, config?: ODataUriBuilderConfig) {
    if (!qEntity || !path || !path.trim()) {
      throw Error("A valid collection name must be provided!");
    }

    this.path = path;
    this.entity = qEntity;
    this.config = config;
    this.unencoded = !!config && !!config.unencoded;
  }

  public abstract build(): string;

  /**
   * Select the properties of the entity you want to select.
   *
   * @param props the property names to select
   * @returns this query builder
   */
  public select(...props: Array<keyof QPropContainer<T, any> | null | undefined>) {
    if (props && props.length) {
      this.selects.push(...props.filter((p) => !!p).map((p) => this.entity[p].getPath()));
    }
    return this;
  }

  /**
   * Skip n items from the result set.
   * To be used in combination with top.
   *
   * @param itemsToSkip amount of items to skip
   * @returns this query builder
   */
  public skip(itemsToSkip: number) {
    if (itemsToSkip === undefined || itemsToSkip === null || itemsToSkip < 0) {
      throw Error("Parameter [skip] must be a positive integer including 0!");
    }

    this.itemsToSkip = itemsToSkip;
    return this;
  }

  /**
   * Returns this many items.
   * To be used in combination with skip.
   *
   * @param itemsTop amount of items to fetch
   * @returns this query builder
   */
  public top(itemsTop: number) {
    if (itemsTop === undefined || itemsTop === null || itemsTop < 0) {
      throw Error("Parameter [top] must be a positive integer including 0!");
    }

    this.itemsTop = itemsTop;
    return this;
  }

  /**
   * Specify order by expressions by facilitating qObjects and their
   * ascending and descending methods.
   *
   * This method can be called multiple times in order to add orderBy expressions successively.
   *
   * @param expressions possibly multiple order by expressions at once
   * @returns this query builder
   */
  public orderBy(...expressions: Array<QOrderByExpression>) {
    this.orderBys.push(...expressions);

    return this;
  }

  /**
   * Specify as many filter expressions as you want by facilitating query objects.
   * Alternatively you can use QueryExpressions directly.
   *
   * Each passed expression is concatenated to the other ones by an and expression.
   *
   * This method can be called multiple times in order to add filters successively.
   *
   * @param expressions possibly multiple expressions
   * @returns this query builder
   */
  public filter(...expressions: Array<QFilterExpression>) {
    this.filters.push(...expressions);

    return this;
  }

  /* public filterOr(...expressions: Array<QFilterExpression>) {
    this.filters.push(
      expressions.reduce((collector, expr) => (collector ? collector.or(expr) : expr), null as unknown as QFilterExpression)
    );

    return this;
  } */

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
  public expanding<Prop extends ExpandType<T>>(
    prop: Prop,
    builderFn: (
      builder: ExpandingODataUriBuilder<EntityExtractor<QEntityModel<T>[Prop]>>,
      qObject: QEntityModel<EntityExtractor<QEntityModel<T>[Prop]>>
    ) => void
  ) {
    const entityProp = this.entity[prop] as QEntityPath<any>;
    const expander = ExpandingODataUriBuilder.create(entityProp.getPath(), entityProp.getEntity());
    // @ts-ignore
    builderFn(expander, entityProp.getEntity());

    this.expands.push(expander);

    return this;
  }

  /**
   * Simple & plain expand of the given entities or entity collections.
   *
   * This method can be called multiple times.
   *
   * @param props the attributes to expand
   * @returns this query builder
   */
  public expand<Prop extends ExpandType<T>>(...props: Array<Prop>) {
    this.expands.push(
      ...props.map((p) => {
        const prop = this.entity[p] as QEntityPath<any>;
        return ExpandingODataUriBuilder.create(prop.getPath(), prop.getEntity());
      })
    );
    return this;
  }

  protected param(operator: string, value: string) {
    return `${operator}=${value}`;
  }

  protected paramEncoded(operator: string, value: string) {
    return `${encodeURIComponent(operator)}=${encodeURIComponent(value)}`;
  }

  protected buildQuery(param: (operator: string, value: string) => string): Array<string> {
    const params: Array<string> = [];
    const add = (operator: string, value: string) => params.push(param(operator, value));

    if (this.selects.length) {
      add(ODataOperators.SELECT, this.selects.join(","));
    }
    if (this.itemsToSkip !== undefined) {
      add(ODataOperators.SKIP, String(this.itemsToSkip));
    }
    if (this.itemsTop !== undefined) {
      add(ODataOperators.TOP, String(this.itemsTop));
    }
    if (this.itemsCount !== undefined) {
      add(ODataOperators.COUNT, String(this.itemsCount));
    }
    if (this.filters.length) {
      const filterConcat = this.filters.reduce((result, filter) => (result ? result.and(filter) : filter));
      add(ODataOperators.FILTER, filterConcat.toString());
    }
    if (this.expands.length) {
      const expand = this.expands.map((exp) => exp.build()).join(",");
      add(ODataOperators.EXPAND, expand);
    }
    if (this.orderBys.length) {
      const order = this.orderBys.map((exp) => exp.toString()).join(",");
      add(ODataOperators.ORDER_BY, order);
    }

    return params;
  }
}
