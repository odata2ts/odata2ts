import { ODataCollectionResponseV2 } from "@odata2ts/odata-core";

export type CollectionModificationResponseV2<Response extends boolean, T> = Response extends true
  ? ODataCollectionResponseV2<T>
  : undefined;
