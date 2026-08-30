import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV2, EntityTypeServiceV2, ODataService, ODataServiceOptions } from "@odata2ts/odata-service";
// @ts-ignore
import type { QChild, QGrandParent, QParent } from "./QTester.js";
// @ts-ignore
import { qChild, QChildId, qGrandParent, QGrandParentId, qParent } from "./QTester.js";
import type {
  Child,
  ChildId,
  EditableChild,
  EditableGrandParent,
  EditableParent,
  GrandParent,
  GrandParentId,
  Parent,
  // @ts-ignore
} from "./TesterModel.js";

export class TesterService extends ODataService {
  public tests(): ChildCollectionService;
  public tests(id: ChildId): ChildService;
  public tests(id?: ChildId | undefined) {
    const fieldName = "tests";
    const { client, path, options } = this.__base;
    const collection = new ChildCollectionService(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }
}

export class GrandParentService extends EntityTypeServiceV2<GrandParent, EditableGrandParent, QGrandParent> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qGrandParent, options);
  }
}

export class GrandParentCollectionService extends EntitySetServiceV2<
  GrandParent,
  EditableGrandParent,
  QGrandParent,
  GrandParentId,
  GrandParentService
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qGrandParent, new QGrandParentId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptions | undefined,
  ) {
    return new GrandParentService(client, path, name, options);
  }
}

export class ParentService extends EntityTypeServiceV2<Parent, EditableParent, QParent> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qParent, options);
  }
}

export class ParentCollectionService extends EntitySetServiceV2<
  Parent,
  EditableParent,
  QParent,
  GrandParentId,
  ParentService
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qParent, new QGrandParentId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptions | undefined,
  ) {
    return new ParentService(client, path, name, options);
  }
}

export class ChildService extends EntityTypeServiceV2<Child, EditableChild, QChild> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qChild, options);
  }
}

export class ChildCollectionService extends EntitySetServiceV2<Child, EditableChild, QChild, ChildId, ChildService> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qChild, new QChildId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptions | undefined,
  ) {
    return new ChildService(client, path, name, options);
  }
}
