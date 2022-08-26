import { ODataClient, ODataClientConfig } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV2, EntitySetServiceV2, CollectionServiceV2, compileFunctionPathV2 } from "../../../src";
import {
  QCollectionPath,
  QEntityCollectionPath,
  QEnumPath,
  QNumberPath,
  QEntityPath,
  QueryObject,
  QEnumCollection,
  QStringV2Path,
} from "@odata2ts/odata-query-objects";
import { EditablePersonModel, PersonModel } from "../PersonModel";

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

export class PersonModelService<ClientType extends ODataClient> extends EntityTypeServiceV2<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV2
> {
  public get features() {
    return new CollectionServiceV2(this.client, this.path + "/Features", new QEnumCollection());
  }

  public get bestFriend() {
    return new PersonModelService(this.client, this.path + "/BestFriend");
  }

  public get friends() {
    return new PersonModelCollectionService(this.client, this.path + "/Friends");
  }

  constructor(client: ODataClient, path: string) {
    super(client, path, new QPersonV2());
  }

  public getSomething(
    params: { testGuid: string; testDateTime: string; testDateTimeO: string; testTime: string },
    requestConfig?: ODataClientConfig<ClientType>
  ) {
    const url = compileFunctionPathV2(this.getPath(), "GetAnything", {
      testGuid: { isLiteral: false, typePrefix: "guid", value: params.testGuid },
      testDateTime: { isLiteral: false, typePrefix: "datetime", value: params.testDateTime },
      testDateTimeO: { isLiteral: false, typePrefix: "datetimeoffset", value: params.testDateTimeO },
      testTime: { isLiteral: false, typePrefix: "time", value: params.testTime },
    });
    return this.client.get(url, requestConfig);
  }
}

export class PersonModelCollectionService<ClientType extends ODataClient> extends EntitySetServiceV2<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV2,
  string | { UserName: string },
  PersonModelService<ClientType>
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qPersonV2, PersonModelService, [
      { isLiteral: false, type: "string", name: "userName", odataName: "UserName" },
    ]);
  }
}
