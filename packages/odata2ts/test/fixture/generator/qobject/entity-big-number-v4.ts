import { QBigNumberPath, QGuidPath, QueryObject } from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly price = new QBigNumberPath(this.withPrefix("price"));
  public readonly charCount = new QBigNumberPath(this.withPrefix("charCount"));
}

export const qBook = new QBook();
