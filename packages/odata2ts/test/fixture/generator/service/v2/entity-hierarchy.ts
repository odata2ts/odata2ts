import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV2, EntityTypeServiceV2, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QChild, QChildId, QGrandParent, QGrandParentId, QParent, qChild, qGrandParent, qParent } from "./QTester";
// @ts-ignore
import {
  Child,
  ChildId,
  EditableChild,
  EditableGrandParent,
  EditableParent,
  GrandParent,
  GrandParentId,
  Parent,
} from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {}

export class GrandParentService<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  GrandParent,
  EditableGrandParent,
  QGrandParent
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qGrandParent);
  }
}

export class GrandParentCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  GrandParent,
  EditableGrandParent,
  QGrandParent,
  GrandParentId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qGrandParent, new QGrandParentId(name));
  }
}

export class ParentService<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  Parent,
  EditableParent,
  QParent
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qParent);
  }
}

export class ParentCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
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
