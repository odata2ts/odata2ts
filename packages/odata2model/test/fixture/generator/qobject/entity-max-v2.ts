import {
  QueryObject,
  QGuidPath,
  QBooleanPath,
  QTimeV2Path,
  QDateTimeV2Path,
  QDateTimeOffsetV2Path,
  QNumberPath,
  QBinaryPath,
  QStringV2Path,
  QCollectionPath,
  QGuidCollection,
  QStringV2Collection,
  QBooleanCollection,
  QTimeV2Collection,
  QDateTimeV2Collection,
  QDateTimeOffsetV2Collection,
  QNumberCollection,
  QBinaryCollection,
} from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly requiredOption = new QBooleanPath(this.withPrefix("requiredOption"));
  public readonly time = new QTimeV2Path(this.withPrefix("time"));
  public readonly optionalDate = new QDateTimeV2Path(this.withPrefix("optionalDate"));
  public readonly dateTimeOffset = new QDateTimeOffsetV2Path(this.withPrefix("dateTimeOffset"));
  public readonly testDecimal = new QNumberPath(this.withPrefix("TestDecimal"));
  public readonly testInt16 = new QNumberPath(this.withPrefix("testInt16"));
  public readonly testInt32 = new QNumberPath(this.withPrefix("testInt32"));
  public readonly testInt64 = new QNumberPath(this.withPrefix("testInt64"));
  public readonly testSingle = new QNumberPath(this.withPrefix("testSingle"));
  public readonly testByte = new QNumberPath(this.withPrefix("testByte"));
  public readonly testSByte = new QNumberPath(this.withPrefix("testSByte"));
  public readonly testDouble = new QNumberPath(this.withPrefix("testDouble"));
  public readonly testBinary = new QBinaryPath(this.withPrefix("testBinary"));
  public readonly testAny = new QStringV2Path(this.withPrefix("testAny"));
  public readonly multipleIds = new QCollectionPath(this.withPrefix("multipleIds"), () => QGuidCollection);
  public readonly multipleStrings = new QCollectionPath(this.withPrefix("multipleStrings"), () => QStringV2Collection);
  public readonly multipleBooleans = new QCollectionPath(this.withPrefix("multipleBooleans"), () => QBooleanCollection);
  public readonly multipleTimes = new QCollectionPath(this.withPrefix("multipleTimes"), () => QTimeV2Collection);
  public readonly multipleDateTimes = new QCollectionPath(
    this.withPrefix("multipleDateTimes"),
    () => QDateTimeV2Collection
  );
  public readonly multipleDateTimeOffsets = new QCollectionPath(
    this.withPrefix("multipleDateTimeOffsets"),
    () => QDateTimeOffsetV2Collection
  );
  public readonly multipleInt16 = new QCollectionPath(this.withPrefix("multipleInt16"), () => QNumberCollection);
  public readonly multipleDecimals = new QCollectionPath(this.withPrefix("multipleDecimals"), () => QNumberCollection);
  public readonly multipleBinaries = new QCollectionPath(this.withPrefix("multipleBinaries"), () => QBinaryCollection);

  constructor(path?: string) {
    super(path);
  }
}

export const qBook = new QBook();
