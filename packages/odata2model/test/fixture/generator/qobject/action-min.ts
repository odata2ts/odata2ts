import { QAction, QStringParam } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { MinActionParams } from "./TesterModel";

export class QMinAction extends QAction<MinActionParams> {
  private readonly params = [new QStringParam("test"), new QStringParam("optTest")];

  constructor() {
    super("MinAction");
  }

  getParams() {
    return this.params;
  }
}
