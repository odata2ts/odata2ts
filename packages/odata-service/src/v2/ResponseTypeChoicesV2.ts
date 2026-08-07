import { ODataCollectionResponseV2, ODataCollectionResponseV4 } from "@odata2ts/odata-core";

export type CollectionModificationResponseV2<
  Response extends boolean,
  T,
  AsV4 extends boolean = false,
> = Response extends true
  ? AsV4 extends true
    ? ODataCollectionResponseV4<T>
    : ODataCollectionResponseV2<T>
  : undefined;
