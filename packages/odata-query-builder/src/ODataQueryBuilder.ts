import {
  QEntityPathModel,
  QFilterExpression,
  QOrderByExpression,
  QPathModel,
  QSearchTerm,
  QueryObject,
  searchTerm,
} from "@odata2ts/odata-query-objects";

import { ODataOperators } from "./ODataModel";
import {
  ExpandType,
  ExpandingODataQueryBuilderV4,
  NullableParam,
  NullableParamList,
  ODataQueryBuilderConfig,
} from "./ODataQueryBuilderModel";

/**
 * Bundles all the logic about handling system query params for OData (V2 and V4).
 */
export class ODataQueryBuilder<Q extends QueryObject> {
  private readonly path: string;
  private readonly entity: Q;

  private readonly unencoded: boolean;
  private readonly config?: ODataQueryBuilderConfig;

  private itemsCount: [ODataOperators, string] | undefined;
  private itemsToSkip: number | undefined;
  private itemsTop: number | undefined;

  private selects: Array<string> | undefined;
  private filters: Array<QFilterExpression> | undefined;
  private orderBys: Array<QOrderByExpression> | undefined;
  private expands: Array<string> | undefined;
  private groupBys: Array<string> | undefined;
  private searchTerms: Array<QSearchTerm> | undefined;

  constructor(path: string, qEntity: Q, config?: ODataQueryBuilderConfig) {
    if (!qEntity || !path || !path.trim()) {
      throw new Error("A valid collection name must be provided!");
    }

    this.path = path;
    this.entity = qEntity;
    this.config = config;
    this.unencoded = !!config && !!config.unencoded;
  }

  public getPath() {
    return this.path;
  }

  private getSelects() {
    if (!this.selects) {
      this.selects = [];
    }
    return this.selects;
  }

  private getExpands() {
    if (!this.expands) {
      this.expands = [];
    }
    return this.expands;
  }

  public addSelects = (...paths: NullableParamList<string>) => {
    const filteredPaths = paths.filter((p): p is string => !!p);
    if (filteredPaths.length) {
      this.getSelects().push(...filteredPaths);
    }
  };

  public addExpands = (...paths: NullableParamList<string>) => {
    const filteredPaths = paths.filter((p): p is string => !!p);
    if (filteredPaths.length) {
      this.getExpands().push(...filteredPaths);
    }
  };

  /**
   * Helper method to retrieve a typed property from the entity.
   *
   * @param prop
   */
  public getEntityProp<PropType extends QPathModel>(prop: keyof Q) {
    return this.entity[prop] as unknown as PropType;
  }

  public count(doCount?: boolean) {
    this.itemsCount = [ODataOperators.COUNT, String(doCount === undefined || doCount)];
  }

  public countV2(doCount?: boolean) {
    if (doCount === undefined || doCount) {
      this.itemsCount = [ODataOperators.COUNTV2, "allpages"];
    }
  }

  public select(props: NullableParamList<keyof Q>) {
    const filteredPaths = props.filter((p): p is keyof Q => !!p).map((p) => this.getEntityProp(p).getPath());
    if (filteredPaths.length) {
      this.getSelects().push(...filteredPaths);
    }
  }

  public filter(expressions: NullableParamList<QFilterExpression>) {
    const filteredExps = expressions.filter((exp): exp is QFilterExpression => !!exp);
    if (filteredExps.length) {
      if (!this.filters) {
        this.filters = [];
      }
      this.filters.push(...filteredExps);
    }
  }

  /* public filterOr(...expressions: Array<QFilterExpression>) {
    this.filters.push(
      expressions.reduce((collector, expr) => (collector ? collector.or(expr) : expr), null as unknown as QFilterExpression)
    );
  } */

  public expand<Prop extends ExpandType<Q>>(props: NullableParamList<Prop>) {
    const filteredPaths = props.filter((p): p is Prop => !!p).map((p) => this.getEntityProp(p).getPath());
    if (filteredPaths.length) {
      this.getExpands().push(...filteredPaths);
    }
  }

  /**
   * V4 only method used by regular and expanding builder.
   * The regular V2 builder has an own and quite special implementation.
   *
   * @param creator
   * @param prop
   * @param builderFn
   */
  public expanding<Prop extends ExpandType<Q>>(
    creator: (property: string, qEntity: Q) => ExpandingODataQueryBuilderV4<Q>,
    prop: Prop,
    builderFn: (builder: any, qObject: any) => void
  ) {
    const entityProp = this.getEntityProp<QEntityPathModel<Q>>(prop);
    const path = entityProp.getPath();
    const entity = entityProp.getEntity();

    const expander = creator(path, entity);

    builderFn(expander, entity);

    this.getExpands().push(expander.build());
  }

  /**
   * Skip n items from the result set.
   * To be used in combination with top.
   *
   * @param itemsToSkip amount of items to skip
   * @returns this query builder
   */
  public skip(itemsToSkip: NullableParam<number>) {
    this.itemsToSkip = typeof itemsToSkip === "number" ? itemsToSkip : undefined;
  }

  /**
   * Returns this many items.
   * To be used in combination with skip.
   *
   * @param itemsTop amount of items to fetch
   * @returns this query builder
   */
  public top(itemsTop: NullableParam<number>) {
    this.itemsTop = typeof itemsTop === "number" ? itemsTop : undefined;
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
  public orderBy(expressions: NullableParamList<QOrderByExpression>) {
    const filteredExps = expressions.filter((exp): exp is QOrderByExpression => !!exp);
    if (filteredExps.length) {
      if (!this.orderBys) {
        this.orderBys = [];
      }
      this.orderBys.push(...filteredExps);
    }
  }

  public groupBy(props: NullableParamList<keyof Q>) {
    const filteredPaths = props.filter((p): p is keyof Q => !!p).map((p) => this.getEntityProp(p).getPath());
    if (filteredPaths.length) {
      if (!this.groupBys) {
        this.groupBys = [];
      }
      this.groupBys.push(...filteredPaths);
    }
  }

  public search(terms: NullableParamList<string | QSearchTerm>) {
    // single word is a term (literal value), multiple terms are a phrase (quoted value with double quotes)
    const filteredTerms = terms.filter((t): t is string => !!t?.toString()?.trim()).map(searchTerm);
    if (filteredTerms.length) {
      if (!this.searchTerms) {
        this.searchTerms = [];
      }
      this.searchTerms.push(...filteredTerms);
    }
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
      const filterConcat = cleanedFilters.reduce((result, filter) => result.and(filter));

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
    if (this.searchTerms?.length) {
      add(ODataOperators.SEARCH, this.searchTerms.map((st) => st.toString()).join(" AND "));
    }

    return params;
  }

  public build(): string {
    const paramFn = this.unencoded || this.config?.expandingBuilder ? this.param : this.paramEncoded;
    const params = this.buildQuery(paramFn);

    return (
      this.path +
      (!params.length ? "" : !this.config?.expandingBuilder ? `?${params.join("&")}` : `(${params.join(";")})`)
    );
  }
}
