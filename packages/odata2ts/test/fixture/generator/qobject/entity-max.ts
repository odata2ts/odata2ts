import {
  QBinaryCollection,
  QBinaryPath,
  QBooleanCollection,
  QBooleanParam,
  QBooleanPath,
  QCollectionPath,
  QDateCollection,
  QDatePath,
  QDateTimeOffsetCollection,
  QDateTimeOffsetPath,
  QGuidCollection,
  QGuidParam,
  QGuidPath,
  QId,
  QNumberCollection,
  QNumberParam,
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
  public readonly id2 = new QNumberPath(this.withPrefix("id2"));
  public readonly id3 = new QBooleanPath(this.withPrefix("id3"));
  public readonly truth = new QBooleanPath(this.withPrefix("requiredOption"));
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

export class QBookId extends QId<BookId> {
  private readonly params = [new QGuidParam("id"), new QNumberParam("id2"), new QBooleanParam("id3")];

  getParams() {
    return this.params;
  }
}
