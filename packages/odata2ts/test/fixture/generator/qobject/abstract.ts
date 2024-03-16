import { QBooleanParam, QBooleanPath, QId, QueryObject } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { ExtendsFromEntityId } from "./TesterModel";

export abstract class QBook extends QueryObject {}

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

export abstract class QComplex extends QueryObject {}

export class QExtendsFromComplex extends QComplex {
  public readonly test = new QBooleanPath(this.withPrefix("test"));
}

export const qExtendsFromComplex = new QExtendsFromComplex();
