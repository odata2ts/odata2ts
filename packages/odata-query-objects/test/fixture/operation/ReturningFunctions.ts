import { booleanToNumberConverter } from "@odata2ts/test-converters";

import { OperationReturnType, QAction, QBooleanParam, QComplexParam, QFunction, ReturnTypes } from "../../../src";
import { QSimpleEntityWithConverter } from "../SimpleEntityWithConverter";

export const PRIMITIVE = new OperationReturnType(
  ReturnTypes.VALUE,
  new QBooleanParam("NONE", undefined, booleanToNumberConverter)
);

const MODEL = new OperationReturnType(ReturnTypes.COMPLEX, new QComplexParam("XXX", new QSimpleEntityWithConverter()));

export class QPrimitiveReturningFunction extends QFunction<{}> {
  constructor() {
    super("Primitive", PRIMITIVE);
  }

  public getParams() {
    return [];
  }
}

export class QPrimitiveReturningFunctionV2 extends QFunction<{}> {
  constructor() {
    super("Primitive", PRIMITIVE, { v2Mode: true });
  }

  public getParams() {
    return [];
  }
}

export class QComplexReturningAction extends QAction<{}> {
  constructor() {
    super("Complex", MODEL);
  }

  public getParams() {
    return [];
  }
}
