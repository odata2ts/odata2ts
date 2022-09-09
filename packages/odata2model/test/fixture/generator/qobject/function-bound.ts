import { QBooleanPath, QFunction, QStringParam, QueryObject } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { MinFunctionParams } from "./TesterModel";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
}

export const qBook = new QBook();

export class QMinFunction extends QFunction<MinFunctionParams> {
  private readonly params = [new QStringParam("test"), new QStringParam("optTest")];

  constructor() {
    super("MinFunction");
  }

  getParams() {
    return this.params;
  }
}
