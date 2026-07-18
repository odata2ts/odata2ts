import { ODataCollectionResponseV4, ODataModelResponseV4, ODataValueResponseV4 } from "@odata2ts/odata-core";

export type ValueModificationResponseV4<Response extends boolean, T> = Response extends true
  ? ODataValueResponseV4<T>
  : undefined;

export type EntityModificationResponseV4<Response extends boolean | undefined, T> = Response extends true
  ? ODataModelResponseV4<T>
  : undefined;

export type CollectionModificationResponseV4<Response extends boolean | undefined, T> = Response extends true
  ? ODataCollectionResponseV4<T>
  : undefined;
