import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QAbstractEntity, QExtendedFromAbstract, QExtendedFromOpen, QOpenEntity } from "./QTester.js";
import {
  qAbstractEntity,
  qExtendedFromAbstract,
  QExtendedFromAbstractId,
  qExtendedFromOpen,
  QExtendedFromOpenId,
  qOpenEntity,
  // @ts-ignore
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
  // @ts-ignore
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

export class AbstractEntityService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  AbstractEntity,
  EditableAbstractEntity,
  QAbstractEntity,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qAbstractEntity, options);
  }

  public asOpenEntityService() {
    const { client, path, options } = this.__base;
    return new OpenEntityService(client, path, "Tester.OpenEntity", { ...options, subtype: true });
  }

  public asExtendedFromAbstractService() {
    const { client, path, options } = this.__base;
    return new ExtendedFromAbstractService(client, path, "Tester.ExtendedFromAbstract", { ...options, subtype: true });
  }

  public asExtendedFromOpenService() {
    const { client, path, options } = this.__base;
    return new ExtendedFromOpenService(client, path, "Tester.ExtendedFromOpen", { ...options, subtype: true });
  }
}

export class OpenEntityService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  OpenEntity,
  EditableOpenEntity,
  QOpenEntity,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qOpenEntity, options);
  }

  public asExtendedFromOpenService() {
    const { client, path, options } = this.__base;
    return new ExtendedFromOpenService(client, path, "Tester.ExtendedFromOpen", { ...options, subtype: true });
  }
}

export class ExtendedFromAbstractService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  ExtendedFromAbstract,
  EditableExtendedFromAbstract,
  QExtendedFromAbstract,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qExtendedFromAbstract, options);
  }
}

export class ExtendedFromAbstractCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  ExtendedFromAbstract,
  EditableExtendedFromAbstract,
  QExtendedFromAbstract,
  ExtendedFromAbstractId,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qExtendedFromAbstract, new QExtendedFromAbstractId(name), options);
  }
}

export class ExtendedFromOpenService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  ExtendedFromOpen,
  EditableExtendedFromOpen,
  QExtendedFromOpen,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qExtendedFromOpen, options);
  }
}

export class ExtendedFromOpenCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  ExtendedFromOpen,
  EditableExtendedFromOpen,
  QExtendedFromOpen,
  ExtendedFromOpenId,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qExtendedFromOpen, new QExtendedFromOpenId(name), options);
  }
}
