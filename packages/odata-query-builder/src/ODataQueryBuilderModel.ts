import {
  QEntityCollectionPath,
  QEntityPath,
  QFilterExpression,
  QOrderByExpression,
  QSearchTerm,
  QSelectExpression,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";

/**
 * Extracts the wrapped entity from QEntityPath or QEntityCollectionPath
 */
export type EntityExtractor<QProp> =
  QProp extends QEntityPath<infer ET> ? ET : QProp extends QEntityCollectionPath<infer ET> ? ET : never;

/**
 * Extracts all keys from a property (Q*Path), but only for the given types
 */
export type ExtractPropertyNamesOfType<QPath, QPathTypes> = {
  [Key in keyof QPath]: QPath[Key] extends QPathTypes ? Key : never;
}[keyof QPath];

/**
 * Retrieves all property names which are expandable,
 * i.e. props of type QEntityPath and QEntityCollectionPath
 */
export type ExpandType<Q extends QueryObjectModel> = ExtractPropertyNamesOfType<
  Q,
  QEntityPath<any> | QEntityCollectionPath<any>
>;

export type Nullable = null | undefined;

export type NullableParam<OptionType> = OptionType | Nullable;

export type NullableParamList<OptionType> = Array<OptionType | Nullable>;

/**
 * The nested builder type passed into an `expanding()` callback depends on whether the expanded property
 * is a to-one (single model) or to-many (collection) navigation property: a to-one target only allows
 * select/expand/expanding, while a to-many target keeps the full set of system query options.
 */
export type ExpandingFunction<Prop> =
  | (Prop extends QEntityCollectionPath<any>
      ? (expBuilder: ExpandingCollectionQueryBuilderV4<EntityExtractor<Prop>>, qObject: EntityExtractor<Prop>) => void
      : (expBuilder: ExpandingModelQueryBuilderV4<EntityExtractor<Prop>>, qObject: EntityExtractor<Prop>) => void)
  | Nullable;

export type ExpandingFunctionV2<Prop> =
  | ((expBuilder: ExpandingQueryBuilderV2<EntityExtractor<Prop>>, qObject: EntityExtractor<Prop>) => void)
  | Nullable;

export interface ODataQueryBuilderConfig {
  expandingBuilder?: boolean;
  unencoded?: boolean;
}

/**
 * Represents all possible builder operations.
 * However, any builder will only be composed of a subset of these operations.
 */
export interface ODataQueryBuilderModel<Q extends QueryObjectModel, ReturnType> {
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
  select: (...props: NullableParamList<keyof Q | QSelectExpression>) => ReturnType;

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
  expand: <Prop extends ExpandType<Q>>(...props: NullableParamList<Prop | QSelectExpression>) => ReturnType;

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

export interface V2ExpandingFunction<Q extends QueryObjectModel, ReturnType> {
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
   * builder.expanding("address", (expBuilder) => expBuilder.select("street", "city")) // $select=address/street,address/city&$expand=address
   * @example
   * builder.expanding("address", (expBuilder) => expBuilder.expand("country")) // $expand=address,address/country
   * @param prop the name of the property which should be expanded (must be an entity or entity collection)
   * @param builderFn function which receives an entity specific builder as first & the appropriate query object as second argument
   * @returns this query builder
   */
  expanding: <Prop extends ExpandType<Q>>(prop: Prop, expBuilderFn: ExpandingFunctionV2<Q[Prop]>) => ReturnType;
}

type BuilderOp = "build";
type ModelOps = "select" | "expand" | BuilderOp;
type CollectionOnlyOps = "filter" | "orderBy" | "count" | "skip" | "top";

// custom `expanding` method implementation not listed here
type V2ModelOps = ModelOps;
type V2CollectionOps = ModelOps | CollectionOnlyOps;
// custom expanding & build method
type V2ExpandingOps = "select" | "expand";

type V4ModelOps = ModelOps | "expanding";
type V4CollectionOps = V4ModelOps | CollectionOnlyOps | "groupBy" | "search";
type V4ModelExpandingOps = V4ModelOps;
type V4CollectionExpandingOps = V4ModelOps | CollectionOnlyOps;

export type V2ExpandResult = { selects: Array<string>; expands: Array<string> };

/**
 * Contract for ODataQueryBuilder for V2, bound to a collection of models:
 * exposes the full set of system query options.
 */
export interface CollectionQueryBuilderV2<Q extends QueryObjectModel>
  extends Pick<ODataQueryBuilderModel<Q, CollectionQueryBuilderV2<Q>>, V2CollectionOps>,
    V2ExpandingFunction<Q, CollectionQueryBuilderV2<Q>> {
  /**
   * Creates a new builder with the identical state (deep copy).
   */
  clone: () => CollectionQueryBuilderV2<Q>;
}

/**
 * Contract for ODataQueryBuilder for V2, bound to a single model (EntityType or ComplexType instance):
 * only select/expand/expanding are meaningful.
 */
export interface ModelQueryBuilderV2<Q extends QueryObjectModel>
  extends Pick<ODataQueryBuilderModel<Q, ModelQueryBuilderV2<Q>>, V2ModelOps>,
    V2ExpandingFunction<Q, ModelQueryBuilderV2<Q>> {
  /**
   * Creates a new builder with the identical state (deep copy).
   */
  clone: () => ModelQueryBuilderV2<Q>;
}

export interface ExpandingQueryBuilderV2<Q extends QueryObjectModel>
  extends Pick<ODataQueryBuilderModel<Q, ExpandingQueryBuilderV2<Q>>, V2ExpandingOps>,
    V2ExpandingFunction<Q, ExpandingQueryBuilderV2<Q>> {
  /**
   * Build result is actually a list of select and expand strings, which must be consumed manually by the
   * caller of the build function.
   */
  build: () => V2ExpandResult;
}

/**
 * Contract for ODataQueryBuilder for V4, bound to a collection of models:
 * exposes the full set of system query options.
 */
export interface CollectionQueryBuilderV4<Q extends QueryObjectModel>
  extends Pick<ODataQueryBuilderModel<Q, CollectionQueryBuilderV4<Q>>, V4CollectionOps> {
  /**
   * Creates a new builder with the identical state (deep copy).
   */
  clone: () => CollectionQueryBuilderV4<Q>;
}

/**
 * Contract for ODataQueryBuilder for V4, bound to a single model (EntityType or ComplexType instance):
 * only select/expand/expanding are meaningful.
 */
export interface ModelQueryBuilderV4<Q extends QueryObjectModel>
  extends Pick<ODataQueryBuilderModel<Q, ModelQueryBuilderV4<Q>>, V4ModelOps> {
  /**
   * Creates a new builder with the identical state (deep copy).
   */
  clone: () => ModelQueryBuilderV4<Q>;
}

export interface ExpandingCollectionQueryBuilderV4<Q extends QueryObjectModel>
  extends Pick<ODataQueryBuilderModel<Q, ExpandingCollectionQueryBuilderV4<Q>>, V4CollectionExpandingOps> {}

export interface ExpandingModelQueryBuilderV4<Q extends QueryObjectModel>
  extends Pick<ODataQueryBuilderModel<Q, ExpandingModelQueryBuilderV4<Q>>, V4ModelExpandingOps> {}
