import { QueryObject, QGuidPath } from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));

  constructor(path?: string) {
    super(path);
  }
}

export const qBook = new QBook();
