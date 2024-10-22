import { QBooleanParam, QBooleanPath, QId, QueryObject } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { ExtendsFromEntityId } from "./TesterModel";

export class QBookBaseType extends QueryObject {}

export class QBook extends QBookBaseType {
  public readonly asQExtendsFromEntity = new QExtendsFromEntity(this.withPrefix("Tester.ExtendsFromEntity"));
}

export const qBook = new QBook();

export class QExtendsFromEntity extends QBookBaseType {
  public readonly id = new QBooleanPath(this.withPrefix("ID"));
}

export const qExtendsFromEntity = new QExtendsFromEntity();

export class QExtendsFromEntityId extends QId<ExtendsFromEntityId> {
  private readonly params = [new QBooleanParam("ID", "id")];

  getParams() {
    return this.params;
  }
}

export class QComplexBaseType extends QueryObject {}

export class QComplex extends QComplexBaseType {
  public readonly asQExtendsFromComplex = new QExtendsFromComplex(this.withPrefix("Tester.ExtendsFromComplex"));
}

export const qComplex = new QComplex();

export class QExtendsFromComplex extends QComplexBaseType {
  public readonly test = new QBooleanPath(this.withPrefix("test"));
}

export const qExtendsFromComplex = new QExtendsFromComplex();
