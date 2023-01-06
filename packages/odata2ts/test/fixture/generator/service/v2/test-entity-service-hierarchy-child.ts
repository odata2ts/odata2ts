import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityServiceResolver, EntitySetServiceV2, EntityTypeServiceV2 } from "@odata2ts/odata-service";

// @ts-ignore
import { QChild, QChildId, qChild } from "../QTester";
// @ts-ignore
import { Child, ChildId, EditableChild } from "../TesterModel";

export class ChildService<ClientType extends ODataClient> extends EntityTypeServiceV2<
  ClientType,
  Child,
  EditableChild,
  QChild
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qChild);
  }
}

export class ChildCollectionService<ClientType extends ODataClient> extends EntitySetServiceV2<
  ClientType,
  Child,
  EditableChild,
  QChild,
  ChildId,
  ChildService<ClientType>
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qChild, ChildService, new QChildId(name));
  }
}

export function createChildServiceResolver(client: ODataClient, basePath: string, entityName: string) {
  return new EntityServiceResolver(client, basePath, entityName, QChildId, ChildService, ChildCollectionService);
}
