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

import { GetSomethingFunctionParams } from "../PersonModel";

export class QPersonV2 extends QueryObject {
  public readonly userName = new QStringV2Path(this.withPrefix("UserName"));
  public readonly age = new QNumberPath(this.withPrefix("Age"));
  public readonly favFeature = new QEnumPath(this.withPrefix("FavFeature"));
  public readonly features = new QCollectionPath(this.withPrefix("Features"), () => QEnumCollection);
  public readonly friends = new QEntityCollectionPath(this.withPrefix("Friends"), () => QPersonV2);
  public readonly bestFriend = new QEntityPath(this.withPrefix("BestFriend"), () => QPersonV2);

  constructor(path?: string) {
    super(path);
  }
}
export const qPersonV2 = new QPersonV2();

export class QGetSomethingFunction extends QFunction<GetSomethingFunctionParams> {
  constructor() {
    super("GET_SOMETHING", true);
  }

  getParams() {
    return [
      new QGuidV2Param("testGuid"),
      new QDateTimeV2Param("testDateTime"),
      new QDateTimeOffsetV2Param("testDateTimeO"),
      new QTimeV2Param("testTime"),
    ];
  }
}
