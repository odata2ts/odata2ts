import { DateTimeFilterFunctions } from "../../odata/ODataModel";
import { buildFunctionExpression } from "../../param/UrlParamHelper";
import { QNumberPath } from "./QNumberPath";

function buildNumberReturningFunction(func: DateTimeFilterFunctions, path: string) {
  return () => new QNumberPath(buildFunctionExpression(func, path));
}

export function yearFn(path: string): () => QNumberPath {
  return buildNumberReturningFunction(DateTimeFilterFunctions.YEAR, path);
}

export function monthFn(path: string): () => QNumberPath {
  return buildNumberReturningFunction(DateTimeFilterFunctions.MONTH, path);
}

export function dayFn(path: string): () => QNumberPath {
  return buildNumberReturningFunction(DateTimeFilterFunctions.DAY, path);
}

export function hourFn(path: string): () => QNumberPath {
  return buildNumberReturningFunction(DateTimeFilterFunctions.HOUR, path);
}

export function minuteFn(path: string): () => QNumberPath {
  return buildNumberReturningFunction(DateTimeFilterFunctions.MINUTE, path);
}

export function secondFn(path: string): () => QNumberPath {
  return buildNumberReturningFunction(DateTimeFilterFunctions.SECOND, path);
}
