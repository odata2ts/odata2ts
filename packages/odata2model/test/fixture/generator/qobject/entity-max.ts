import {
  QueryObject,
  QGuidPath,
  QBooleanPath,
  QTimeOfDayPath,
  QDatePath,
  QDateTimeOffsetPath,
  QNumberPath,
  QBinaryPath,
  QStringPath,
  QCollectionPath,
  QStringCollection,
  QNumberCollection,
  QBooleanCollection,
} from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly requiredOption = new QBooleanPath(this.withPrefix("requiredOption"));
  public readonly time = new QTimeOfDayPath(this.withPrefix("time"));
  public readonly optionalDate = new QDatePath(this.withPrefix("optionalDate"));
  public readonly dateTimeOffset = new QDateTimeOffsetPath(this.withPrefix("dateTimeOffset"));
  public readonly testDecimal = new QNumberPath(this.withPrefix("TestDecimal"));
  public readonly testBinary = new QBinaryPath(this.withPrefix("testBinary"));
  public readonly testAny = new QStringPath(this.withPrefix("testAny"));
  public readonly multipleStrings = new QCollectionPath(this.withPrefix("multipleStrings"), () => QStringCollection);
  public readonly multipleNumbers = new QCollectionPath(this.withPrefix("multipleNumbers"), () => QNumberCollection);
  public readonly multipleBooleans = new QCollectionPath(this.withPrefix("multipleBooleans"), () => QBooleanCollection);

  constructor(path?: string) {
    super(path);
  }
}

export const qBook = new QBook();
