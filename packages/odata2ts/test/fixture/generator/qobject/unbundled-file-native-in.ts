import { QNumberPath, QueryObject } from "@odata2ts/odata-query-objects";
// @ts-ignore
import { OPTS } from "../../QTester.js";

export class QBook extends QueryObject {
  public readonly id = new QNumberPath(this.withPrefix("id"), undefined, OPTS);
}

export const qBook = new QBook();
