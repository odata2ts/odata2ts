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
  CONTAINS = "contains", // v4 only
  SUBSTRING_OF = "substringof", // v2 only
  ENDS_WITH = "endswith",
  INDEX_OF = "indexof",
  LENGTH = "length",
  STARTS_WITH = "startswith",
  // SUBSTRING = "substring"
  MATCHES_PATTERN = "matchesPattern", // v4 only
  TO_LOWER = "tolower",
  TO_UPPER = "toupper",
  TRIM = "trim",
  // REPLACE = "replace", // v2 only
}

export type StringFilterFunctionModelV2 = StandardFilterOperators &
  Omit<StringFilterFunctions, "CONTAINS" | "MATCHES_PATTERN">;

export type StringFilterFunctionModelV4 = StandardFilterOperators & Omit<StringFilterFunctions, "SUBSTRING_OF">;

export const enum NumberFilterOperators {
  ADDITION = "add",
  SUBTRACTION = "sub",
  MULTIPLICATION = "mul",
  DIVISION = "div",
  DIVISION_WITH_FRACTION = "divby", //v4 only
  MODULO = "mod",
}

export const enum NumberFilterFunctions {
  CEILING = "ceiling",
  FLOOR = "floor",
  ROUND = "round",
}

export const enum DateTimeFilterFunctions {
  YEAR = "year",
  MONTH = "month",
  DAY = "day",
  HOUR = "hour",
  MINUTE = "minute",
  SECOND = "second",
  DATE = "date", // v4 only
  TIME = "time", // v4 only
  // TOTAL_OFFSET_MINUTES = "totaloffsetminutes",
  // TOTAL_SECONDS = "totalseconds",
}

export const enum CollectionFilterFunctions {
  STARTS_WITH = "startswith",
  ENDS_WITH = "endswith",
  CONTAINS = "contains",
  INDEX_OF = "indexof",
  LENGTH = "length",
  CONCAT = "concat",
}

export const enum LambdaFunctions {
  ANY = "any",
  ALL = "all",
}
