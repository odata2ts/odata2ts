import { createChain } from "@odata2ts/converter-runtime";
import { QBooleanPath, QueryObject } from "@odata2ts/odata-query-objects";
import { booleanToNumberConverter, numberToStringConverter } from "@odata2ts/test-converters";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(
    this.withPrefix("id"),
    createChain(booleanToNumberConverter, numberToStringConverter)
  );
  public readonly optional = new QBooleanPath(
    this.withPrefix("optional"),
    createChain(booleanToNumberConverter, numberToStringConverter)
  );
}

export const qBook = new QBook();
