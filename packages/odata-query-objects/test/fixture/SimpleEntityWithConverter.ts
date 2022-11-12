import { booleanToNumberConverter, fixedDateConverter, numberToStringConverter } from "@odata2ts/test-converters";

import { QBooleanPath, QDatePath, QEntityPath, QNumberPath, QueryObject } from "../../src";

export interface SimpleEntityWithConverter {
  id: number;
  truth: number | null;
  age: string | null;
  test?: TestEntity;
}

export interface TestEntity {
  name: string;
  createdAt: Date;
}

export class QSimpleEntityWithConverter extends QueryObject<SimpleEntityWithConverter> {
  public readonly id = new QNumberPath(this.withPrefix("ID"));
  public readonly truth = new QBooleanPath(this.withPrefix("truth"), booleanToNumberConverter);
  public readonly age = new QNumberPath(this.withPrefix("AGE"), numberToStringConverter);
  public readonly test = new QEntityPath(this.withPrefix("Test"), () => QTestEntity);
}

export class QTestEntity extends QueryObject<TestEntity> {
  public readonly name = new QNumberPath(this.withPrefix("NAME"));
  public readonly createdAt = new QDatePath(this.withPrefix("CREATED_AT"), fixedDateConverter);
}
