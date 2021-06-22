import { DateTimeFilterFunctions } from "../../odata/ODataModel";
import { QNumberPath } from "../QNumberPath";

function buildFunc(path: string, func: DateTimeFilterFunctions) {
  return () => new QNumberPath(`${func}(${path})`);
}

export function yearFn(path: string) {
  return buildFunc(path, DateTimeFilterFunctions.YEAR);
}

export function monthFn(path: string) {
  return buildFunc(path, DateTimeFilterFunctions.MONTH);
}

export function dayFn(path: string) {
  return buildFunc(path, DateTimeFilterFunctions.DAY);
}

export function hourFn(path: string) {
  return buildFunc(path, DateTimeFilterFunctions.HOUR);
}

export function minuteFn(path: string) {
  return buildFunc(path, DateTimeFilterFunctions.MINUTE);
}

export function secondFn(path: string) {
  return buildFunc(path, DateTimeFilterFunctions.SECOND);
}
