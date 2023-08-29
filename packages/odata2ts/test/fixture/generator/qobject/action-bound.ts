import { QAction, QBooleanPath, QStringParam, QueryObject } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { Book_BoundActionParams } from "./TesterModel";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
}

export const qBook = new QBook();

export class Book_QBoundAction extends QAction<Book_BoundActionParams> {
  private readonly params = [new QStringParam("opt_Test", "optTest")];

  constructor() {
    super("Tester.BoundAction");
  }

  getParams() {
    return this.params;
  }
}
