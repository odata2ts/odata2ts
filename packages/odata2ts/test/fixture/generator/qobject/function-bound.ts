import type { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { QBooleanParam, QBooleanPath, QFunctionV4, QStringParam, QueryObject } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { Book_MinFunctionParams } from "./TesterModel";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
}

export const qBook = new QBook();

export class Book_QMinFunction extends QFunctionV4<Book_MinFunctionParams, ODataValueResponseV4<boolean>> {
  private readonly params = [new QStringParam("test"), new QBooleanParam("optTest")];

  constructor() {
    super("Tester.MinFunction");
  }

  getParams() {
    return this.params;
  }
}
