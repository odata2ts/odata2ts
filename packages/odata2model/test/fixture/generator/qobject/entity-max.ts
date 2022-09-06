import {
  QBinaryCollection,
  QBinaryPath,
  QBooleanCollection,
  QBooleanPath,
  QCollectionPath,
  QDateCollection,
  QDatePath,
  QDateTimeOffsetCollection,
  QDateTimeOffsetPath,
  QFunction,
  QGuidCollection,
  QGuidParam,
  QGuidPath,
  QNumberCollection,
  QNumberPath,
  QStringCollection,
  QStringPath,
  QTimeOfDayCollection,
  QTimeOfDayPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";

// @ts-ignore
import { BookId } from "./TesterModel";

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
  public readonly multipleIds = new QCollectionPath(this.withPrefix("multipleIds"), () => QGuidCollection);
  public readonly multipleTimes = new QCollectionPath(this.withPrefix("multipleTimes"), () => QTimeOfDayCollection);
  public readonly multipleDates = new QCollectionPath(this.withPrefix("multipleDates"), () => QDateCollection);
  public readonly multipleDateTimeOffsets = new QCollectionPath(
    this.withPrefix("multipleDateTimeOffsets"),
    () => QDateTimeOffsetCollection
  );
  public readonly multipleBinaries = new QCollectionPath(this.withPrefix("multipleBinaries"), () => QBinaryCollection);
}

export const qBook = new QBook();

export class QBookId extends QFunction<BookId> {
  private readonly params = [new QGuidParam("id")];

  constructor(path: string) {
    super(path, "Book");
  }

  getParams() {
    return this.params;
  }
}
