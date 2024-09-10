import {
  QDateParam,
  QDateTimeOffsetParam,
  QEntityCollectionPath,
  QEntityPath,
  QEnumCollectionPath,
  QEnumPath,
  QFunction,
  QGuidParam,
  QNumberPath,
  QStringPath,
  QTimeOfDayParam,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import { numberToStringConverter, stringToPrefixModelConverter } from "@odata2ts/test-converters";
import { EditablePersonModel, Feature, GetSomethingFunctionParams } from "../PersonModel";

export class QPersonV4 extends QueryObject<EditablePersonModel> {
  public readonly userName = new QStringPath(this.withPrefix("UserName"));
  public readonly Age = new QNumberPath(this.withPrefix("Age"), numberToStringConverter);
  public readonly FavFeature = new QEnumPath(this.withPrefix("FavFeature"), Feature);
  public readonly Features = new QEnumCollectionPath(this.withPrefix("Features"), Feature);
  public readonly Friends = new QEntityCollectionPath(this.withPrefix("Friends"), () => QPersonV4);
  public readonly BestFriend = new QEntityPath(this.withPrefix("BestFriend"), () => QPersonV4);
}

export const qPersonV4 = new QPersonV4();

export class QGetSomethingFunction extends QFunction<GetSomethingFunctionParams> {
  constructor() {
    super("GET_SOMETHING");
  }

  getParams() {
    return [
      new QGuidParam("TEST_GUID", "testGuid", stringToPrefixModelConverter),
      new QDateParam("testDateTime"),
      new QDateTimeOffsetParam("testDateTimeO"),
      new QTimeOfDayParam("testTime"),
    ];
  }
}
