import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV2, EntityTypeServiceV2, ODataService } from "@odata2ts/odata-service";

import {
  QExtendedFromAbstract,
  QExtendedFromAbstractId,
  QExtendedFromOpen,
  QExtendedFromOpenId,
  QOpenEntity,
  QOpenEntityId,
  qExtendedFromAbstract,
  qExtendedFromOpen,
  qOpenEntity,
  // @ts-ignore
} from "./QTester";
import {
  EditableExtendedFromAbstract,
  EditableExtendedFromOpen,
  EditableOpenEntity,
  ExtendedFromAbstract,
  ExtendedFromAbstractId,
  ExtendedFromOpen,
  ExtendedFromOpenId,
  OpenEntity,
  OpenEntityId,
  // @ts-ignore
} from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public fromAbstract(): ExtendedFromAbstractCollectionService<ClientType>;
  public fromAbstract(id: ExtendedFromAbstractId): ExtendedFromAbstractService<ClientType>;
  public fromAbstract(id?: ExtendedFromAbstractId | undefined) {
    const fieldName = "FromAbstract";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new ExtendedFromAbstractCollectionService(client, path, fieldName)
      : new ExtendedFromAbstractService(client, path, new QExtendedFromAbstractId(fieldName).buildUrl(id));
  }

  public fromOpen(): ExtendedFromOpenCollectionService<ClientType>;
  public fromOpen(id: ExtendedFromOpenId): ExtendedFromOpenService<ClientType>;
  public fromOpen(id?: ExtendedFromOpenId | undefined) {
    const fieldName = "FromOpen";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new ExtendedFromOpenCollectionService(client, path, fieldName)
      : new ExtendedFromOpenService(client, path, new QExtendedFromOpenId(fieldName).buildUrl(id));
  }
}

export class OpenEntityService<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  OpenEntity,
  EditableOpenEntity,
  QOpenEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qOpenEntity);
  }
}

export class OpenEntityCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  OpenEntity,
  EditableOpenEntity,
  QOpenEntity,
  OpenEntityId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qOpenEntity, new QOpenEntityId(name));
  }
}

export class ExtendedFromAbstractService<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  ExtendedFromAbstract,
  EditableExtendedFromAbstract,
  QExtendedFromAbstract
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qExtendedFromAbstract);
  }
}

export class ExtendedFromAbstractCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  ExtendedFromAbstract,
  EditableExtendedFromAbstract,
  QExtendedFromAbstract,
  ExtendedFromAbstractId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qExtendedFromAbstract, new QExtendedFromAbstractId(name));
  }
}

export class ExtendedFromOpenService<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  ExtendedFromOpen,
  EditableExtendedFromOpen,
  QExtendedFromOpen
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qExtendedFromOpen);
  }
}

export class ExtendedFromOpenCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  ExtendedFromOpen,
  EditableExtendedFromOpen,
  QExtendedFromOpen,
  ExtendedFromOpenId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qExtendedFromOpen, new QExtendedFromOpenId(name));
  }
}
