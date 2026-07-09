import { booleanToNumberConverter } from "@odata2ts/test-converters";
import { QAction, QBooleanParam, QComplexParam, QFunction, ReturnTypes } from "../../../src";
import { QSimpleEntityWithConverter, SimpleEntityWithConverter } from "../SimpleEntityWithConverter";

const CUSTOM_RETURN_TYPE = new QBooleanParam("NONE", undefined, booleanToNumberConverter);

export class QPrimitiveReturningFunction extends QFunction<undefined, number> {
  constructor() {
    super("Primitive", ReturnTypes.VALUE, CUSTOM_RETURN_TYPE);
  }

  public getParams() {
    return [];
  }
}

export class QPrimitiveReturningFunctionV2 extends QFunction<undefined, number> {
  constructor() {
    super("Primitive", ReturnTypes.VALUE, CUSTOM_RETURN_TYPE, { v2Mode: true });
  }

  public getParams() {
    return [];
  }
}

export class QComplexReturningAction extends QAction<undefined, SimpleEntityWithConverter> {
  constructor() {
    super(
      "Complex",
      ReturnTypes.ENTITY,
      new QComplexParam<SimpleEntityWithConverter, QSimpleEntityWithConverter>("XXX", new QSimpleEntityWithConverter()),
    );
  }

  public getParams() {
    return [];
  }
}
