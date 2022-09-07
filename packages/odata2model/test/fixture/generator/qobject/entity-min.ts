import { QBooleanPath, QueryObject } from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
}

export const qBook = new QBook();
