import type { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { QAction, QBooleanPath, QStringParam, QueryObject } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { Book_BoundActionParams } from "./TesterModel";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
}

export const qBook = new QBook();

export class Book_QBoundAction extends QAction<Book_BoundActionParams, ODataValueResponseV4<boolean>> {
  private readonly params = [new QStringParam("opt_Test", "optTest")];

  constructor() {
    super("Tester.BoundAction");
  }

  getParams() {
    return this.params;
  }
}
