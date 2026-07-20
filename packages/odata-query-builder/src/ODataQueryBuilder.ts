import {
  QComplexCollectionPath,
  QComplexPath,
  QEntityPathModel,
  QFilterExpression,
  QOrderByExpression,
  QPathModel,
  QSearchTerm,
  QSelectExpression,
  QueryObjectModel,
  searchTerm,
} from "@odata2ts/odata-query-objects";
import { ODataOperators } from "./ODataModel";
import {
  ExpandingCollectionQueryBuilderV4,
  NestingType,
  NullableParam,
  NullableParamList,
  ODataQueryBuilderConfig,
  SelectType,
} from "./ODataQueryBuilderModel.js";

/**
 * Bundles all the logic about handling system query params for OData (V2 and V4).
 */
export class ODataQueryBuilder<Q extends QueryObjectModel> {
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

  /**
   * Expand fragments that were reached via a complex-typed property and therefore cannot be embedded inline
   * (a `$select=Prop(...)` clause cannot contain `$expand`) - they are relayed here, already path-prefixed by
   * the complex hop, until they reach a context that can embed them (see `expanding()` / `buildNested()`).
   */
  private hoistedExpandsBucket: Array<string> | undefined;

  constructor(path: string, qEntity: Q, config?: ODataQueryBuilderConfig) {
    if (!qEntity || !path || !path.trim()) {
      throw new Error("A valid collection name must be provided!");
    }

    this.path = path;
    this.entity = qEntity;
    this.config = config;
    this.unencoded = !!config && !!config.unencoded;
  }

  public copyState(builder: ODataQueryBuilder<Q>) {
    Object.entries(this).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          // @ts-ignore
          builder[key] = value.slice();
        } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          // @ts-ignore
          builder[key] = value;
        }
      }
    });
    return builder;
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

  private getHoistedExpandsBucket() {
    if (!this.hoistedExpandsBucket) {
      this.hoistedExpandsBucket = [];
    }
    return this.hoistedExpandsBucket;
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

  public filterSelectAndMapPath(props: NullableParamList<SelectType<Q>>): Array<string> {
    return props
      .filter((p): p is SelectType<Q> => !!p)
      .map((p): string => {
        if (p instanceof QSelectExpression) {
          return p.getPath();
        }
        // "*" ($select=*, "all structural properties") is not an entity property - passes through as a
        // literal path segment, never looked up via getEntityProp().
        if (p === "*") {
          return "*";
        }
        return this.getEntityProp(p as keyof Q).getPath();
      });
  }

  public select(props: NullableParamList<SelectType<Q>>) {
    const filteredPaths = this.filterSelectAndMapPath(props);
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

  public expand(props: NullableParamList<keyof Q | QSelectExpression>) {
    const filteredPaths = this.filterSelectAndMapPath(props);
    if (filteredPaths.length) {
      this.getExpands().push(...filteredPaths);
    }
  }

  /**
   * V4 only method used by regular and expanding builder.
   * The regular V2 builder has an own and quite special implementation.
   *
   * Whether `prop` is an entity/entity-collection navigation property or a complex/complex-collection property
   * is resolved dynamically here (via `instanceof`), which decides whether the nested builder's content is
   * embedded as `$expand=prop(...)` or `$select=prop(...)`. In the complex case, any `expand`/`expanding` calls
   * made inside the nested builder cannot be embedded inline (a `$select=...` clause cannot contain `$expand`,
   * per real-world OData server behavior even though the spec grammar technically allows it) - they are instead
   * relayed up (path-prefixed) via `hoistedExpandsBucket` until they reach a context that can embed them
   * (either an ancestor `expanding()` call reached via a navigation property, or the top-level builder).
   *
   * @param creator
   * @param prop
   * @param builderFn
   */
  public expanding<Prop extends NestingType<Q>>(
    creator: (property: string, qEntity: Q) => ExpandingCollectionQueryBuilderV4<Q> & { getEngine(): unknown },
    prop: Prop,
    builderFn: (builder: any, qObject: any) => void,
  ) {
    const entityProp = this.getEntityProp<QEntityPathModel<Q>>(prop);
    const path = entityProp.getPath();
    const entity = entityProp.getEntity();
    const isComplex = entityProp instanceof QComplexPath || entityProp instanceof QComplexCollectionPath;

    const facade = creator(path, entity);

    builderFn(facade, entity);

    const nestedEngine = facade.getEngine() as ODataQueryBuilder<any>;
    const { content, hoistedExpands } = nestedEngine.buildNested(isComplex);

    if (isComplex) {
      this.getSelects().push(content);
    } else {
      this.getExpands().push(content);
    }
    if (hoistedExpands.length) {
      this.getHoistedExpandsBucket().push(...hoistedExpands.map((fragment) => `${path}/${fragment}`));
    }
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

  private buildQuery(
    param: (operator: string, value: string) => string,
    opts?: { excludeExpands?: boolean },
  ): Array<string> {
    const params: Array<string> = [];
    const add = (operator: string, value: string) => params.push(param(operator, value));

    const cleanedFilters = this.filters?.filter((f) => f.toString());

    if (this.selects?.length) {
      add(ODataOperators.SELECT, this.selects.join(","));
    }
    if (this.expands?.length && !opts?.excludeExpands) {
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
    // fold anything relayed up from complex-typed descendants into this (entity-context) builder's own $expand
    if (this.hoistedExpandsBucket?.length) {
      this.getExpands().push(...this.hoistedExpandsBucket);
      this.hoistedExpandsBucket = undefined;
    }

    const paramFn = this.unencoded || this.config?.expandingBuilder ? this.param : this.paramEncoded;
    const params = this.buildQuery(paramFn);

    return (
      this.path +
      (!params.length ? "" : !this.config?.expandingBuilder ? `?${params.join("&")}` : `(${params.join(";")})`)
    );
  }

  /**
   * Internal-only: used exclusively by `expanding()` to decide `$expand` vs `$select` placement for this
   * builder's own content, and to compute anything that must be hoisted past this context.
   *
   * - Entity context (`isComplexContext === false`, "sink"): behaves exactly like `build()` - embeds `$expand`
   *   inline and folds in anything relayed up from complex-typed descendants.
   * - Complex context (`isComplexContext === true`, "relay"): excludes `$expand` from its own rendered content
   *   entirely (a `$select=Prop(...)` clause cannot contain `$expand`) and instead returns its own `expands`
   *   plus anything already relayed from its own descendants, unprefixed, for the caller to prefix and forward.
   */
  public buildNested(isComplexContext: boolean): { content: string; hoistedExpands: Array<string> } {
    if (!isComplexContext) {
      return { content: this.build(), hoistedExpands: [] };
    }

    const paramFn = this.unencoded || this.config?.expandingBuilder ? this.param : this.paramEncoded;
    const params = this.buildQuery(paramFn, { excludeExpands: true });
    const content = this.path + (params.length ? `(${params.join(";")})` : "");
    const hoistedExpands = [...(this.expands ?? []), ...(this.hoistedExpandsBucket ?? [])];

    return { content, hoistedExpands };
  }
}
