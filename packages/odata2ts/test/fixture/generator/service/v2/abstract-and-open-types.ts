import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV2, EntityTypeServiceV2, ODataService, ODataServiceOptions } from "@odata2ts/odata-service";
import type { QAbstractEntity, QExtendedFromAbstract, QExtendedFromOpen, QOpenEntity } from "./QTester.js";
import {
  qAbstractEntity,
  qExtendedFromAbstract,
  QExtendedFromAbstractId,
  qExtendedFromOpen,
  QExtendedFromOpenId,
  qOpenEntity,
} from "./QTester.js";
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
  UpdatableExtendedFromAbstract,
  UpdatableExtendedFromOpen,
} from "./TesterModel.js";

export class TesterService extends ODataService {
  public fromAbstract(): ExtendedFromAbstractCollectionService;
  public fromAbstract(id: ExtendedFromAbstractId): ExtendedFromAbstractService;
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

  public fromOpen(): ExtendedFromOpenCollectionService;
  public fromOpen(id: ExtendedFromOpenId): ExtendedFromOpenService;
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

export class AbstractEntityService extends EntityTypeServiceV2<
  AbstractEntity,
  EditableAbstractEntity,
  QAbstractEntity
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qAbstractEntity, options);
  }
}

export class OpenEntityService extends EntityTypeServiceV2<OpenEntity, EditableOpenEntity, QOpenEntity> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qOpenEntity, options);
  }
}

export class ExtendedFromAbstractService extends EntityTypeServiceV2<
  ExtendedFromAbstract,
  UpdatableExtendedFromAbstract,
  QExtendedFromAbstract
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qExtendedFromAbstract, options);
  }
}

export class ExtendedFromAbstractCollectionService extends EntitySetServiceV2<
  ExtendedFromAbstract,
  EditableExtendedFromAbstract,
  QExtendedFromAbstract,
  ExtendedFromAbstractId
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qExtendedFromAbstract, new QExtendedFromAbstractId(name), options);
  }
}

export class ExtendedFromOpenService extends EntityTypeServiceV2<
  ExtendedFromOpen,
  UpdatableExtendedFromOpen,
  QExtendedFromOpen
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qExtendedFromOpen, options);
  }
}

export class ExtendedFromOpenCollectionService extends EntitySetServiceV2<
  ExtendedFromOpen,
  EditableExtendedFromOpen,
  QExtendedFromOpen,
  ExtendedFromOpenId
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qExtendedFromOpen, new QExtendedFromOpenId(name), options);
  }
}
