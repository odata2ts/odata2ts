import { QEnumPath, QGuidPath, QueryObject } from "@odata2ts/odata-query-objects";
import { Status, StatusConverter } from "./TesterModel.js";

export class QBook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly status = new QEnumPath(this.withPrefix("status"), Status, StatusConverter);
}

export const qBook = new QBook();
