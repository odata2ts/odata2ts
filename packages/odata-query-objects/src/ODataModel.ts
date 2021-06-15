export const enum StandardFilterOperators {
  EQUALS = "eq",
  NOT_EQUALS = "ne",
  LOWER_THAN = "lt",
  LOWER_EQUALS = "le",
  GREATER_THAN = "gt",
  GREATER_EQUALS = "ge",
  // HAS = "has",
  // IN = "in",
}

export const enum StringFilterFunctions {
  CONCAT = "concat",
  CONTAINS = "contains",
  ENDS_WITH = "endswith",
  INDEX_OF = "indexof",
  LENGTH = "length",
  STARTS_WITH = "startswith",
  // SUBSTRING = "substring"
  MATCHES_PATTERN = "matchesPattern",
  TO_LOWER = "tolower",
  TO_UPPER = "toupper",
  TRIM = "trim",
}

export const enum NumberFilterOperators {
  ADDITION = "add",
  SUBTRACTION = "sub",
  MULTIPLICATION = "mul",
  DIVISION = "div",
  DIVISION_WITH_FRACTION = "divby",
  MODULO = "mod",
}

export const enum NumberFilterFunctions {
  CEILING = "ceiling",
  FLOOR = "floor",
  ROUND = "round",
}

export const enum CollectionFilterFunctions {
  STARTS_WITH = "startswith",
  ENDS_WITH = "endswith",
  CONTAINS = "contains",
  INDEX_OF = "indexof",
  LENGTH = "length",
  CONCAT = "concat",
}
