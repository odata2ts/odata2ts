import {
  QCollectionPath,
  QDateTimeOffsetV2Param,
  QDateTimeV2Param,
  QEntityCollectionPath,
  QEntityPath,
  QEnumCollection,
  QEnumPath,
  QFunction,
  QGuidV2Param,
  QNumberPath,
  QStringV2Path,
  QTimeV2Param,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import { numberToStringConverter, stringToPrefixModelConverter } from "@odata2ts/test-converters";

import { GetSomethingFunctionParams, PersonModel } from "../PersonModel";

export class QPersonV2 extends QueryObject<PersonModel> {
  public readonly userName = new QStringV2Path(this.withPrefix("UserName"));
  public readonly Age = new QNumberPath(this.withPrefix("Age"), numberToStringConverter);
  public readonly FavFeature = new QEnumPath(this.withPrefix("FavFeature"));
  public readonly Features = new QCollectionPath(this.withPrefix("Features"), () => QEnumCollection);
  public readonly Friends = new QEntityCollectionPath(this.withPrefix("Friends"), () => QPersonV2);
  public readonly BestFriend = new QEntityPath(this.withPrefix("BestFriend"), () => QPersonV2);
}
export const qPersonV2 = new QPersonV2();

export class QGetSomethingFunction extends QFunction<GetSomethingFunctionParams> {
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
