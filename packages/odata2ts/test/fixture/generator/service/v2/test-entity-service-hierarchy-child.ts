import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV2, EntityTypeServiceV2 } from "@odata2ts/odata-service";

// @ts-ignore
import { QChild, QChildId, qChild } from "../QTester";
// @ts-ignore
import { Child, ChildId, EditableChild } from "../TesterModel";

export class ChildService<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  Child,
  EditableChild,
  QChild
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qChild);
  }
}

export class ChildCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  Child,
  EditableChild,
  QChild,
  ChildId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qChild, new QChildId(name));
  }
}
