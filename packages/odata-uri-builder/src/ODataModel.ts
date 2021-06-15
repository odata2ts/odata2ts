export const enum ODataOperators {
  SELECT = "$select",
  FILTER = "$filter",
  SKIP = "$skip",
  TOP = "$top",
  EXPAND = "$expand",
  COUNT = "$count",
}

export const enum ODataFilterOperators {
  EQUALS = "eq",
  NOT_EQUALS = "ne",
  LOWER_THAN = "lt",
  LOWER_EQUALS = "le",
  GREATER_THAN = "gt",
  GREATER_EQUALS = "ge",
}

export const enum StringAndCollectionQueryFunctions {
  STARTS_WITH = "startswith",
  ENDS_WITH = "endswith",
  CONTAINS = "contains",
  INDEX_OF = "indexof",
  LENGTH = "length",
  CONCAT = "concat",
}

// export const enum CollectionQueryFunctions {
//   HAS_SUBSET = "hassubset",
//   HAS_SUBSEQUENCE = "hassubsequence",
// }

export const enum StringFunctions {
  TO_UPPER = "toupper",
  TO_LOWER = "tolower",
  CONTAINS = "contains",
  INDEX_OF = "indexof",
  LENGTH = "length",
  CONCAT = "concat",
}
