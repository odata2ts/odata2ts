import {
  QCollectionPath,
  QEntityCollectionPath,
  QEntityPath,
  QFilterExpression,
  QOrderByExpression,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import { ExpandingODataUriBuilderV2, ExpandingODataUriBuilderV4 } from "./internal";

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

export type EntityPropNames<Q extends QueryObject> = Array<keyof Q | null | undefined>;

export interface ODataUriBuilderConfig {
  expandingBuilder?: boolean;
  unencoded?: boolean;
}

export interface ODataUriBuilderModel<Q extends QueryObject, ReturnType> {
  count: (doCount?: boolean) => ReturnType;

  search: (term: string | undefined | null) => ReturnType;

  /**
   * Name the properties of the entity you want to select.
   * Null or undefined are allowed and will be ignored.
   *
   * This function can be called multiple times.
   *
   * If you want to select nested properties, e.g. "address/street", then you need to use a function.
   * The first parameter of the function will be the current QueryObject of the UriBuilder.
   *
   * Examples:
   * - {@code select("lastName", "firstName", undefined) } => $select=lastName,firstName
   * - {@code select("lastName", false ? "firstName" : undefined) } => $select=lastName
   *
   * @param props the property names to select or a function to select one or more QPathModels from QueryObject
   * @returns this query builder
   */
  select: (...props: EntityPropNames<Q>) => ReturnType;

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
  filter: (...expressions: Array<QFilterExpression>) => ReturnType;

  /**
   * Simple & plain expand of the given entities or entity collections.
   *
   * This method can be called multiple times.
   *
   * @param props the attributes to expand
   * @returns this query builder
   */
  expand: <Prop extends ExpandType<Q>>(...props: Array<Prop>) => ReturnType;
  expanding: <Prop extends ExpandType<Q>>(
    prop: Prop,
    expBuilderFn: (
      expBuilder: ExpandingODataUriBuilderV4<EntityExtractor<Q[Prop]>>,
      qObject: EntityExtractor<Q[Prop]>
    ) => void
  ) => ReturnType;
  groupBy: (...props: EntityPropNames<Q>) => ReturnType;
  skip: (itemsToSkip: number) => ReturnType;
  top: (itemsTop: number) => ReturnType;
  orderBy: (...expressions: Array<QOrderByExpression>) => ReturnType;
  build: () => string;
}

type BuilderOp = "build";
type PaginationOps = "skip" | "top";
type BaseOps = "select" | "expand" | "filter" | "orderBy";
type V2Ops = BaseOps | "count" | PaginationOps;
type V4Ops = V2Ops | "expanding" | "groupBy" | "search";
type V2ExpandingOps = "select";
type V4ExpandingOps = BaseOps | "expanding" | PaginationOps;

type V2ExpandResult = { selects?: Array<string>; expands?: Array<string> };

export interface ODataUriBuilderV2Model<Q extends QueryObject>
  extends Pick<ODataUriBuilderModel<Q, ODataUriBuilderV2Model<Q>>, BuilderOp | V2Ops | PaginationOps> {
  expanding: <Prop extends ExpandType<Q>>(
    prop: Prop,
    expBuilderFn: (
      expBuilder: ExpandingODataUriBuilderV2<EntityExtractor<Q[Prop]>>,
      qObject: EntityExtractor<Q[Prop]>
    ) => void
  ) => this;
}

export interface ExpandingODataUriBuilderV2Model<Q extends QueryObject>
  extends Pick<ODataUriBuilderModel<Q, ExpandingODataUriBuilderV2Model<Q>>, V2ExpandingOps> {
  build: () => V2ExpandResult;
}

export interface ODataUriBuilderV4Model<Q extends QueryObject>
  extends Pick<ODataUriBuilderModel<Q, ODataUriBuilderV4Model<Q>>, BuilderOp | V4Ops> {}

export interface ExpandingODataUriBuilderV4Model<Q extends QueryObject>
  extends Pick<ODataUriBuilderModel<Q, ExpandingODataUriBuilderV4Model<Q>>, BuilderOp | V4ExpandingOps> {}
