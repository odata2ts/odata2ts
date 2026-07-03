import {
  QBooleanPath,
  QCollectionPath,
  QDatePath,
  QDateTimeOffsetPath,
  QGuidCollection,
  QNumberPath,
  QStringCollection,
  QStringPath,
  QTimeOfDayPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";

const OPTS = { nativeIn: true };

export class QBook extends QueryObject {
  public readonly id = new QNumberPath(this.withPrefix("id"), undefined, OPTS);
  public readonly testBoolean = new QBooleanPath(this.withPrefix("testBoolean"), undefined, OPTS);
  public readonly testTime = new QTimeOfDayPath(this.withPrefix("testTime"), undefined, OPTS);
  public readonly testDate = new QDatePath(this.withPrefix("testDate"), undefined, OPTS);
  public readonly testDateTimeOffset = new QDateTimeOffsetPath(this.withPrefix("testDateTimeOffset"), undefined, OPTS);
  public readonly testString = new QStringPath(this.withPrefix("testString"), undefined, OPTS);
  public readonly testAny = new QStringPath(this.withPrefix("testAny"), undefined, OPTS);
  public readonly multipleIds = new QCollectionPath(this.withPrefix("multipleIds"), () => QGuidCollection);
  public readonly multipleStrings = new QCollectionPath(this.withPrefix("multipleStrings"), () => QStringCollection);
}

export const qBook = new QBook();
