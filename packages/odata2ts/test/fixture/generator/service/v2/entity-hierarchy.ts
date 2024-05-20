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

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public tests(): ChildCollectionService<ClientType>;
  public tests(id: ChildId): ChildService<ClientType>;
  public tests(id?: ChildId | undefined) {
    const fieldName = "tests";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new ChildCollectionService(client, path, fieldName)
      : new ChildService(client, path, new QChildId(fieldName).buildUrl(id));
  }
}

export class GrandParentService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  GrandParent,
  EditableGrandParent,
  QGrandParent
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qGrandParent);
  }
}

export class GrandParentCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV2<
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

export class ParentService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  Parent,
  EditableParent,
  QParent
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qParent);
  }
}

export class ParentCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV2<
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

export class ChildService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  Child,
  EditableChild,
  QChild
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qChild);
  }
}

export class ChildCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV2<
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
