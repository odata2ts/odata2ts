import { QueryObject, QBooleanPath } from "@odata2ts/odata-query-objects";

export class QBrand extends QueryObject {
  public readonly naming = new QBooleanPath(this.withPrefix("naming"));
}

export const qBrand = new QBrand();
