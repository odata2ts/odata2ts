import {
  QBooleanPath,
  QCollectionPath,
  QDateTimeOffsetPath,
  QGuidCollection,
  QNumberPath,
  QStringCollection,
  QStringPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QNumberPath(this.withPrefix("id"), undefined, { nativeIn: true });
  public readonly testBoolean = new QBooleanPath(this.withPrefix("testBoolean"), undefined, { nativeIn: true });
  public readonly testTime = new QStringPath(this.withPrefix("testTime"), undefined, { nativeIn: true });
  public readonly testDate = new QStringPath(this.withPrefix("testDate"), undefined, { nativeIn: true });
  public readonly testDateTimeOffset = new QDateTimeOffsetPath(this.withPrefix("testDateTimeOffset"), undefined, {
    nativeIn: true,
  });
  public readonly testString = new QStringPath(this.withPrefix("testString"), undefined, { nativeIn: true });
  public readonly testAny = new QStringPath(this.withPrefix("testAny"), undefined, { nativeIn: true });
  public readonly multipleIds = new QCollectionPath(this.withPrefix("multipleIds"), () => QGuidCollection);
  public readonly multipleStrings = new QCollectionPath(this.withPrefix("multipleStrings"), () => QStringCollection);
}

export const qBook = new QBook();
