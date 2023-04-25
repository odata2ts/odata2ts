import { ODataClient } from "@odata2ts/odata-client-api";
import { EntitySetServiceV2, EntityTypeServiceV2 } from "@odata2ts/odata-service";

// @ts-ignore
import { QGrandParentId, QParent, qParent } from "../QTester";
// @ts-ignore
import { EditableParent, GrandParentId, Parent } from "../TesterModel";

export class ParentService<ClientType extends ODataClient> extends EntityTypeServiceV2<
  ClientType,
  Parent,
  EditableParent,
  QParent
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qParent);
  }
}

export class ParentCollectionService<ClientType extends ODataClient> extends EntitySetServiceV2<
  ClientType,
  Parent,
  EditableParent,
  QParent,
  GrandParentId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qParent, new QGrandParentId(name));
  }
}
