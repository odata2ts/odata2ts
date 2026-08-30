import { QGuidParam, QGuidPath, QId, QStringParam, QStringPath, QueryObject } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { BookId } from "./TesterModel.js";

export class QBook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly isbn = new QStringPath(this.withPrefix("isbn"));
}

export const qBook = new QBook();

export class QBookId extends QId<BookId> {
  private readonly params = [[new QGuidParam("id")], [new QStringParam("ISBN", "isbn")]];

  getParams() {
    return this.params;
  }
}
