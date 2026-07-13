import {
  QDateTimeOffsetV2Param,
  QDateTimeV2Param,
  QEntityCollectionPath,
  QEntityPath,
  QEnumCollectionPath,
  QEnumPath,
  QFunction,
  QGuidV2Param,
  QNumberPath,
  QStringV2Path,
  QTimeV2Param,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import { numberToStringConverter, stringToPrefixModelConverter } from "@odata2ts/test-converters";
import { Feature, GetSomethingFunctionParams, PersonModel } from "../PersonModel";

export class QPersonV2 extends QueryObject<PersonModel> {
  public readonly userName = new QStringV2Path(this.withPrefix("UserName"));
  public readonly age = new QNumberPath(this.withPrefix("Age"), numberToStringConverter);
  public readonly favFeature = new QEnumPath(this.withPrefix("FavFeature"), Feature);
  public readonly features = new QEnumCollectionPath(this.withPrefix("Features"), Feature);
  public readonly friends = new QEntityCollectionPath(this.withPrefix("Friends"), () => QPersonV2);
  public readonly bestFriend = new QEntityPath(this.withPrefix("BestFriend"), () => QPersonV2);
}

export const qPersonV2 = new QPersonV2();

export class QGetSomethingFunction extends QFunction<GetSomethingFunctionParams, void> {
  constructor() {
    super("GET_SOMETHING", undefined, { v2Mode: true });
  }

  getParams() {
    return [
      new QGuidV2Param("TEST_GUID", "testGuid", stringToPrefixModelConverter),
      new QDateTimeV2Param("testDateTime"),
      new QDateTimeOffsetV2Param("testDateTimeO"),
      new QTimeV2Param("testTime"),
    ];
  }
}
