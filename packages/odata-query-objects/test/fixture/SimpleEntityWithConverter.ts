import { booleanToNumberConverter, fixedDateConverter, numberToStringConverter } from "@odata2ts/test-converters";

import {
  QBooleanCollection,
  QBooleanPath,
  QCollectionPath,
  QDatePath,
  QEntityCollectionPath,
  QEntityPath,
  QNumberPath,
  QueryObject,
} from "../../src";

export interface SimpleEntityUnconverted {
  ID: number;
  truth: boolean | null;
  AGE: number | null;
}

export interface SimpleEntityWithConverter {
  id: number;
  truth: number | null;
  age: string | null;
}

export interface TestEntity {
  name: string;
  createdAt: Date;
  simpleEntity: SimpleEntityWithConverter;
  simpleEntities: Array<SimpleEntityWithConverter>;
  options: Array<number>;
}

export class QSimpleEntityWithConverter extends QueryObject<SimpleEntityWithConverter> {
  public readonly id = new QNumberPath(this.withPrefix("ID"));
  public readonly truth = new QBooleanPath(this.withPrefix("truth"), booleanToNumberConverter);
  public readonly age = new QNumberPath(this.withPrefix("AGE"), numberToStringConverter);
}

export class QTestEntity extends QueryObject<TestEntity> {
  public readonly name = new QNumberPath(this.withPrefix("NAME"));
  public readonly createdAt = new QDatePath(this.withPrefix("CREATED_AT"), fixedDateConverter);
  public readonly simpleEntity = new QEntityPath(this.withPrefix("simple"), () => QSimpleEntityWithConverter);
  public readonly simpleEntities = new QEntityCollectionPath(
    this.withPrefix("simpleList"),
    () => QSimpleEntityWithConverter
  );
  public readonly options = new QCollectionPath(
    this.withPrefix("options"),
    () => QBooleanCollection,
    booleanToNumberConverter
  );
}
