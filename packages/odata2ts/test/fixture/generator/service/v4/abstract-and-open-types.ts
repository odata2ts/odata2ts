import type { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QAbstractEntity, QExtendedFromAbstract, QExtendedFromOpen, QOpenEntity } from "./QTester";
import {
  qAbstractEntity,
  qExtendedFromAbstract,
  QExtendedFromAbstractId,
  qExtendedFromOpen,
  QExtendedFromOpenId,
  qOpenEntity,
  // @ts-ignore
} from "./QTester";
import type {
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

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public fromAbstract(): ExtendedFromAbstractCollectionService<ClientType>;
  public fromAbstract(id: ExtendedFromAbstractId): ExtendedFromAbstractService<ClientType>;
  public fromAbstract(id?: ExtendedFromAbstractId | undefined) {
    const fieldName = "FromAbstract";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new ExtendedFromAbstractCollectionService(client, path, fieldName, options)
      : new ExtendedFromAbstractService(
          client,
          path,
          new QExtendedFromAbstractId(fieldName).buildUrl(id, isUrlNotEncoded()),
          options,
        );
  }

  public fromOpen(): ExtendedFromOpenCollectionService<ClientType>;
  public fromOpen(id: ExtendedFromOpenId): ExtendedFromOpenService<ClientType>;
  public fromOpen(id?: ExtendedFromOpenId | undefined) {
    const fieldName = "FromOpen";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new ExtendedFromOpenCollectionService(client, path, fieldName, options)
      : new ExtendedFromOpenService(
          client,
          path,
          new QExtendedFromOpenId(fieldName).buildUrl(id, isUrlNotEncoded()),
          options,
        );
  }
}

export class AbstractEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  AbstractEntity,
  EditableAbstractEntity,
  QAbstractEntity
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qAbstractEntity, options);
  }
}

export class OpenEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  OpenEntity,
  EditableOpenEntity,
  QOpenEntity
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qOpenEntity, options);
  }
}

export class ExtendedFromAbstractService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  ExtendedFromAbstract,
  EditableExtendedFromAbstract,
  QExtendedFromAbstract
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qExtendedFromAbstract, options);
  }
}

export class ExtendedFromAbstractCollectionService<
  in out ClientType extends ODataHttpClient,
> extends EntitySetServiceV4<
  ClientType,
  ExtendedFromAbstract,
  EditableExtendedFromAbstract,
  QExtendedFromAbstract,
  ExtendedFromAbstractId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qExtendedFromAbstract, new QExtendedFromAbstractId(name), options);
  }
}

export class ExtendedFromOpenService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  ExtendedFromOpen,
  EditableExtendedFromOpen,
  QExtendedFromOpen
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qExtendedFromOpen, options);
  }
}

export class ExtendedFromOpenCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  ExtendedFromOpen,
  EditableExtendedFromOpen,
  QExtendedFromOpen,
  ExtendedFromOpenId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qExtendedFromOpen, new QExtendedFromOpenId(name), options);
  }
}
