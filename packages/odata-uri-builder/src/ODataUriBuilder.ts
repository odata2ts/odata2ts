import { QComplexPath, QFilterExpression, QOrderByExpression, QPath, QueryObject } from "@odata2ts/odata-query-objects";
import {
  ExpandingBuilderFactoryFunction,
  ExpandingODataUriBuilderV4,
  ExpandType,
  ODataOperators,
  ODataUriBuilderConfig,
} from "./internal";

export class ODataUriBuilder<Q extends QueryObject> {
  private readonly path: string;
  private readonly entity: Q;

  private readonly unencoded: boolean;
  private readonly config?: ODataUriBuilderConfig;

  private itemsCount: [ODataOperators, string] | undefined;
  private itemsToSkip: number | undefined;
  private itemsTop: number | undefined;

  private selects: Array<string> | undefined;
  private filters: Array<QFilterExpression> | undefined;
  private orderBys: Array<QOrderByExpression> | undefined;
  private expands: Array<string> | undefined;
  protected groupBys: Array<string> | undefined;
  protected searchTerm: string | undefined;

  constructor(path: string, qEntity: Q, config?: ODataUriBuilderConfig) {
    if (!qEntity || !path || !path.trim()) {
      throw Error("A valid collection name must be provided!");
    }

    this.path = path;
    this.entity = qEntity;
    this.config = config;
    this.unencoded = !!config && !!config.unencoded;
  }

  /**
   * Add the count system query param.
   *
   * @param countOperator V2 or V4 count operator
   * @param countInstruction value of the parameter
   * @returns this query builder
   */
  public count(countOperator: ODataOperators.COUNT | ODataOperators.COUNTV2, countInstruction: string) {
    this.itemsCount = [countOperator, countInstruction];
  }

  public select(props: Array<keyof Q | null | undefined>) {
    if (props && props.length) {
      if (!this.selects) {
        this.selects = [];
      }
      this.selects.push(
        ...props
          .filter((p): p is keyof Q => !!p)
          .map((p) => {
            return (this.entity[p] as unknown as QPath).getPath();
          })
      );
    }
  }

  public filter(expressions: Array<QFilterExpression>) {
    if (expressions?.length) {
      if (!this.filters) {
        this.filters = [];
      }
      this.filters.push(...expressions);
    }
  }

  public expand<Prop extends ExpandType<Q>>(expBuilder: ExpandingBuilderFactoryFunction<Q>, props: Array<Prop>) {
    if (props?.length) {
      if (!this.expands) {
        this.expands = [];
      }
      this.expands.push(
        ...props.map((p) => {
          const prop = this.entity[p] as unknown as QComplexPath;
          return new expBuilder(prop.getPath(), prop.getEntity()).build();
        })
      );
    }
  }

  public expanding<Prop extends ExpandType<Q>>(
    expBuilder: ExpandingBuilderFactoryFunction<Q>,
    prop: Prop,
    builderFn: (builder: any, qObject: any) => void
  ) {
    if (!prop) {
      throw new Error("Expanding prop must be defined!");
    }
    if (builderFn) {
      if (!this.expands) {
        this.expands = [];
      }

      const entityProp = this.entity[prop] as unknown as QComplexPath;
      const expander = ExpandingODataUriBuilderV4.create(entityProp.getPath(), entityProp.getEntity());
      builderFn(expander, entityProp.getEntity());

      this.expands.push(expander.build());
    }
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
  public orderBy(expressions: Array<QOrderByExpression>) {
    if (expressions?.length) {
      if (!this.orderBys) {
        this.orderBys = [];
      }
      this.orderBys.push(...expressions);
    }
  }

  /* public filterOr(...expressions: Array<QFilterExpression>) {
    this.filters.push(
      expressions.reduce((collector, expr) => (collector ? collector.or(expr) : expr), null as unknown as QFilterExpression)
    );
  } */

  public groupBy(props: Array<keyof Q | null | undefined>) {
    if (props && props.length) {
      if (!this.groupBys) {
        this.groupBys = [];
      }
      this.groupBys.push(
        ...props
          .filter((p): p is keyof Q => !!p)
          .map((p) => {
            return (this.entity[p] as unknown as QPath).getPath();
          })
      );
    }
  }

  public search(term: string | undefined | null) {
    this.searchTerm = term || undefined;
  }

  private param(operator: string, value: string) {
    return `${operator}=${value}`;
  }

  private paramEncoded(operator: string, value: string) {
    return `${encodeURIComponent(operator)}=${encodeURIComponent(value)}`;
  }

  private buildQuery(param: (operator: string, value: string) => string): Array<string> {
    const params: Array<string> = [];
    const add = (operator: string, value: string) => params.push(param(operator, value));

    const cleanedFilters = this.filters?.filter((f) => f.toString());

    if (this.selects?.length) {
      add(ODataOperators.SELECT, this.selects.join(","));
    }
    if (this.expands?.length) {
      add(ODataOperators.EXPAND, this.expands.join(","));
    }
    if (cleanedFilters?.length) {
      const filterConcat = cleanedFilters.reduce((result, filter) => (result ? result.and(filter) : filter));

      if (filterConcat) {
        add(ODataOperators.FILTER, filterConcat.toString());
      }
    }
    if (this.groupBys?.length) {
      add(ODataOperators.APPLY, `groupby((${this.groupBys.join(",")}))`);
    }
    if (this.orderBys?.length) {
      const order = this.orderBys.map((exp) => exp.toString()).join(",");
      add(ODataOperators.ORDER_BY, order);
    }
    if (this.itemsCount?.length === 2) {
      add(this.itemsCount[0], this.itemsCount[1]);
    }
    if (this.itemsTop !== undefined) {
      add(ODataOperators.TOP, String(this.itemsTop));
    }
    if (this.itemsToSkip !== undefined) {
      add(ODataOperators.SKIP, String(this.itemsToSkip));
    }
    if (this.searchTerm) {
      // single word is a term (literal value), multiple terms are a phrase (quoted value with double quotes)
      const encodedSearchTerm = this.searchTerm.indexOf(" ") > -1 ? `"${this.searchTerm}"` : this.searchTerm;
      add(ODataOperators.SEARCH, encodedSearchTerm);
    }

    return params;
  }

  /**
   * Build the final URI string.
   *
   * @returns the query string including the base service & collection path
   */
  public build(): string {
    const paramFn = this.unencoded || this.config?.expandingBuilder ? this.param : this.paramEncoded;
    const params = this.buildQuery(paramFn);

    return (
      this.path +
      (!params.length ? "" : !this.config?.expandingBuilder ? `?${params.join("&")}` : `(${params.join(";")})`)
    );
  }
}
