import {
  QCollectionPath,
  QEntityCollectionPath,
  QEntityPath,
  QFilterExpression,
  QOrderByExpression,
  QSearchTerm,
  QueryObject,
} from "@odata2ts/odata-query-objects";

/**
 * Extracts the wrapped entity from QEntityPath or QEntityCollectionPath
 */
export type EntityExtractor<QProp> = QProp extends QEntityPath<infer ET>
  ? ET
  : QProp extends QEntityCollectionPath<infer ET>
  ? ET
  : never;

/**
 * Extracts all keys from a property (Q*Path), but only for the given types
 */
export type ExtractPropertyNamesOfType<QPath, QPathTypes> = {
  [Key in keyof QPath]: QPath[Key] extends QPathTypes ? Key : never;
}[keyof QPath];

/**
 * Retrieves all property names which are expandable,
 * i.e. props of type QEntityPath, QEntityCollectionPath and QCollectionPath
 */
export type ExpandType<Q extends QueryObject> = ExtractPropertyNamesOfType<
  Q,
  QEntityPath<any> | QEntityCollectionPath<any> | QCollectionPath<any>
>;

export type Nullable = null | undefined;

export type NullableParam<OptionType> = OptionType | Nullable;

export type NullableParamList<OptionType> = Array<OptionType | Nullable>;

export type ExpandingFunction<Prop> =
  | ((expBuilder: ExpandingODataQueryBuilderV4<EntityExtractor<Prop>>, qObject: EntityExtractor<Prop>) => void)
  | Nullable;

export type ExpandingFunctionV2<Prop> =
  | ((expBuilder: ExpandingODataQueryBuilderV2<EntityExtractor<Prop>>, qObject: EntityExtractor<Prop>) => void)
  | Nullable;

export interface ODataQueryBuilderConfig {
  expandingBuilder?: boolean;
  unencoded?: boolean;
}

/**
 * Represents all possible builder operations.
 * However, any builder will only be composed of a subset of these operations.
 */
export interface ODataQueryBuilderModel<Q extends QueryObject, ReturnType> {
  /**
   * Name the properties of the entity you want to select (as they are specified on the query object).
   * Null or undefined are allowed and will be ignored.
   *
   * This function can be called multiple times.
   *
   * @example
   * builder.select("lastName", "firstName", undefined) // $select=lastName,firstName
   * @example
   * builder.select("lastName", false ? "firstName" : undefined) // $select=lastName
   * @param props the property names to select as they are specified on the query object
   * @returns this query builder
   */
  select: (...props: NullableParamList<keyof Q>) => ReturnType;

  /**
   * Specify as many filter expressions as you want by facilitating query objects.
   * Alternatively you can use QueryExpressions directly.
   *
   * Each passed expression is concatenated to the other ones by an and expression.
   *
   * This method can be called multiple times in order to add filters successively.
   *
   * @example
   * builder.filter(qPerson.lastName.eq("Smith"), qPerson.age.gt(18)) // $filter=LastName eq 'Smith' and Age gt 18
   * @example
   * builder.filter(qPerson.lastName.eq("Smith").or(qPerson.firstName.eq("Horst")) // $filter=LastName eq 'Smith' or FirstName eq 'Horst'
   * @param expressions possibly multiple expressions
   * @returns this query builder
   */
  filter: (...expressions: NullableParamList<QFilterExpression>) => ReturnType;

  /**
   * V4 search option, where the server decides how to apply the search value.
   * Null or undefined are allowed and will be ignored.
   *
   * Each passed expression is concatenated to the other ones by an and expression.
   *
   * This method can be called multiple times in order to add filters successively.
   *
   * Uses system query option $search.
   *
   * @example
   * builder.search("term1", "this is a phrase") // $search=term1 AND "this is a phrase"
   * @param terms
   * @returns this query builder
   */
  search: (...terms: NullableParamList<string | QSearchTerm>) => ReturnType;

  /**
   * Simple & plain expand of attributes which are entities or entity collections.
   *
   * This method can be called multiple times.
   *
   * @example
   * builder.expand("address", "altAddress") // $expand=Address,AltAddress
   * @param props the attributes to expand
   * @returns this query builder
   */
  expand: <Prop extends ExpandType<Q>>(...props: NullableParamList<Prop>) => ReturnType;

  /**
   * Expand one property, which is an entity or entity collection.
   * The second parameter is a callback function which receives a specialized URI builder and the proper query object
   * for the expanded entity.
   * With the help of the builder you can further select, filter, expand, etc.
   *
   * @example
   * builder.expanding("address", (addressBuilder, qAddress) => {
   *   addressBuilder
   *     .select("city")
   *     .filter(qAddress.country.eq("IT"))
   * })} // $expand=address($select=City;$filter=Country eq 'IT')
   * @param prop the name of the property which should be expanded (must be an entity or entity collection)
   * @param builderFn function which receives an entity specific builder as first & the appropriate query object as second argument
   * @returns this query builder
   */
  expanding: <Prop extends ExpandType<Q>>(prop: Prop, expBuilderFn: ExpandingFunction<Q[Prop]>) => ReturnType;

  /**
   * Simple group by clause for properties (no aggregate functionality yet).
   * Uses system query option $apply.
   *
   * Null or undefined are allowed and will be ignored.
   *
   * @example
   * builder.select("country").groupBy("country") // $select=Country&apply=groupby((Country))
   * @param props
   * @returns this query builder
   */
  groupBy: (...props: NullableParamList<keyof Q>) => ReturnType;

  /**
   * Count the list of result items. The query response will have an appropriate count field.
   *
   * @example
   * builder.count() // $count
   * @example
   * builder.count(false) // $count=false
   * @param doCount defaults to true
   * @returns this query builder
   */
  count: (doCount?: boolean) => ReturnType;

  /**
   * Limit the amount of records to retrieve.
   *
   * @example
   * builder.top(20) // $top=20
   * @param itemsTop max amount of items to fetch
   */
  top: (itemsTop: NullableParam<number>) => ReturnType;

  /**
   * Skips a specified number of records, e.g. skip the first 20 items.
   *
   * @example
   * builder.skip(20) // $skip=20
   * @param itemsToSkip number of records to skip
   * @returns this query builder
   */
  skip: (itemsToSkip: NullableParam<number>) => ReturnType;

  /**
   * Specify the sort order of the results by utilizing query objects.
   *
   * @example
   * builder.orderBy(qPerson.age.desc(), qPerson.name.asc()) // $orderby=Age desc,Name asc
   * @param expressions
   * @returns this query builder
   */
  orderBy: (...expressions: NullableParamList<QOrderByExpression>) => ReturnType;

  /**
   * Build the final URI string.
   *
   * @example
   * builder.build() // Person?$select=...&$expand=...
   * @returns the query string including the base service & collection path
   */
  build: () => string;
}

export interface V2ExpandingFunction<Q extends QueryObject, ReturnType> {
  /**
   * Expand one property, which is an entity or entity collection.
   * The second parameter is a callback function which receives a specialized URI builder and the proper query object
   * for the expanded entity.
   * With the help of the builder you can further select, filter, expand, etc.
   *
   * Expand nested props of the current entity.
   * You can then select, expand or do further expanding.
   *
   * @example
   * builder.expanding("address", (expBuilder) => expBuilder.select("street", "city")) // $select=address/street,address/city&$expand=address}
   * @example
   * builder.expanding("address", (expBuilder) => expBuilder.expand("country")) // $expand=address,address/country}
   * @param prop the name of the property which should be expanded (must be an entity or entity collection)
   * @param builderFn function which receives an entity specific builder as first & the appropriate query object as second argument
   * @returns this query builder
   */
  expanding: <Prop extends ExpandType<Q>>(prop: Prop, expBuilderFn: ExpandingFunctionV2<Q[Prop]>) => ReturnType;
}

type BuilderOp = "build";
type PaginationOps = "skip" | "top";
type BaseOps = "select" | "expand" | "filter" | "orderBy";

type V2ExpandingOps = "select" | "expand"; // custom expanding & build method
type V2Ops = BuilderOp | BaseOps | "count" | PaginationOps; // custom expanding method
type V4Ops = V2Ops | "expanding" | "groupBy" | "search";
type V4ExpandingOps = BuilderOp | BaseOps | "expanding" | PaginationOps;

export type V2ExpandResult = { selects: Array<string>; expands: Array<string> };

/**
 * Contract for ODataQueryBuilder for V2.
 */
export interface ODataQueryBuilderV2<Q extends QueryObject>
  extends Pick<ODataQueryBuilderModel<Q, ODataQueryBuilderV2<Q>>, V2Ops>,
    V2ExpandingFunction<Q, ODataQueryBuilderV2<Q>> {}

export interface ExpandingODataQueryBuilderV2<Q extends QueryObject>
  extends Pick<ODataQueryBuilderModel<Q, ExpandingODataQueryBuilderV2<Q>>, V2ExpandingOps>,
    V2ExpandingFunction<Q, ExpandingODataQueryBuilderV2<Q>> {
  /**
   * Build result is actually a list of select and expand strings, which must be consumed manually by the
   * caller of the build function.
   */
  build: () => V2ExpandResult;
}

export interface ODataQueryBuilderV4<Q extends QueryObject>
  extends Pick<ODataQueryBuilderModel<Q, ODataQueryBuilderV4<Q>>, V4Ops> {}

export interface ExpandingODataQueryBuilderV4<Q extends QueryObject>
  extends Pick<ODataQueryBuilderModel<Q, ExpandingODataQueryBuilderV4<Q>>, V4ExpandingOps> {}
