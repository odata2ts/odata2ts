import { QFilterExpression, QOrderByExpression, QueryObject } from "@odata2ts/odata-query-objects";
import { ODataOperators } from "./internal";

export interface ODataUriBuilderConfig {
  unencoded?: boolean;
}

export abstract class ODataUriBuilderBase<Q extends QueryObject> {
  protected path: string;
  protected entity: Q;

  protected unencoded: boolean;
  protected config?: ODataUriBuilderConfig;

  protected itemsToSkip?: number;
  protected itemsTop?: number;
  protected itemsCount?: boolean;
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

  protected abstract getSelectResult(): string | undefined;

  protected abstract getExpandResult(): string | undefined;

  protected abstract getCountResult(): [string, string] | undefined;

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

    const selectResult = this.getSelectResult();
    const expandResult = this.getExpandResult();
    const countResult = this.getCountResult();

    if (selectResult) {
      add(ODataOperators.SELECT, selectResult);
    }
    if (this.itemsToSkip !== undefined) {
      add(ODataOperators.SKIP, String(this.itemsToSkip));
    }
    if (this.itemsTop !== undefined) {
      add(ODataOperators.TOP, String(this.itemsTop));
    }
    if (countResult) {
      add(countResult[0], countResult[1]);
    }
    if (cleanedFilters.length) {
      const filterConcat = cleanedFilters.reduce((result, filter) => (result ? result.and(filter) : filter));
      add(ODataOperators.FILTER, filterConcat.toString());
    }
    if (expandResult) {
      add(ODataOperators.EXPAND, expandResult);
    }
    if (this.orderBys.length) {
      const order = this.orderBys.map((exp) => exp.toString()).join(",");
      add(ODataOperators.ORDER_BY, order);
    }

    return params;
  }

  /**
   * Build the final URI string.
   *
   * @returns the query string including the base service & collection path
   */
  public build(): string {
    const paramFn = this.unencoded ? this.param : this.paramEncoded;
    const params = this.buildQuery(paramFn);

    return this.path + (params.length ? `?${params.join("&")}` : "");
  }
}
