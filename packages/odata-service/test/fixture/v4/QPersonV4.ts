import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import {
  ModelResponseConverterV4,
  QDateParam,
  QDateTimeOffsetParam,
  QEntityCollectionPath,
  QEntityPath,
  QEnumCollectionPath,
  QEnumPath,
  QFunctionV4,
  QGuidParam,
  QNumberPath,
  QStringPath,
  QTimeOfDayParam,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import { numberToStringConverter, stringToPrefixModelConverter } from "@odata2ts/test-converters";
import { EditablePersonModel, Feature, GetSomethingFunctionParams, PersonModel } from "../PersonModel";

export class QPersonV4 extends QueryObject<PersonModel> {
  public readonly userName = new QStringPath(this.withPrefix("UserName"));
  public readonly age = new QNumberPath(this.withPrefix("Age"), numberToStringConverter);
  public readonly favFeature = new QEnumPath(this.withPrefix("FavFeature"), Feature);
  public readonly features = new QEnumCollectionPath(this.withPrefix("Features"), Feature);
  public readonly friends = new QEntityCollectionPath(this.withPrefix("Friends"), () => QPersonV4);
  public readonly bestFriend = new QEntityPath(this.withPrefix("BestFriend"), () => QPersonV4);
}

export const qPersonV4 = new QPersonV4();

export class QGetSomethingFunction extends QFunctionV4<GetSomethingFunctionParams, ODataModelResponseV4<PersonModel>> {
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

export class QGetSomethingComposable extends QFunctionV4<
  GetSomethingFunctionParams,
  ODataModelResponseV4<PersonModel>
> {
  constructor() {
    super("GET_SOMETHING", new ModelResponseConverterV4(new QPersonV4()));
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
