import { QueryObject, QBooleanPath } from "@odata2ts/odata-query-objects";

export class QBrand extends QueryObject {
  public readonly naming = new QBooleanPath(this.withPrefix("naming"));

  constructor(path?: string) {
    super(path);
  }
}

export const qBrand = new QBrand();
