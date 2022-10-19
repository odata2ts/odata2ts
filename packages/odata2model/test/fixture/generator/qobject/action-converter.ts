import { QAction, QStringParam } from "@odata2ts/odata-query-objects";
import { stringToPrefixModelConverter } from "@odata2ts/test-converters";

// @ts-ignore
import { ActionWithConverterParams } from "./TesterModel";

export class QActionWithConverter extends QAction<ActionWithConverterParams> {
  private readonly params = [new QStringParam("test", undefined, stringToPrefixModelConverter)];

  constructor() {
    super("ActionWithConverter");
  }

  getParams() {
    return this.params;
  }
}
