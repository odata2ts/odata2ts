import {
  QCollectionPath,
  QComplexPath,
  QEntityCollectionPath,
  QEntityPath,
  QFilterExpression,
  QOrderByExpression,
  QPath,
} from "@odata2ts/odata-query-objects";
import { ExpandingODataUriBuilder } from "./internal";
import { ODataOperators } from "./internal";

export interface ODataUriBuilderConfig {
  unencoded?: boolean;
}

/**
 * Extracts the wrapped entity from QEntityPath or QEntityCollectionPath
 */
type EntityExtractor<Q> = Q extends QEntityPath<infer E> ? E : Q extends QEntityCollectionPath<infer E> ? E : never;
/**
 * Extracts all keys from a property (Q*Path), but only for the given types
 */
type ExtractPropertyNamesOfType<QPath, QPathTypes> = {
  [Key in keyof QPath]: QPath[Key] extends QPathTypes ? Key : never;
}[keyof QPath];
/**
 * Retrieves all property names which are expandable,
 * i.e. props of type QEntityPath, QEntityCollectionPath and QCollectionPath
 */
type ExpandType<QPath> = ExtractPropertyNamesOfType<
  QPath,
  QEntityPath<any> | QEntityCollectionPath<any> | QCollectionPath<any>
>;

export abstract class ODataUriBuilderBase<Q> {
  protected path: string;
  protected entity: Q;

  protected unencoded: boolean;
  protected config?: ODataUriBuilderConfig;

  protected selects: Array<string> = [];
  protected itemsToSkip?: number;
  protected itemsTop?: number;
  protected itemsCount?: boolean;
  protected expands: Array<ExpandingODataUriBuilder<any>> = [];
  protected filters: Array<QFilterExpression> = [];
  protected orderBys: Array<QOrderByExpression> = [];

  protected constructor(path: string, qEntity: Q, config?: ODataUriBuilderConfig) {
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
  public select(...props: Array<keyof Q | null | undefined>) {
    if (props && props.length) {
      this.selects.push(
        ...props
          .filter((p): p is keyof Q => !!p)
          .map((p) => {
            return (this.entity[p] as unknown as QPath).getPath();
          })
      );
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
  public expanding<Prop extends ExpandType<Q>>(
    prop: Prop,
    builderFn: (builder: ExpandingODataUriBuilder<EntityExtractor<Q[Prop]>>, qObject: EntityExtractor<Q[Prop]>) => void
  ) {
    const entityProp = this.entity[prop] as unknown as QComplexPath;
    const expander = ExpandingODataUriBuilder.create(entityProp.getPath(), entityProp.getEntity());
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
  public expand<Prop extends ExpandType<Q>>(...props: Array<Prop>) {
    this.expands.push(
      ...props.map((p) => {
        const prop = this.entity[p] as unknown as QComplexPath;
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
    const cleanedFilters = this.filters.filter((f) => f.toString());

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
    if (cleanedFilters.length) {
      const filterConcat = cleanedFilters.reduce((result, filter) => (result ? result.and(filter) : filter));
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
