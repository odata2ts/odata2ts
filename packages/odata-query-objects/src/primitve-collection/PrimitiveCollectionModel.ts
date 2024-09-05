const ATTRIBUTE_NAME = "it";

export interface PrimitiveCollectionType<T> {
  [ATTRIBUTE_NAME]: T;
}

export type StringCollection = PrimitiveCollectionType<string>;
export type NumberCollection = PrimitiveCollectionType<number>;
export type BooleanCollection = PrimitiveCollectionType<boolean>;
export type EnumCollection<T> = PrimitiveCollectionType<T>;
export type NumericEnumCollection<T> = PrimitiveCollectionType<T>;

export type PrimitiveCollection =
  | StringCollection
  | NumberCollection
  | BooleanCollection
  | EnumCollection<any>
  | NumericEnumCollection<any>;
