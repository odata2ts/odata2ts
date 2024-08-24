import { DateTimeFilterFunctions } from "../../odata/ODataModel";
import { buildFunctionExpression } from "../../param/UrlParamHelper";
import { QNumberV2Path } from "./QNumberV2Path";

function buildNumberReturningFunction(func: DateTimeFilterFunctions, path: string) {
  return () => new QNumberV2Path(buildFunctionExpression(func, path));
}

export function yearFn(path: string): () => QNumberV2Path {
  return buildNumberReturningFunction(DateTimeFilterFunctions.YEAR, path);
}

export function monthFn(path: string): () => QNumberV2Path {
  return buildNumberReturningFunction(DateTimeFilterFunctions.MONTH, path);
}

export function dayFn(path: string): () => QNumberV2Path {
  return buildNumberReturningFunction(DateTimeFilterFunctions.DAY, path);
}

export function hourFn(path: string): () => QNumberV2Path {
  return buildNumberReturningFunction(DateTimeFilterFunctions.HOUR, path);
}

export function minuteFn(path: string): () => QNumberV2Path {
  return buildNumberReturningFunction(DateTimeFilterFunctions.MINUTE, path);
}

export function secondFn(path: string): () => QNumberV2Path {
  return buildNumberReturningFunction(DateTimeFilterFunctions.SECOND, path);
}
