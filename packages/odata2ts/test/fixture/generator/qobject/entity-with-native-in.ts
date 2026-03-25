import {
  QBooleanPath,
  QCollectionPath,
  QDateTimeOffsetV2Path,
  QDateTimeV2Path,
  QGuidV2Collection,
  QNumberV2Path,
  QStringV2Collection,
  QStringV2Path,
  QTimeV2Path,
  QueryObject,
} from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QNumberV2Path(this.withPrefix("id"), undefined, { nativeIn: true });
  public readonly testBoolean = new QBooleanPath(this.withPrefix("testBoolean"), undefined, { nativeIn: true });
  public readonly testTime = new QTimeV2Path(this.withPrefix("testTime"), undefined, { nativeIn: true });
  public readonly testDate = new QDateTimeV2Path(this.withPrefix("testDate"), undefined, { nativeIn: true });
  public readonly testDateTimeOffset = new QDateTimeOffsetV2Path(this.withPrefix("testDateTimeOffset"), undefined, {
    nativeIn: true,
  });
  public readonly testString = new QStringV2Path(this.withPrefix("testString"), undefined, { nativeIn: true });
  public readonly testAny = new QStringV2Path(this.withPrefix("testAny"), undefined, { nativeIn: true });
  public readonly multipleIds = new QCollectionPath(this.withPrefix("multipleIds"), () => QGuidV2Collection);
  public readonly multipleStrings = new QCollectionPath(this.withPrefix("multipleStrings"), () => QStringV2Collection);
}

export const qBook = new QBook();
