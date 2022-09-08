import {
  QBinaryCollection,
  QBinaryPath,
  QBooleanCollection,
  QBooleanParam,
  QBooleanPath,
  QCollectionPath,
  QDateTimeOffsetV2Collection,
  QDateTimeOffsetV2Path,
  QDateTimeV2Collection,
  QDateTimeV2Path,
  QFunction,
  QGuidV2Collection,
  QGuidV2Param,
  QGuidV2Path,
  QNumberCollection,
  QNumberParam,
  QNumberPath,
  QStringV2Collection,
  QStringV2Path,
  QTimeV2Collection,
  QTimeV2Path,
  QueryObject,
} from "@odata2ts/odata-query-objects";

// @ts-ignore
import { BookId } from "./TesterModel";

export class QBook extends QueryObject {
  public readonly id = new QGuidV2Path(this.withPrefix("id"));
  public readonly id2 = new QNumberPath(this.withPrefix("id2"));
  public readonly id3 = new QBooleanPath(this.withPrefix("id3"));
  public readonly requiredOption = new QBooleanPath(this.withPrefix("requiredOption"));
  public readonly time = new QTimeV2Path(this.withPrefix("time"));
  public readonly optionalDate = new QDateTimeV2Path(this.withPrefix("optionalDate"));
  public readonly dateTimeOffset = new QDateTimeOffsetV2Path(this.withPrefix("dateTimeOffset"));
  public readonly testByte = new QNumberPath(this.withPrefix("testByte"));
  public readonly testSByte = new QNumberPath(this.withPrefix("testSByte"));
  public readonly testInt16 = new QNumberPath(this.withPrefix("testInt16"));
  public readonly testInt32 = new QNumberPath(this.withPrefix("testInt32"));
  public readonly testInt64 = new QNumberPath(this.withPrefix("testInt64"));
  public readonly testSingle = new QNumberPath(this.withPrefix("testSingle"));
  public readonly testDouble = new QNumberPath(this.withPrefix("testDouble"));
  public readonly testDecimal = new QNumberPath(this.withPrefix("TestDecimal"));
  public readonly testBinary = new QBinaryPath(this.withPrefix("testBinary"));
  public readonly testAny = new QStringV2Path(this.withPrefix("testAny"));
  public readonly multipleIds = new QCollectionPath(this.withPrefix("multipleIds"), () => QGuidV2Collection);
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
}

export const qBook = new QBook();

export class QBookId extends QFunction<BookId> {
  private readonly params = [new QGuidV2Param("id"), new QNumberParam("id2"), new QBooleanParam("id3")];

  constructor(path: string) {
    super(path, "");
  }

  getParams() {
    return this.params;
  }
}
