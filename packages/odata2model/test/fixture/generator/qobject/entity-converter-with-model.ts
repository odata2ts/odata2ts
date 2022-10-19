import { QBooleanPath, QStringPath, QueryObject } from "@odata2ts/odata-query-objects";
import { stringToPrefixModelConverter } from "@odata2ts/test-converters";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
  public readonly optional = new QStringPath(this.withPrefix("optional"), stringToPrefixModelConverter);
}

export const qBook = new QBook();
