import {
  QueryObject,
  QGuidPath,
  QBooleanPath,
  QTimeV2Path,
  QDateTimeV2Path,
  QDateTimeOffsetV2Path,
  QStringPath,
  QNumberPath,
  QBinaryPath,
  QCollectionPath,
  QStringCollection,
  QNumberCollection,
  QBooleanCollection,
} from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly requiredOption = new QBooleanPath(this.withPrefix("requiredOption"));
  public readonly time = new QTimeV2Path(this.withPrefix("time"));
  public readonly optionalDate = new QDateTimeV2Path(this.withPrefix("optionalDate"));
  public readonly dateTimeOffset = new QDateTimeOffsetV2Path(this.withPrefix("dateTimeOffset"));
  public readonly testDecimal = new QStringPath(this.withPrefix("TestDecimal"));
  public readonly testNumber = new QNumberPath(this.withPrefix("testNumber"));
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
