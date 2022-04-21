import {
  QCollectionPath,
  QEntityCollectionPath,
  QEntityPath,
  QFilterExpression,
  QOrderByExpression,
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

export interface ODataUriBuilder<Q extends QueryObject> {
  select: (...props: Array<keyof Q | null | undefined>) => this;
  expand: <Prop extends ExpandType<Q>>(...props: Array<Prop>) => this;
  skip: (itemsToSkip: number) => this;
  top: (itemsTop: number) => this;
  orderBy: (...expressions: Array<QOrderByExpression>) => this;
  filter: (...expressions: Array<QFilterExpression>) => this;
  build: () => string;
}
