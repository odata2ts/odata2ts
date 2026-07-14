import { ODataModelResponseV4, ODataValueResponseV2, ODataValueResponseV4 } from "@odata2ts/odata-core";
import { booleanToNumberConverter } from "@odata2ts/test-converters";
import {
  ModelResponseConverterV4,
  QAction,
  QFunctionV2,
  QFunctionV4,
  ValueResponseConverterV2,
  ValueResponseConverterV4,
} from "../../../src";
import { QSimpleEntityWithConverter, SimpleEntityWithConverter } from "../SimpleEntityWithConverter";

export class QPrimitiveReturningFunction extends QFunctionV4<undefined, ODataValueResponseV4<number>> {
  constructor() {
    super("Primitive", new ValueResponseConverterV4<number>(booleanToNumberConverter));
  }

  public getParams() {
    return [];
  }
}

export class QPrimitiveReturningFunctionV2 extends QFunctionV2<undefined, ODataValueResponseV2<number>> {
  constructor() {
    super("Primitive", new ValueResponseConverterV2<number>(booleanToNumberConverter));
  }

  public getParams() {
    return [];
  }
}

export class QComplexReturningAction extends QAction<undefined, ODataModelResponseV4<SimpleEntityWithConverter>> {
  constructor() {
    super("Complex", new ModelResponseConverterV4<SimpleEntityWithConverter>(new QSimpleEntityWithConverter()));
  }

  public getParams() {
    return [];
  }
}
