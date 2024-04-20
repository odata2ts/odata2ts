import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

import {
  QAbstractEntity,
  QExtendedFromAbstract,
  QExtendedFromAbstractId,
  QExtendedFromOpen,
  QExtendedFromOpenId,
  QOpenEntity,
  qAbstractEntity,
  qExtendedFromAbstract,
  qExtendedFromOpen,
  qOpenEntity,
  // @ts-ignore
} from "./QTester";
import {
  AbstractEntity,
  EditableAbstractEntity,
  EditableExtendedFromAbstract,
  EditableExtendedFromOpen,
  EditableOpenEntity,
  ExtendedFromAbstract,
  ExtendedFromAbstractId,
  ExtendedFromOpen,
  ExtendedFromOpenId,
  OpenEntity,
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

export class AbstractEntityService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  AbstractEntity,
  EditableAbstractEntity,
  QAbstractEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qAbstractEntity);
  }
}

export class OpenEntityService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  OpenEntity,
  EditableOpenEntity,
  QOpenEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qOpenEntity);
  }
}

export class ExtendedFromAbstractService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  ExtendedFromAbstract,
  EditableExtendedFromAbstract,
  QExtendedFromAbstract
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qExtendedFromAbstract);
  }
}

export class ExtendedFromAbstractCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
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

export class ExtendedFromOpenService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  ExtendedFromOpen,
  EditableExtendedFromOpen,
  QExtendedFromOpen
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qExtendedFromOpen);
  }
}

export class ExtendedFromOpenCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
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
