import { QBooleanPath, QEntityPath, QueryObject } from "@odata2ts/odata-query-objects";

export class QBrand extends QueryObject {
  public readonly naming = new QBooleanPath(this.withPrefix("naming"));
  public readonly complex = new QEntityPath(this.withPrefix("complex"), () => QTest);
}

export const qBrand = new QBrand();

export class QTest extends QueryObject {
  public readonly test = new QBooleanPath(this.withPrefix("test"));
}

export const qTest = new QTest();
