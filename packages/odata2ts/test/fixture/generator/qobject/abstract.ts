import { QBooleanParam, QBooleanPath, QId, QueryObject } from "@odata2ts/odata-query-objects";

// @ts-ignore
import type { ExtendsFromEntityId } from "./TesterModel";

export class QBook extends QueryObject {}

export const qBook = new QBook();

export class QExtendsFromEntity extends QBook {
  public readonly id = new QBooleanPath(this.withPrefix("ID"));
}

export const qExtendsFromEntity = new QExtendsFromEntity();

export class QExtendsFromEntityId extends QId<ExtendsFromEntityId> {
  private readonly params = [new QBooleanParam("ID", "id")];

  getParams() {
    return this.params;
  }
}

export class QComplex extends QueryObject {}

export const qComplex = new QComplex();

export class QExtendsFromComplex extends QComplex {
  public readonly test = new QBooleanPath(this.withPrefix("test"));
}

export const qExtendsFromComplex = new QExtendsFromComplex();
