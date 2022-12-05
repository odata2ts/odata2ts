import {
  OperationReturnType,
  QAction,
  QComplexParam,
  QStringParam,
  QStringPath,
  QueryObject,
  ReturnTypes,
} from "@odata2ts/odata-query-objects";
import { stringToPrefixModelConverter } from "@odata2ts/test-converters";

// @ts-ignore
import { ActionWithConverterParams } from "./TesterModel";

export class QPerson extends QueryObject {
  public readonly id = new QStringPath(this.withPrefix("id"), stringToPrefixModelConverter);
}

export const qPerson = new QPerson();

export class QActionWithConverter extends QAction<ActionWithConverterParams> {
  private readonly params = [new QStringParam("test", undefined, stringToPrefixModelConverter)];

  constructor() {
    super(
      "ActionWithConverter",
      new OperationReturnType(ReturnTypes.COMPLEX, new QComplexParam("NONE", new QPerson()))
    );
  }

  getParams() {
    return this.params;
  }
}
